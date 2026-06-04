using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Rewndly.Infrastructure.Authentication;

namespace Rewndly.Api.Extensions;

public static class AuthPolicies
{
    public const string RequireUser = "RequireUser";
    public const string RequireAdmin = "RequireAdmin";
    public const string CanAccessAdminPanel = "CanAccessAdminPanel";
    public const string CanManageUsers = "CanManageUsers";
    public const string CanViewAuditLogs = "CanViewAuditLogs";
    public const string CanViewSystemMetrics = "CanViewSystemMetrics";
    public const string CanModerateContent = "CanModerateContent";
}

public static class AuthExtensions
{
    public static IServiceCollection AddRewndlyAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtOptions = configuration
            .GetSection(JwtOptions.SectionName)
            .Get<JwtOptions>()
            ?? new JwtOptions();

        if (string.IsNullOrWhiteSpace(jwtOptions.Secret) || jwtOptions.Secret.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Secret must be configured with at least 32 characters.");
        }

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthPolicies.RequireUser, policy =>
                policy.RequireAuthenticatedUser());

            options.AddPolicy(AuthPolicies.RequireAdmin, policy =>
                policy.RequireRole("Admin"));

            options.AddPolicy(AuthPolicies.CanAccessAdminPanel, policy =>
                policy.RequireRole("Admin"));

            options.AddPolicy(AuthPolicies.CanManageUsers, policy =>
                policy.RequireRole("Admin"));

            options.AddPolicy(AuthPolicies.CanViewAuditLogs, policy =>
                policy.RequireRole("Admin"));

            options.AddPolicy(AuthPolicies.CanViewSystemMetrics, policy =>
                policy.RequireRole("Admin"));

            options.AddPolicy(AuthPolicies.CanModerateContent, policy =>
                policy.RequireRole("Admin"));
        });

        return services;
    }
}
