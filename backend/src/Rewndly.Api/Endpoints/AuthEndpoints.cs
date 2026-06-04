using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Rewndly.Api.Extensions;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Auth;
using Rewndly.Domain.Events;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Authentication;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Api.Endpoints;

public static class AuthEndpoints
{
    private const string RefreshCookieName = "rewndly_refresh_token";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/auth")
            .WithTags("Auth")
            .RequireRateLimiting("auth");

        group.MapPost("/register", RegisterAsync).AllowAnonymous();
        group.MapPost("/login", LoginAsync).AllowAnonymous();
        group.MapPost("/refresh", RefreshAsync).AllowAnonymous();
        group.MapPost("/logout", LogoutAsync).RequireAuthorization(AuthPolicies.RequireUser);
        group.MapPost("/logout-all", LogoutAllAsync).RequireAuthorization(AuthPolicies.RequireUser);
        group.MapGet("/me", MeAsync).RequireAuthorization(AuthPolicies.RequireUser);

        group.MapPost("/request-email-verification", RequestEmailVerificationAsync).AllowAnonymous();
        group.MapPost("/verify-email", VerifyEmailAsync).AllowAnonymous();
        group.MapPost("/forgot-password", ForgotPasswordAsync).AllowAnonymous();
        group.MapPost("/reset-password", ResetPasswordAsync).AllowAnonymous();

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        IValidator<RegisterRequest> validator,
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IAccessTokenGenerator accessTokenGenerator,
        IRefreshTokenGenerator refreshTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var exists = await dbContext.Users
            .AnyAsync(user =>
                user.Username.ToLower() == username.ToLowerInvariant() ||
                user.Email.ToLower() == email,
                cancellationToken);

        if (exists)
        {
            return Results.Conflict(new { message = "Username or email is already registered." });
        }

        var user = new User
        {
            Username = username,
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? username : request.DisplayName.Trim(),
            PasswordHash = passwordHasher.HashPassword(request.Password),
            Role = UserRole.User
        };

        dbContext.Users.Add(user);
        dbContext.UserPrivacySettings.Add(new UserPrivacySettings
        {
            UserId = user.Id,
            ProfileVisibility = ProfileVisibility.Public
        });

        await AddSystemEventAsync(dbContext, SystemEventType.UserRegistered, user.Id, httpContext, cancellationToken);

