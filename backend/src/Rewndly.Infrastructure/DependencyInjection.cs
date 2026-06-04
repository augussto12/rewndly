using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Infrastructure.Authentication;
using Rewndly.Infrastructure.ExternalServices.Tmdb;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
        {
            options
                .UseNpgsql(connectionString)
                .UseSnakeCaseNamingConvention();
        });

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<TmdbOptions>(configuration.GetSection(TmdbOptions.SectionName));
        services.PostConfigure<TmdbOptions>(options =>
        {
            options.ApiKey = FirstNonBlank(configuration["TMDB_API_KEY"], options.ApiKey);
            options.AccessToken = FirstNonBlank(configuration["TMDB_ACCESS_TOKEN"], options.AccessToken);
            options.BaseUrl = FirstNonBlank(configuration["TMDB_BASE_URL"], options.BaseUrl);
            options.ImageBaseUrl = FirstNonBlank(configuration["TMDB_IMAGE_BASE_URL"], options.ImageBaseUrl);
        });
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IRefreshTokenGenerator, RefreshTokenGenerator>();
        services.AddScoped<IAccessTokenGenerator, JwtAccessTokenGenerator>();
        services.AddMemoryCache();
        services.AddHttpClient<IPublicMediaService, TmdbClient>((serviceProvider, client) =>
        {
            var tmdbOptions = configuration.GetSection(TmdbOptions.SectionName).Get<TmdbOptions>() ?? new TmdbOptions();
            tmdbOptions.BaseUrl = configuration["TMDB_BASE_URL"] ?? tmdbOptions.BaseUrl;
            client.BaseAddress = new Uri(tmdbOptions.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(tmdbOptions.TimeoutSeconds);
        });

        return services;
    }

    private static string FirstNonBlank(string? preferred, string fallback)
    {
        return string.IsNullOrWhiteSpace(preferred) ? fallback : preferred;
    }
}
