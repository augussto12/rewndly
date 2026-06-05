using Rewndly.Application.Modules.Public;

namespace Rewndly.Application.Modules.Tmdb;

public sealed record TmdbConnectResponse(
    string RequestToken,
    string AuthorizationUrl,
    DateTimeOffset ExpiresAt);

public sealed record TmdbCompleteConnectionRequest(
    string RequestToken);

public sealed record TmdbConnectionStatusResponse(
    bool IsConnected,
    int? AccountId,
    string? Username,
    string? DisplayName,
    DateTimeOffset? ConnectedAt,
    DateTimeOffset? LastSyncedAt);

public sealed record TmdbAccountDetailsResponse(
    int Id,
    string Username,
    string? Name,
    string? AvatarUrl);

public sealed record TmdbMediaAccountStateResponse(
    bool Favorite,
    bool Watchlist,
    decimal? Rating);

public sealed record TmdbAccountActionRequest(
    bool Value);

public sealed record TmdbRatingRequest(
    decimal Value);

public sealed record TmdbAccountLibraryResponse(
    IReadOnlyList<MediaSummaryResponse> FavoriteMovies,
    IReadOnlyList<MediaSummaryResponse> FavoriteSeries,
    IReadOnlyList<MediaSummaryResponse> WatchlistMovies,
    IReadOnlyList<MediaSummaryResponse> WatchlistSeries,
    IReadOnlyList<MediaSummaryResponse> RatedMovies,
    IReadOnlyList<MediaSummaryResponse> RatedSeries);

public sealed record TmdbAccountSyncResponse(
    int Imported,
    int Updated,
    TmdbAccountLibraryResponse RemoteLibrary);
