using MovieSys.Application.Modules.Public;

namespace MovieSys.Application.Common.Interfaces;

public interface IPublicMediaService
{
    Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> SearchMoviesAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetPopularMoviesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetUpcomingMoviesAsync(CancellationToken cancellationToken);

    Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> SearchSeriesAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingSeriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaSummaryResponse>> GetPopularSeriesAsync(CancellationToken cancellationToken);

    Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken);

    Task<IReadOnlyList<GenreResponse>> GetMovieGenresAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<GenreResponse>> GetSeriesGenresAsync(CancellationToken cancellationToken);
}
