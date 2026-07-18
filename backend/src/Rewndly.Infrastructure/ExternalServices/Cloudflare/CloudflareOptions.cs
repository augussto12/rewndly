namespace Rewndly.Infrastructure.ExternalServices.Cloudflare;

public sealed class CloudflareOptions
{
    public const string SectionName = "Cloudflare";

    public bool Enabled { get; set; }

    /// <summary>API token con permiso "Account Analytics: Read" (solo lectura).</summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>Zone ID del dominio, para zone analytics (tráfico total, incluye bots).</summary>
    public string ZoneId { get; set; } = string.Empty;

    /// <summary>Account tag, requerido para consultar RUM / Web Analytics.</summary>
    public string AccountTag { get; set; } = string.Empty;

    /// <summary>Site tag del sitio de Web Analytics (RUM), para visitas humanas.</summary>
    public string SiteTag { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.cloudflare.com/client/v4/graphql";

    public int TimeoutSeconds { get; set; } = 15;

    public int CacheMinutes { get; set; } = 15;

    public bool HasZoneAnalytics => !string.IsNullOrWhiteSpace(ApiToken) && !string.IsNullOrWhiteSpace(ZoneId);

    public bool HasRumAnalytics =>
        !string.IsNullOrWhiteSpace(ApiToken)
        && !string.IsNullOrWhiteSpace(AccountTag)
        && !string.IsNullOrWhiteSpace(SiteTag);
}
