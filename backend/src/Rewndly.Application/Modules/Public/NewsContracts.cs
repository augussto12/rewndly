namespace Rewndly.Application.Modules.Public;

public sealed record NewsArticleResponse(
    string Title,
    string Url,
    string Source,
    string? ImageUrl,
    string? Summary,
    DateTimeOffset? PublishedAt);

public sealed record NewsFeedResponse(
    IReadOnlyList<NewsArticleResponse> Articles,
    DateTimeOffset? FetchedAt);
