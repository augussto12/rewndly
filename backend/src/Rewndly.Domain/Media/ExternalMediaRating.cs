using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public sealed class ExternalMediaRating : Entity
{
    public const string NoDataSource = "__none";

    public MediaType MediaType { get; set; }

    public int TmdbId { get; set; }

    public string Source { get; set; } = string.Empty;

    public decimal? Value { get; set; }

    public int? Votes { get; set; }

    public decimal? Scale { get; set; }

    public DateTimeOffset FetchedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}
