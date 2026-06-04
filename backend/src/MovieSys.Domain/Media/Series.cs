using MovieSys.Domain.Common;

namespace MovieSys.Domain.Media;

public sealed class Series : Entity, IAuditableEntity
{
    public int TmdbId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? OriginalName { get; set; }

    public string? Overview { get; set; }

    public string? PosterPath { get; set; }

    public string? BackdropPath { get; set; }

    public DateOnly? FirstAirDate { get; set; }

    public DateOnly? LastAirDate { get; set; }

    public int? NumberOfSeasons { get; set; }

    public int? NumberOfEpisodes { get; set; }

    public string? OriginalLanguage { get; set; }

    public decimal? Popularity { get; set; }

    public decimal? VoteAverage { get; set; }

    public DateTimeOffset? LastSyncedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
