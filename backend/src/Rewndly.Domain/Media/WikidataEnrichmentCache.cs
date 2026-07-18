using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public enum WikidataEntityType
{
    Movie = 1,
    Series = 2,
    Person = 3,
}

/// <summary>
/// Cache del enriquecimiento con Wikidata/Wikipedia (premios y, para personas, biografía en
/// español). Los datos de Wikidata son CC0; el texto de Wikipedia es CC BY-SA (se atribuye en UI).
/// </summary>
public sealed class WikidataEnrichmentCache : Entity
{
    public WikidataEntityType EntityType { get; set; }

    public int TmdbId { get; set; }

    /// <summary>QID de Wikidata resuelto (null si la entidad no existe en Wikidata).</summary>
    public string? WikidataId { get; set; }

    /// <summary>Lista de premios serializada (JSON).</summary>
    public string? AwardsJson { get; set; }

    public string? BioExtract { get; set; }

    public string? BioSourceTitle { get; set; }

    public string? BioSourceUrl { get; set; }

    public string? BioThumbnailUrl { get; set; }

    public DateTimeOffset FetchedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}
