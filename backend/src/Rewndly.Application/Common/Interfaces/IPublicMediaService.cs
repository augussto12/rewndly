using Rewndly.Application.Modules.Public;

namespace Rewndly.Application.Common.Interfaces;

public interface IPublicMediaService
{
    Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> SearchMoviesAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetNowPlayingMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetPopularMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetUpcomingMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTopRatedMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> DiscoverMoviesAsync(
        int? genreId,
        int? year,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        CancellationToken cancellationToken);

    Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> SearchSeriesAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingSeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetPopularSeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTopRatedSeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetAiringTodaySeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetOnTheAirSeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> DiscoverSeriesAsync(
        int? genreId,
        int? year,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        CancellationToken cancellationToken);

    Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken);

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

    Task<IReadOnlyList<PersonSummaryResponse>> SearchPeopleAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<PersonSummaryResponse>> GetTrendingPeopleAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<PersonSummaryResponse>> GetPopularPeopleAsync(CancellationToken cancellationToken);

    Task<PersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<CollectionDetailsResponse?> GetCollectionDetailsAsync(int collectionId, CancellationToken cancellationToken);

    Task<CompanyDetailsResponse?> GetCompanyDetailsAsync(int companyId, CancellationToken cancellationToken);

    Task<NetworkDetailsResponse?> GetNetworkDetailsAsync(int networkId, CancellationToken cancellationToken);

    Task<KeywordDetailsResponse?> GetKeywordDetailsAsync(int keywordId, CancellationToken cancellationToken);

    Task<MediaReviewResponse?> GetTmdbReviewDetailsAsync(string reviewId, CancellationToken cancellationToken);
}
