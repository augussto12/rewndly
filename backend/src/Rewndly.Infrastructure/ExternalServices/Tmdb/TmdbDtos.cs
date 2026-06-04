using System.Text.Json.Serialization;

namespace Rewndly.Infrastructure.ExternalServices.Tmdb;

public sealed record TmdbSearchResponseDto<T>(
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("results")] IReadOnlyList<T> Results,
    [property: JsonPropertyName("total_pages")] int TotalPages,
    [property: JsonPropertyName("total_results")] int TotalResults);

public sealed record TmdbMovieDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("original_title")] string? OriginalTitle,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("release_date")] string? ReleaseDate,
    [property: JsonPropertyName("runtime")] int? Runtime,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("genre_ids")] IReadOnlyList<int>? GenreIds,
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto>? Genres);

public sealed record TmdbSeriesDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("original_name")] string? OriginalName,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("first_air_date")] string? FirstAirDate,
    [property: JsonPropertyName("last_air_date")] string? LastAirDate,
    [property: JsonPropertyName("number_of_seasons")] int? NumberOfSeasons,
    [property: JsonPropertyName("number_of_episodes")] int? NumberOfEpisodes,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("genre_ids")] IReadOnlyList<int>? GenreIds,
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto>? Genres);

public sealed record TmdbGenreDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name);

public sealed record TmdbGenresResponseDto(
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto> Genres);

public sealed record TmdbImageOptions(
    string ImageBaseUrl,
    string PosterSize,
    string BackdropSize);
