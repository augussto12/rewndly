namespace Rewndly.Application.Modules.Admin;

public sealed record AdminDashboardResponse(
    int TotalUsers,
    int ActiveUsers,
    int DisabledUsers,
    int DeletedUsers,
    int NewUsersLast7Days,
    int SavedMovies,
    int SavedSeries,
    int ReviewsCreated,
    int ListsCreated,
    int FriendshipsCreated,
    int SystemActionsLast24Hours,
    int FailedLoginsLast24Hours,
    IReadOnlyList<AdminPopularContentResponse> MostSavedContent,
    IReadOnlyList<AdminTopRatedContentResponse> TopRatedContent);

public sealed record AdminPopularContentResponse(string MediaType, int TmdbId, string Title, int Count);

public sealed record AdminTopRatedContentResponse(string MediaType, int TmdbId, string Title, decimal AverageRating, int RatingCount);

public sealed record AdminActivitySeriesResponse(
    DateOnly From,
    DateOnly To,
    int Days,
    int ActiveUsersToday,
    int ActiveUsersLast7Days,
    int ActiveUsersLast30Days,
    IReadOnlyList<AdminActivityPointResponse> Points);

public sealed record AdminActivityPointResponse(
    DateOnly Date,
    int Registrations,
    int Logins,
    int ActiveUsers,
    int FailedLogins,
    int Reviews,
    int LibraryItems,
    int Lists,
    int Friendships);

public sealed record AdminMdbListStatusResponse(
    bool Enabled,
    bool Available,
    DateTimeOffset? DisabledUntil,
    string? DisabledReason,
    int? DailyRequestLimit,
    int? RequestsUsedToday,
    string? PatronStatus,
    int TitlesWithRatings,
    int TitlesWithoutData);

public sealed record AdminCloudflareResponse(
    bool Enabled,
    bool ZoneConfigured,
    bool RumConfigured,
    bool Live,
    DateOnly From,
    DateOnly To,
    long? HumanVisitsToday,
    long? HumanVisitsLast7Days,
    long TotalRequests,
    long TotalPageViews,
    long TotalUniques,
    IReadOnlyList<AdminCloudflarePointResponse> Points,
    IReadOnlyList<AdminCloudflareCountryResponse> TopCountries,
    DateTimeOffset? FetchedAt);

public sealed record AdminCloudflarePointResponse(
    DateOnly Date,
    long Requests,
    long PageViews,
    long Uniques,
    long? HumanVisits);

public sealed record AdminCloudflareCountryResponse(string Country, long Requests);

public sealed record AdminPagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);

public sealed record AdminUserResponse(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string Role,
    bool IsDisabled,
    bool IsDeleted,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record AdminUserDetailsResponse(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    string? Bio,
    string Role,
    bool MustChangePassword,
    DateTimeOffset? EmailVerifiedAt,
    bool IsDisabled,
    DateTimeOffset? DisabledAt,
    string? DisableReason,
    bool IsDeleted,
    DateTimeOffset? DeletedAt,
    string? DeleteReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record AdminActionRequest(string? Reason);

public sealed record AdminReviewResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string MediaType,
    int TmdbId,
    string MediaTitle,
    decimal? RatingSnapshot,
    string Title,
    bool ContainsSpoilers,
    string Visibility,
    bool IsDeleted,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AdminListResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string Title,
    string? Description,
    string Visibility,
    bool IsDeleted,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AdminSystemEventResponse(
    Guid Id,
    Guid? UserId,
    string EventType,
    string? EntityType,
    Guid? EntityId,
    string? IpAddress,
    string? UserAgent,
    DateTimeOffset CreatedAt);

public sealed record AdminActivityEventResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string EventType,
    string? MediaType,
    int? TmdbId,
    string? MediaTitle,
    DateTimeOffset CreatedAt);

public sealed record AdminAuditLogResponse(
    Guid Id,
    Guid AdminUserId,
    string AdminUsername,
    string Action,
    string TargetType,
    Guid? TargetId,
    string? Reason,
    string? IpAddress,
    string? UserAgent,
    DateTimeOffset CreatedAt);
