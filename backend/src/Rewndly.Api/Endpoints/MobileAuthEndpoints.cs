using FluentValidation;
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

public static class MobileAuthEndpoints
{
    public static IEndpointRouteBuilder MapMobileAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/mobile/auth")
            .WithTags("Mobile Auth")
            .RequireRateLimiting("auth");

        group.MapPost("/register", RegisterAsync).AllowAnonymous();
        group.MapPost("/login", LoginAsync).AllowAnonymous();
        group.MapPost("/refresh", RefreshAsync).AllowAnonymous();
        group.MapPost("/logout", LogoutAsync).RequireAuthorization(AuthPolicies.RequireUser);

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
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var usernameExists = await dbContext.Users
            .AnyAsync(user => user.Username.ToLower() == username.ToLowerInvariant(), cancellationToken);
        if (usernameExists)
        {
            return Results.Conflict(new { message = "Username is already registered." });
        }

        var emailExists = await dbContext.Users
            .AnyAsync(user => user.Email.ToLower() == email, cancellationToken);
        if (emailExists)
        {
            return Results.Conflict(new { message = "Email is already registered." });
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

        await AddSystemEventAsync(dbContext, SystemEventType.UserRegistered, user.Id, httpContext);

        var refreshToken = CreateRefreshToken(user.Id, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(refreshToken.StoredToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToMobileAuthResponse(user, accessTokenGenerator.Generate(user), refreshToken));
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
            await AddSystemEventAsync(dbContext, SystemEventType.UserLoginFailed, user?.Id, httpContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Unauthorized();
        }

        user.LastLoginAt = dateTimeProvider.UtcNow;
        var refreshToken = CreateRefreshToken(user.Id, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(refreshToken.StoredToken);

        await AddSystemEventAsync(dbContext, SystemEventType.UserLoggedIn, user.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToMobileAuthResponse(user, accessTokenGenerator.Generate(user), refreshToken));
    }

    private static async Task<IResult> RefreshAsync(
        MobileRefreshRequest request,
        IValidator<MobileRefreshRequest> validator,
        AppDbContext dbContext,
        IAccessTokenGenerator accessTokenGenerator,
        IRefreshTokenGenerator refreshTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var tokenHash = refreshTokenGenerator.HashToken(request.RefreshToken);
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
            await AddSystemEventAsync(dbContext, SystemEventType.RefreshTokenReuseDetected, storedToken.UserId, httpContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Unauthorized();
        }

        if (storedToken.ExpiresAt <= dateTimeProvider.UtcNow ||
            storedToken.User is null ||
            storedToken.User.IsDisabled)
        {
            storedToken.RevokedAt = dateTimeProvider.UtcNow;
            storedToken.RevokedByIp = GetIpAddress(httpContext);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Unauthorized();
        }

        var replacement = CreateRefreshToken(storedToken.UserId, refreshTokenGenerator, jwtOptions.Value, dateTimeProvider, httpContext);
        dbContext.RefreshTokens.Add(replacement.StoredToken);
        storedToken.RevokedAt = dateTimeProvider.UtcNow;
        storedToken.RevokedByIp = GetIpAddress(httpContext);
        storedToken.ReplacedByTokenId = replacement.StoredToken.Id;

        await AddSystemEventAsync(dbContext, SystemEventType.RefreshTokenRotated, storedToken.UserId, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToMobileAuthResponse(storedToken.User, accessTokenGenerator.Generate(storedToken.User), replacement));
    }

    private static async Task<IResult> LogoutAsync(
        MobileLogoutRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IRefreshTokenGenerator refreshTokenGenerator,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var tokenHash = refreshTokenGenerator.HashToken(request.RefreshToken);
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

        await AddSystemEventAsync(dbContext, SystemEventType.UserLoggedOut, currentUser.UserId, httpContext);
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

    private static MobileAuthResponse ToMobileAuthResponse(User user, AccessTokenResult accessToken, CreatedRefreshToken refreshToken)
    {
        return new MobileAuthResponse(
            accessToken.AccessToken,
            accessToken.ExpiresAt,
            refreshToken.RawToken,
            refreshToken.StoredToken.ExpiresAt,
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
        HttpContext httpContext)
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
