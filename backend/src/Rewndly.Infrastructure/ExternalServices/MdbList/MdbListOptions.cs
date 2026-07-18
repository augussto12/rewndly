namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public sealed class MdbListOptions
{
    public const string SectionName = "MdbList";

    public string BaseUrl { get; set; } = "https://api.mdblist.com";

    public string ApiKey { get; set; } = string.Empty;

    public bool Enabled { get; set; } = true;

    public int CacheHours { get; set; } = 24;

    public int NoDataCacheHours { get; set; } = 6;

    public int AuthFailureCooldownMinutes { get; set; } = 60;

    public int RateLimitCooldownMinutes { get; set; } = 15;

    public int RankingCacheHours { get; set; } = 24;

    public int RankingLimit { get; set; } = 100;

    public int ImdbRankingCandidateLimit { get; set; } = 500;

    public int ImdbMinimumVotes { get; set; } = 25000;

    public decimal ImdbPriorMean { get; set; } = 7.0m;

    public int TimeoutSeconds { get; set; } = 15;
}
