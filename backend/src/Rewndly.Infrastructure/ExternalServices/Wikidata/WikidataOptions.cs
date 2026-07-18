namespace Rewndly.Infrastructure.ExternalServices.Wikidata;

public sealed class WikidataOptions
{
    public const string SectionName = "Wikidata";

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// User-Agent descriptivo con contacto. Wikimedia lo EXIGE: sin él (o genérico) devuelve 403.
    /// Formato: Nombre/versión (url-o-email de contacto).
    /// </summary>
    public string UserAgent { get; set; } = "Rewndly/1.0 (+https://rewndly.com; contacto@rewndly.com)";

    public string SparqlUrl { get; set; } = "https://query.wikidata.org/sparql";

    public string WikidataRestUrl { get; set; } = "https://www.wikidata.org/w/rest.php/wikibase/v1";

    public string WikipediaSummaryUrl { get; set; } = "https://es.wikipedia.org/api/rest_v1/page/summary";

    // Los premios y bios cambian poco; cacheamos agresivo (7 días) para respetar el rate limit.
    public int CacheHours { get; set; } = 168;

    public int NoDataCacheHours { get; set; } = 48;

    public int RateLimitCooldownMinutes { get; set; } = 15;

    // Backoff corto cuando el SPARQL falla por 5xx/timeout, para no re-golpear ni bloquear
    // ~20s en cada request mientras query.wikidata.org está degradado.
    public int TransientCooldownMinutes { get; set; } = 2;

    public int MaxAwards { get; set; } = 40;

    public int TimeoutSeconds { get; set; } = 20;
}
