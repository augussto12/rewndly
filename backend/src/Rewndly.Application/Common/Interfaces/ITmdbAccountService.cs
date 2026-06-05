using Rewndly.Application.Modules.Tmdb;

namespace Rewndly.Application.Common.Interfaces;

public interface ITmdbAccountService
{
    Task<TmdbConnectResponse> CreateRequestTokenAsync(string authorizationRedirectUrl, CancellationToken cancellationToken);

    Task<string> CreateSessionAsync(string requestToken, CancellationToken cancellationToken);

    Task DeleteSessionAsync(string sessionId, CancellationToken cancellationToken);

    Task<TmdbAccountDetailsResponse> GetAccountDetailsAsync(string sessionId, CancellationToken cancellationToken);

    Task<TmdbMediaAccountStateResponse> GetMediaAccountStateAsync(string mediaType, int tmdbId, string sessionId, CancellationToken cancellationToken);

    Task SetFavoriteAsync(int accountId, string sessionId, string mediaType, int tmdbId, bool value, CancellationToken cancellationToken);

    Task SetWatchlistAsync(int accountId, string sessionId, string mediaType, int tmdbId, bool value, CancellationToken cancellationToken);

    Task SetRatingAsync(string sessionId, string mediaType, int tmdbId, decimal value, CancellationToken cancellationToken);

    Task DeleteRatingAsync(string sessionId, string mediaType, int tmdbId, CancellationToken cancellationToken);

    Task<TmdbAccountLibraryResponse> GetAccountLibraryAsync(int accountId, string sessionId, CancellationToken cancellationToken);
}
