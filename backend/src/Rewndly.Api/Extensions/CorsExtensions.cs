namespace Rewndly.Api.Extensions;

public static class CorsPolicies
{
    public const string Frontend = "Frontend";
}

public static class CorsExtensions
{
    public static IServiceCollection AddRewndlyCors(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? ["http://localhost:5173"];

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicies.Frontend, policy =>
            {
                policy
                    .WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
