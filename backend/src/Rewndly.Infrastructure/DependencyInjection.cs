using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Infrastructure.ExternalServices;
using Rewndly.Infrastructure.ExternalServices.MdbList;
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
        services.Configure<MdbListOptions>(configuration.GetSection(MdbListOptions.SectionName));
        services.PostConfigure<MdbListOptions>(options =>
        {
            options.ApiKey = FirstNonBlank(configuration["MDBLIST_API_KEY"], options.ApiKey);
            options.BaseUrl = FirstNonBlank(configuration["MDBLIST_BASE_URL"], options.BaseUrl);
            if (options.Enabled && string.IsNullOrWhiteSpace(options.ApiKey))
            {
                options.Enabled = false;
            }
        });
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
        services.AddHttpClient<TmdbClient>((serviceProvider, client) =>
        {
            var tmdbOptions = configuration.GetSection(TmdbOptions.SectionName).Get<TmdbOptions>() ?? new TmdbOptions();
            tmdbOptions.BaseUrl = configuration["TMDB_BASE_URL"] ?? tmdbOptions.BaseUrl;
            client.BaseAddress = new Uri(tmdbOptions.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(tmdbOptions.TimeoutSeconds);
        });
        services.AddHttpClient<MdbListClient>((serviceProvider, client) =>
        {
            var mdbListOptions = configuration.GetSection(MdbListOptions.SectionName).Get<MdbListOptions>() ?? new MdbListOptions();
            mdbListOptions.BaseUrl = configuration["MDBLIST_BASE_URL"] ?? mdbListOptions.BaseUrl;
            client.BaseAddress = new Uri(mdbListOptions.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(mdbListOptions.TimeoutSeconds, 1, 30));
        });
        services.AddScoped<MdbListRatingsService>();
        services.AddScoped<IExternalMediaRankingService, MdbListRankingService>();
        services.AddScoped<IExternalMediaRatingsService>(serviceProvider => serviceProvider.GetRequiredService<MdbListRatingsService>());
        services.AddScoped<IPublicMediaService, EnrichedPublicMediaService>();
        services.AddScoped<ITmdbReadOnlyGateway>(serviceProvider => serviceProvider.GetRequiredService<TmdbClient>());
        services.AddScoped<ITmdbAccountService>(serviceProvider => serviceProvider.GetRequiredService<TmdbClient>());

        return services;
    }

    private static string FirstNonBlank(string? preferred, string fallback)
    {
        return string.IsNullOrWhiteSpace(preferred) ? fallback : preferred;
    }
}
