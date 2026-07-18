using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Infrastructure.ExternalServices;
using Rewndly.Infrastructure.ExternalServices.Cloudflare;
using Rewndly.Infrastructure.ExternalServices.MdbList;
using Rewndly.Infrastructure.ExternalServices.Wikidata;
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
        services.AddSingleton<MdbListAvailabilityState>();
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
        services.Configure<CloudflareOptions>(configuration.GetSection(CloudflareOptions.SectionName));
        services.PostConfigure<CloudflareOptions>(cloudflareOptions =>
        {
            cloudflareOptions.ApiToken = FirstNonBlank(configuration["CLOUDFLARE_API_TOKEN"], cloudflareOptions.ApiToken);
            cloudflareOptions.ZoneId = FirstNonBlank(configuration["CLOUDFLARE_ZONE_ID"], cloudflareOptions.ZoneId);
            cloudflareOptions.AccountTag = FirstNonBlank(configuration["CLOUDFLARE_ACCOUNT_TAG"], cloudflareOptions.AccountTag);
            cloudflareOptions.SiteTag = FirstNonBlank(configuration["CLOUDFLARE_SITE_TAG"], cloudflareOptions.SiteTag);
            if (cloudflareOptions.Enabled && !cloudflareOptions.HasZoneAnalytics && !cloudflareOptions.HasRumAnalytics)
            {
                cloudflareOptions.Enabled = false;
            }
        });
        services.AddHttpClient<CloudflareAnalyticsClient>((serviceProvider, client) =>
        {
            var cloudflareOptions = configuration.GetSection(CloudflareOptions.SectionName).Get<CloudflareOptions>() ?? new CloudflareOptions();
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(cloudflareOptions.TimeoutSeconds, 1, 30));
        });
        services.AddScoped<CloudflareAnalyticsService>();
        services.Configure<WikidataOptions>(configuration.GetSection(WikidataOptions.SectionName));
        services.PostConfigure<WikidataOptions>(wikidataOptions =>
        {
            wikidataOptions.UserAgent = FirstNonBlank(configuration["WIKIDATA_USER_AGENT"], wikidataOptions.UserAgent);
        });
        services.AddSingleton<WikidataAvailabilityState>();
        services.AddHttpClient<WikidataClient>((serviceProvider, client) =>
        {
            var wikidataOptions = configuration.GetSection(WikidataOptions.SectionName).Get<WikidataOptions>() ?? new WikidataOptions();
            wikidataOptions.UserAgent = FirstNonBlank(configuration["WIKIDATA_USER_AGENT"], wikidataOptions.UserAgent);
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(wikidataOptions.TimeoutSeconds, 1, 60));
            // User-Agent con contacto es OBLIGATORIO para Wikimedia (sin él, 403).
            client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", wikidataOptions.UserAgent);
        });
        services.AddScoped<WikidataEnrichmentService>();
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
