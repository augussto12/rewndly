using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public sealed class Movie : Entity, IAuditableEntity
{
    public int TmdbId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? OriginalTitle { get; set; }

    public string? Overview { get; set; }

    public string? PosterPath { get; set; }

    public string? BackdropPath { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public int? RuntimeMinutes { get; set; }

    public string? OriginalLanguage { get; set; }

    public decimal? Popularity { get; set; }

    public decimal? VoteAverage { get; set; }

    public DateTimeOffset? LastSyncedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
