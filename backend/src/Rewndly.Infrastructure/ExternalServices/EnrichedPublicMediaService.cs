using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;
using Rewndly.Infrastructure.ExternalServices.Tmdb;

namespace Rewndly.Infrastructure.ExternalServices;

public sealed class EnrichedPublicMediaService(
    TmdbClient tmdbClient,
    IExternalMediaRatingsService ratingsService) : IPublicMediaService
{
    private static readonly TimeSpan RatingsTimeout = TimeSpan.FromSeconds(2);

    public Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken) =>
        tmdbClient.GetHomeAsync(cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> SearchMoviesAsync(string query, int page, CancellationToken cancellationToken) =>
        tmdbClient.SearchMoviesAsync(query, page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetTrendingMoviesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetTrendingMoviesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetNowPlayingMoviesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetNowPlayingMoviesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetPopularMoviesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetPopularMoviesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetUpcomingMoviesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetUpcomingMoviesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetTopRatedMoviesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetTopRatedMoviesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> DiscoverMoviesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int? runtimeMax,
        int page,
        CancellationToken cancellationToken) =>
        tmdbClient.DiscoverMoviesAsync(genreId, year, yearFrom, yearTo, watchProviderId, sortBy, minVoteAverage, runtimeMax, page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetMovieCalendarAsync(DateOnly from, DateOnly to, int page, CancellationToken cancellationToken) =>
        tmdbClient.GetMovieCalendarAsync(from, to, page, cancellationToken);

    public async Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        var movieTask = tmdbClient.GetMovieDetailsAsync(tmdbId, cancellationToken);
        var ratingsTask = GetRatingsWithTimeoutAsync(MediaType.Movie, tmdbId, cancellationToken);

        await Task.WhenAll(movieTask, ratingsTask);

        var movie = await movieTask;
        if (movie is null)
        {
            return null;
        }

        var ratings = await ratingsTask;
        return movie with
        {
            ExternalRatings = ratings.Ratings,
            RatingsCachedAt = ratings.CachedAt,
        };
    }

    public Task<PagedResponse<MediaSummaryResponse>> SearchSeriesAsync(string query, int page, CancellationToken cancellationToken) =>
        tmdbClient.SearchSeriesAsync(query, page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetTrendingSeriesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetTrendingSeriesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetPopularSeriesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetPopularSeriesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetTopRatedSeriesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetTopRatedSeriesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetAiringTodaySeriesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetAiringTodaySeriesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetOnTheAirSeriesAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetOnTheAirSeriesAsync(page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> GetSeriesCalendarAsync(DateOnly from, DateOnly to, int page, CancellationToken cancellationToken) =>
        tmdbClient.GetSeriesCalendarAsync(from, to, page, cancellationToken);

    public Task<PagedResponse<MediaSummaryResponse>> DiscoverSeriesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        CancellationToken cancellationToken) =>
        tmdbClient.DiscoverSeriesAsync(genreId, year, yearFrom, yearTo, watchProviderId, sortBy, minVoteAverage, page, cancellationToken);

    public async Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        var seriesTask = tmdbClient.GetSeriesDetailsAsync(tmdbId, cancellationToken);
        var ratingsTask = GetRatingsWithTimeoutAsync(MediaType.Series, tmdbId, cancellationToken);

        await Task.WhenAll(seriesTask, ratingsTask);

        var series = await seriesTask;
        if (series is null)
        {
            return null;
        }

        var ratings = await ratingsTask;
        return series with
        {
            ExternalRatings = ratings.Ratings,
            RatingsCachedAt = ratings.CachedAt,
        };
    }

    public async Task<IReadOnlyList<WatchProviderResponse>> GetWatchProvidersAsync(
        MediaType mediaType,
        int tmdbId,
        CancellationToken cancellationToken)
    {
        return await tmdbClient.GetWatchProvidersAsync(mediaType, tmdbId, cancellationToken);
    }

    public Task<SeasonDetailsResponse?> GetSeasonDetailsAsync(int seriesTmdbId, int seasonNumber, CancellationToken cancellationToken) =>
        tmdbClient.GetSeasonDetailsAsync(seriesTmdbId, seasonNumber, cancellationToken);

    public Task<EpisodeDetailsResponse?> GetEpisodeDetailsAsync(
        int seriesTmdbId,
        int seasonNumber,
        int episodeNumber,
        CancellationToken cancellationToken) =>
        tmdbClient.GetEpisodeDetailsAsync(seriesTmdbId, seasonNumber, episodeNumber, cancellationToken);

    public Task<IReadOnlyList<GenreResponse>> GetMovieGenresAsync(CancellationToken cancellationToken) =>
        tmdbClient.GetMovieGenresAsync(cancellationToken);

    public Task<IReadOnlyList<GenreResponse>> GetSeriesGenresAsync(CancellationToken cancellationToken) =>
        tmdbClient.GetSeriesGenresAsync(cancellationToken);

    public Task<IReadOnlyList<WatchProviderOptionResponse>> GetMovieWatchProvidersAsync(CancellationToken cancellationToken) =>
        tmdbClient.GetMovieWatchProvidersAsync(cancellationToken);

    public Task<IReadOnlyList<WatchProviderOptionResponse>> GetSeriesWatchProvidersAsync(CancellationToken cancellationToken) =>
        tmdbClient.GetSeriesWatchProvidersAsync(cancellationToken);

    public Task<PagedResponse<PersonSummaryResponse>> SearchPeopleAsync(string query, int page, CancellationToken cancellationToken) =>
        tmdbClient.SearchPeopleAsync(query, page, cancellationToken);

    public Task<PagedResponse<PersonSummaryResponse>> GetTrendingPeopleAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetTrendingPeopleAsync(page, cancellationToken);

    public Task<PagedResponse<PersonSummaryResponse>> GetPopularPeopleAsync(int page, CancellationToken cancellationToken) =>
        tmdbClient.GetPopularPeopleAsync(page, cancellationToken);

    public Task<PersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken) =>
        tmdbClient.GetPersonDetailsAsync(tmdbId, cancellationToken);

    public Task<CollectionDetailsResponse?> GetCollectionDetailsAsync(int collectionId, CancellationToken cancellationToken) =>
        tmdbClient.GetCollectionDetailsAsync(collectionId, cancellationToken);

    public Task<CompanyDetailsResponse?> GetCompanyDetailsAsync(int companyId, CancellationToken cancellationToken) =>
        tmdbClient.GetCompanyDetailsAsync(companyId, cancellationToken);

    public Task<NetworkDetailsResponse?> GetNetworkDetailsAsync(int networkId, CancellationToken cancellationToken) =>
        tmdbClient.GetNetworkDetailsAsync(networkId, cancellationToken);

    public Task<KeywordDetailsResponse?> GetKeywordDetailsAsync(int keywordId, CancellationToken cancellationToken) =>
        tmdbClient.GetKeywordDetailsAsync(keywordId, cancellationToken);

    public Task<MediaReviewResponse?> GetTmdbReviewDetailsAsync(string reviewId, CancellationToken cancellationToken) =>
        tmdbClient.GetTmdbReviewDetailsAsync(reviewId, cancellationToken);

    private async Task<ExternalRatingsResponse> GetRatingsWithTimeoutAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken)
    {
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(RatingsTimeout);
            return await ratingsService.GetRatingsAsync(mediaType, tmdbId, timeout.Token);
        }
        catch
        {
            return new ExternalRatingsResponse([], null);
        }
    }
}
