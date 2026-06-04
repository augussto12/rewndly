namespace MovieSys.Application.Modules.UserContent;

public sealed record LibraryItemRequest(
    string MediaType,
    int TmdbId,
    string Status,
    bool IsFavorite,
    int? Rating,
    DateTimeOffset? WatchedAt,
    DateTimeOffset? StartedAt);

public sealed record LibraryItemResponse(
    Guid Id,
    string MediaType,
    int TmdbId,
    string Title,
    string? PosterUrl,
    string Status,
    bool IsFavorite,
    int? Rating,
    DateTimeOffset? WatchedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ReviewRequest(
    string MediaType,
    int TmdbId,
    int? RatingSnapshot,
    string Title,
    string Body,
    bool ContainsSpoilers,
    string Visibility);

public sealed record ReviewResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string MediaType,
    int TmdbId,
    string MediaTitle,
    int? RatingSnapshot,
    string Title,
    string Body,
    bool ContainsSpoilers,
    string Visibility,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record UserListRequest(
    string Title,
    string? Description,
    string Visibility);

public sealed record UserListItemRequest(
    string MediaType,
    int TmdbId,
    int? Position,
    string? Note);

public sealed record UserListResponse(
    Guid Id,
    string Title,
    string? Description,
    string Visibility,
    int ItemCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record UserListDetailsResponse(
    Guid Id,
    string Title,
    string? Description,
    string Visibility,
    IReadOnlyList<UserListItemResponse> Items,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record UserListItemResponse(
    Guid Id,
    string MediaType,
    int TmdbId,
    string Title,
    string? PosterUrl,
    int Position,
    string? Note,
    DateTimeOffset CreatedAt);
