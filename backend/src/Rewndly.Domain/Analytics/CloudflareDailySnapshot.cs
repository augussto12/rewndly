using Rewndly.Domain.Common;

namespace Rewndly.Domain.Analytics;

/// <summary>
/// Snapshot diario del tráfico del sitio traído de Cloudflare. Persistimos los días que
/// devuelve la API cada vez que se consulta el dashboard, para ir acumulando un histórico
/// propio que sobreviva a la retención acotada del plan free. Nota: la captura es on-demand
/// (al abrir el dashboard), así que si nadie lo mira por más tiempo que la retención de
/// Cloudflare, esos días quedan sin capturar. Un job diario en background lo cerraría del todo.
/// </summary>
public sealed class CloudflareDailySnapshot : Entity
{
    public DateOnly Date { get; set; }

    // Zone analytics (httpRequests1dGroups): incluye bots/crawlers.
    public long Requests { get; set; }

    public long PageViews { get; set; }

    public long Uniques { get; set; }

    public long Bytes { get; set; }

    public long Threats { get; set; }

    // RUM / Web Analytics (rumPageloadEventsAdaptiveGroups): navegadores reales.
    public long? HumanVisits { get; set; }

    public long? HumanPageViews { get; set; }

    public DateTimeOffset FetchedAt { get; set; }
}
