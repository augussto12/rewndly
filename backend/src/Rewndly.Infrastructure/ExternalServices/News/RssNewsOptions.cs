namespace Rewndly.Infrastructure.ExternalServices.News;

public sealed class RssNewsOptions
{
    public const string SectionName = "RssNews";

    public bool Enabled { get; set; } = true;

    public string UserAgent { get; set; } = "Rewndly/1.0 (+https://rewndly.com)";

    public int CacheMinutes { get; set; } = 20;

    // TTL corto cuando el agregado sale vacío (todos los feeds fallaron/cancelaron), para no
    // servir "sin noticias" durante 20 min completos ante una falla transitoria.
    public int EmptyCacheMinutes { get; set; } = 3;

    public int MaxItemsPerFeed { get; set; } = 12;

    public int MaxTotal { get; set; } = 48;

    public int TimeoutSeconds { get; set; } = 12;

    /// <summary>Fuentes curadas de noticias de cine. Configurable por appsettings/env.</summary>
    public List<RssFeed> Feeds { get; set; } =
    [
        new("Espinof", "https://www.espinof.com/rss2.xml"),
        new("Variety", "https://variety.com/feed/"),
        new("Deadline", "https://deadline.com/feed/"),
        new("Collider", "https://collider.com/feed/"),
        new("IndieWire", "https://www.indiewire.com/feed/"),
        new("The Hollywood Reporter", "https://www.hollywoodreporter.com/feed/"),
    ];
}

public sealed record RssFeed(string Name, string Url);
