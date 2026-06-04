namespace Rewndly.Application.Modules.Public;

public sealed record PublicHomeResponse(
    IReadOnlyList<MediaSummaryResponse> TrendingMovies,
    IReadOnlyList<MediaSummaryResponse> NowPlayingMovies,
    IReadOnlyList<MediaSummaryResponse> PopularMovies,
    IReadOnlyList<MediaSummaryResponse> UpcomingMovies,
    IReadOnlyList<MediaSummaryResponse> TrendingSeries,
    IReadOnlyList<MediaSummaryResponse> PopularSeries);

public sealed record MediaSummaryResponse(
    int TmdbId,
    string Title,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? ReleaseDate,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string MediaType);

public sealed record MovieDetailsResponse(
    int TmdbId,
    string Title,
    string? OriginalTitle,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? ReleaseDate,
    int? RuntimeMinutes,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string MediaType);

public sealed record SeriesDetailsResponse(
    int TmdbId,
    string Name,
    string? OriginalName,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? FirstAirDate,
    DateOnly? LastAirDate,
    int? NumberOfSeasons,
    int? NumberOfEpisodes,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string MediaType);

public sealed record GenreResponse(
    int TmdbId,
    string Name);