        var refreshToken = CreateRefreshToken(user.Id, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(refreshToken.StoredToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        SetRefreshCookie(httpContext, refreshToken.RawToken, refreshToken.StoredToken.ExpiresAt, environment);

        var accessToken = accessTokenGenerator.Generate(user);

        return Results.Ok(ToAuthResponse(user, accessToken));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IValidator<LoginRequest> validator,
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IAccessTokenGenerator accessTokenGenerator,
        IRefreshTokenGenerator refreshTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var identifier = request.Identifier.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .FirstOrDefaultAsync(candidate =>
                candidate.Email.ToLower() == identifier ||
                candidate.Username.ToLower() == identifier,
                cancellationToken);

        if (user is null || user.IsDisabled || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            await AddSystemEventAsync(dbContext, SystemEventType.UserLoginFailed, user?.Id, httpContext, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Unauthorized();
        }

        user.LastLoginAt = dateTimeProvider.UtcNow;

        var refreshToken = CreateRefreshToken(user.Id, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(refreshToken.StoredToken);

        await AddSystemEventAsync(dbContext, SystemEventType.UserLoggedIn, user.Id, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        SetRefreshCookie(httpContext, refreshToken.RawToken, refreshToken.StoredToken.ExpiresAt, environment);

        var accessToken = accessTokenGenerator.Generate(user);

        return Results.Ok(ToAuthResponse(user, accessToken));
    }

    private static async Task<IResult> RefreshAsync(
        AppDbContext dbContext,
        IAccessTokenGenerator accessTokenGenerator,
        IRefreshTokenGenerator refreshTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        if (!httpContext.Request.Cookies.TryGetValue(RefreshCookieName, out var rawRefreshToken) ||
            string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return Results.Unauthorized();
        }

        var tokenHash = refreshTokenGenerator.HashToken(rawRefreshToken);
        var storedToken = await dbContext.RefreshTokens
            .Include(token => token.User)
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null)
        {
            return Results.Unauthorized();
        }

        if (storedToken.RevokedAt is not null)
        {
            await RevokeAllUserRefreshTokensAsync(dbContext, storedToken.UserId, dateTimeProvider, httpContext, cancellationToken);
            await AddSystemEventAsync(dbContext, SystemEventType.RefreshTokenReuseDetected, storedToken.UserId, httpContext, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            DeleteRefreshCookie(httpContext, environment);
            return Results.Unauthorized();
        }

        if (storedToken.ExpiresAt <= dateTimeProvider.UtcNow ||
            storedToken.User is null ||
            storedToken.User.IsDisabled)
        {
            storedToken.RevokedAt = dateTimeProvider.UtcNow;
            storedToken.RevokedByIp = GetIpAddress(httpContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            DeleteRefreshCookie(httpContext, environment);
            return Results.Unauthorized();
        }

        var replacement = CreateRefreshToken(storedToken.UserId, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(replacement.StoredToken);
        storedToken.RevokedAt = dateTimeProvider.UtcNow;
        storedToken.RevokedByIp = GetIpAddress(httpContext);
        storedToken.ReplacedByTokenId = replacement.StoredToken.Id;

        await AddSystemEventAsync(dbContext, SystemEventType.RefreshTokenRotated, storedToken.UserId, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        SetRefreshCookie(httpContext, replacement.RawToken, replacement.StoredToken.ExpiresAt, environment);

        var accessToken = accessTokenGenerator.Generate(storedToken.User);

        return Results.Ok(ToAuthResponse(storedToken.User, accessToken));
    }

    private static async Task<IResult> LogoutAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IRefreshTokenGenerator refreshTokenGenerator,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        if (httpContext.Request.Cookies.TryGetValue(RefreshCookieName, out var rawRefreshToken) &&
            !string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            var tokenHash = refreshTokenGenerator.HashToken(rawRefreshToken);
            var storedToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(token =>
                    token.UserId == currentUser.UserId.Value &&
                    token.TokenHash == tokenHash,
                    cancellationToken);

            if (storedToken is not null && storedToken.RevokedAt is null)
            {
                storedToken.RevokedAt = dateTimeProvider.UtcNow;
                storedToken.RevokedByIp = GetIpAddress(httpContext);
            }
        }

        await AddSystemEventAsync(dbContext, SystemEventType.UserLoggedOut, currentUser.UserId, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        DeleteRefreshCookie(httpContext, environment);

        return Results.NoContent();
    }

    private static async Task<IResult> LogoutAllAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        await RevokeAllUserRefreshTokensAsync(dbContext, currentUser.UserId.Value, dateTimeProvider, httpContext, cancellationToken);
        await AddSystemEventAsync(dbContext, SystemEventType.LogoutAll, currentUser.UserId, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        DeleteRefreshCookie(httpContext, environment);

        return Results.NoContent();
    }

    private static async Task<IResult> MeAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == currentUser.UserId.Value, cancellationToken);

        return user is null || user.IsDisabled
            ? Results.Unauthorized()
            : Results.Ok(ToUserResponse(user));
    }

    private static async Task<IResult> RequestEmailVerificationAsync(
        EmailVerificationRequest request,
        IValidator<EmailVerificationRequest> validator,
        AppDbContext dbContext,
        IRefreshTokenGenerator tokenGenerator,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Email == email, cancellationToken);
        string? devToken = null;

        if (user is not null)
        {
            devToken = tokenGenerator.GenerateToken();
            dbContext.EmailVerificationTokens.Add(new EmailVerificationToken
            {
                UserId = user.Id,
                TokenHash = tokenGenerator.HashToken(devToken),
                ExpiresAt = dateTimeProvider.UtcNow.AddHours(24),
                CreatedByIp = GetIpAddress(httpContext)
            });

            await AddSystemEventAsync(dbContext, SystemEventType.EmailVerificationRequested, user.Id, httpContext, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Results.Ok(new
        {
            message = "If the email exists, verification instructions will be issued.",
            developmentToken = environment.IsDevelopment() ? devToken : null
        });
    }

    private static async Task<IResult> VerifyEmailAsync(
        VerifyEmailRequest request,
        IValidator<VerifyEmailRequest> validator,
        AppDbContext dbContext,
        IRefreshTokenGenerator tokenGenerator,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var tokenHash = tokenGenerator.HashToken(request.Token);
        var storedToken = await dbContext.EmailVerificationTokens
            .Include(token => token.User)
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.UsedAt is not null || storedToken.ExpiresAt <= dateTimeProvider.UtcNow || storedToken.User is null)
        {
            return Results.BadRequest(new { message = "Invalid or expired token." });
        }

        storedToken.UsedAt = dateTimeProvider.UtcNow;
        storedToken.User.EmailVerifiedAt = dateTimeProvider.UtcNow;
        await AddSystemEventAsync(dbContext, SystemEventType.EmailVerified, storedToken.UserId, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        IValidator<ForgotPasswordRequest> validator,
        AppDbContext dbContext,
        IRefreshTokenGenerator tokenGenerator,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(candidate => candidate.Email == email, cancellationToken);
        string? devToken = null;

        if (user is not null)
        {
            devToken = tokenGenerator.GenerateToken();
            dbContext.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenGenerator.HashToken(devToken),
                ExpiresAt = dateTimeProvider.UtcNow.AddHours(1),
                RequestedByIp = GetIpAddress(httpContext)
            });

            await AddSystemEventAsync(dbContext, SystemEventType.PasswordResetRequested, user.Id, httpContext, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Results.Ok(new
        {
            message = "If the email exists, password reset instructions will be issued.",
            developmentToken = environment.IsDevelopment() ? devToken : null
        });
    }

    private static async Task<IResult> ResetPasswordAsync(
        ResetPasswordRequest request,
        IValidator<ResetPasswordRequest> validator,
        AppDbContext dbContext,
        IRefreshTokenGenerator tokenGenerator,
        IPasswordHasher passwordHasher,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var tokenHash = tokenGenerator.HashToken(request.Token);
        var storedToken = await dbContext.PasswordResetTokens
            .Include(token => token.User)
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.UsedAt is not null || storedToken.ExpiresAt <= dateTimeProvider.UtcNow || storedToken.User is null)
        {
            return Results.BadRequest(new { message = "Invalid or expired token." });
        }

        storedToken.UsedAt = dateTimeProvider.UtcNow;
        storedToken.UsedByIp = GetIpAddress(httpContext);
        storedToken.User.PasswordHash = passwordHasher.HashPassword(request.NewPassword);
        storedToken.User.MustChangePassword = false;

        await RevokeAllUserRefreshTokensAsync(dbContext, storedToken.UserId, dateTimeProvider, httpContext, cancellationToken);
        await AddSystemEventAsync(dbContext, SystemEventType.PasswordResetCompleted, storedToken.UserId, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static CreatedRefreshToken CreateRefreshToken(
        Guid userId,
        IRefreshTokenGenerator refreshTokenGenerator,
        JwtOptions jwtOptions,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext)
    {
        var rawToken = refreshTokenGenerator.GenerateToken();
        var now = dateTimeProvider.UtcNow;

        return new CreatedRefreshToken(
            rawToken,
            new RefreshToken
            {
                UserId = userId,
                TokenHash = refreshTokenGenerator.HashToken(rawToken),
                CreatedAt = now,
                ExpiresAt = now.AddDays(jwtOptions.RefreshTokenDays),
                CreatedByIp = GetIpAddress(httpContext),
                UserAgent = GetUserAgent(httpContext)
            });
    }

    private static AuthResponse ToAuthResponse(User user, AccessTokenResult accessToken)
    {
        return new AuthResponse(
            accessToken.AccessToken,
            accessToken.ExpiresAt,
            ToUserResponse(user),
            user.MustChangePassword);
    }

    private static AuthUserResponse ToUserResponse(User user)
    {
        return new AuthUserResponse(
            user.Id,
            user.Username,
            user.Email,
            user.DisplayName,
            user.Role.ToString(),
            user.MustChangePassword,
            user.EmailVerifiedAt);
    }

    private static async Task AddSystemEventAsync(
        AppDbContext dbContext,
        SystemEventType eventType,
        Guid? userId,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        dbContext.SystemEvents.Add(new SystemEvent
        {
            UserId = userId,
            EventType = eventType,
            IpAddress = GetIpAddress(httpContext),
            UserAgent = GetUserAgent(httpContext)
        });

        await Task.CompletedTask;
    }

    private static async Task RevokeAllUserRefreshTokensAsync(
        AppDbContext dbContext,
        Guid userId,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var now = dateTimeProvider.UtcNow;
        var ipAddress = GetIpAddress(httpContext);

        var tokens = await dbContext.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null && token.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = now;
            token.RevokedByIp = ipAddress;
        }
    }

    private static void SetRefreshCookie(
        HttpContext httpContext,
        string refreshToken,
        DateTimeOffset expiresAt,
        IHostEnvironment environment)
    {
        httpContext.Response.Cookies.Append(RefreshCookieName, refreshToken, CreateRefreshCookieOptions(expiresAt, environment));
    }

    private static void DeleteRefreshCookie(HttpContext httpContext, IHostEnvironment environment)
    {
        httpContext.Response.Cookies.Delete(RefreshCookieName, CreateRefreshCookieOptions(null, environment));
    }

    private static CookieOptions CreateRefreshCookieOptions(DateTimeOffset? expiresAt, IHostEnvironment environment)
    {
        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = GetConfiguredSameSiteMode(),
            Path = "/api/auth",
            Expires = expiresAt,
            IsEssential = true
        };

        var cookieDomain = Environment.GetEnvironmentVariable("Cookie__Domain");
        if (!string.IsNullOrWhiteSpace(cookieDomain))
        {
            options.Domain = cookieDomain.Trim();
        }

        return options;
    }

    private static SameSiteMode GetConfiguredSameSiteMode()
    {
        var sameSite = Environment.GetEnvironmentVariable("Cookie__SameSite");
        if (string.IsNullOrWhiteSpace(sameSite))
        {
            return SameSiteMode.Lax;
        }

        return Enum.TryParse<SameSiteMode>(sameSite, ignoreCase: true, out var value)
            ? value
            : SameSiteMode.Lax;
    }

    private static string? GetIpAddress(HttpContext httpContext)
    {
        return httpContext.Connection.RemoteIpAddress?.ToString();
    }

    private static string? GetUserAgent(HttpContext httpContext)
    {
        return httpContext.Request.Headers.UserAgent.ToString();
    }

    private sealed record CreatedRefreshToken(string RawToken, RefreshToken StoredToken);
}
