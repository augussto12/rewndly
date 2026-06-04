using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Rewndly.Api.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddRewndlyHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        var builder = services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy());

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            builder.AddNpgSql(connectionString, name: "postgres");
        }

        return services;
    }
}
