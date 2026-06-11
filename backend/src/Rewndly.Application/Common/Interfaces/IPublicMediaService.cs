using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;

namespace Rewndly.Application.Common.Interfaces;

public interface IPublicMediaService
{
    Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> SearchMoviesAsync(string query, int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetTrendingMoviesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetNowPlayingMoviesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetPopularMoviesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetUpcomingMoviesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetTopRatedMoviesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> DiscoverMoviesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int? runtimeMax,
        int page,
        CancellationToken cancellationToken);

    Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> SearchSeriesAsync(string query, int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetTrendingSeriesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetPopularSeriesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetTopRatedSeriesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetAiringTodaySeriesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> GetOnTheAirSeriesAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<MediaSummaryResponse>> DiscoverSeriesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        CancellationToken cancellationToken);

    Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<IReadOnlyList<WatchProviderResponse>> GetWatchProvidersAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken);

    Task<SeasonDetailsResponse?> GetSeasonDetailsAsync(int seriesTmdbId, int seasonNumber, CancellationToken cancellationToken);

    Task<EpisodeDetailsResponse?> GetEpisodeDetailsAsync(
        int seriesTmdbId,
        int seasonNumber,
        int episodeNumber,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GenreResponse>> GetMovieGenresAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<GenreResponse>> GetSeriesGenresAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<WatchProviderOptionResponse>> GetMovieWatchProvidersAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<WatchProviderOptionResponse>> GetSeriesWatchProvidersAsync(CancellationToken cancellationToken);

    Task<PagedResponse<PersonSummaryResponse>> SearchPeopleAsync(string query, int page, CancellationToken cancellationToken);

    Task<PagedResponse<PersonSummaryResponse>> GetTrendingPeopleAsync(int page, CancellationToken cancellationToken);

    Task<PagedResponse<PersonSummaryResponse>> GetPopularPeopleAsync(int page, CancellationToken cancellationToken);

    Task<PersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<CollectionDetailsResponse?> GetCollectionDetailsAsync(int collectionId, CancellationToken cancellationToken);

    Task<CompanyDetailsResponse?> GetCompanyDetailsAsync(int companyId, CancellationToken cancellationToken);

    Task<NetworkDetailsResponse?> GetNetworkDetailsAsync(int networkId, CancellationToken cancellationToken);

    Task<KeywordDetailsResponse?> GetKeywordDetailsAsync(int keywordId, CancellationToken cancellationToken);

    Task<MediaReviewResponse?> GetTmdbReviewDetailsAsync(string reviewId, CancellationToken cancellationToken);
}
