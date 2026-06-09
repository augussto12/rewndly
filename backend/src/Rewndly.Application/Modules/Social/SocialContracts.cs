namespace Rewndly.Application.Modules.Social;

public sealed record FriendshipRequestCreateRequest(string Username);

public sealed record FriendResponse(
    Guid FriendshipId,
    string Username,
    string DisplayName,
    string? AvatarUrl,
    DateTimeOffset CreatedAt);

public sealed record FriendshipRequestResponse(
    Guid Id,
    string Direction,
    string Username,
    string DisplayName,
    string? AvatarUrl,
    DateTimeOffset CreatedAt);

public sealed record PublicUserProfileResponse(
    string Username,
    string DisplayName,
    string? AvatarUrl,
    string? Bio,
    string Visibility,
    bool IsOwner,
    bool IsFriend,
    bool CanViewDetails);

public sealed record UserStatsResponse(
    string Username,
    int LibraryItems,
    int Watched,
    int Reviews,
    int Lists,
    int Friends);

public sealed record PublicReviewResponse(
    Guid Id,
    string Username,
    string DisplayName,
    string MediaType,
    int TmdbId,
    string MediaTitle,
    decimal? RatingSnapshot,
    string Title,
    string Body,
    bool ContainsSpoilers,
    string Visibility,
    DateTimeOffset CreatedAt);

public sealed record PublicListResponse(
    Guid Id,
    string Username,
    string DisplayName,
    string Title,
    string? Description,
    string Visibility,
    int ItemCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PublicListDetailsResponse(
    Guid Id,
    string Username,
    string DisplayName,
    string Title,
    string? Description,
    string Visibility,
    IReadOnlyList<PublicListItemResponse> Items,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PublicListItemResponse(
    Guid Id,
    string MediaType,
    int TmdbId,
    string Title,
    string? PosterUrl,
    int Position,
    DateTimeOffset CreatedAt);

public sealed record FeedResponse(
    IReadOnlyList<ActivityEventResponse> Items,
    int Page,
    int PageSize,
    bool HasMore);

public sealed record ActivityEventResponse(
    Guid Id,
    string EventType,
    string Username,
    string DisplayName,
    string? AvatarUrl,
    string? MediaType,
    int? TmdbId,
    string? MediaTitle,
    string? PosterUrl,
    string? MetadataJson,
    DateTimeOffset CreatedAt);
