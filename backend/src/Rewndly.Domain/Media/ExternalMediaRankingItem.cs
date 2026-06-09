using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public sealed class ExternalMediaRankingItem : Entity
{
    public MediaType MediaType { get; set; }

    public string RankingKey { get; set; } = string.Empty;

    public int Rank { get; set; }

    public int TmdbId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Overview { get; set; }

    public string? PosterUrl { get; set; }

    public string? BackdropUrl { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public decimal? VoteAverage { get; set; }

    public decimal? RankingScore { get; set; }

    public DateTimeOffset FetchedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}
