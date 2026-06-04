using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;

namespace Rewndly.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbClient(
    HttpClient httpClient,
    IMemoryCache cache,
    IOptions<TmdbOptions> options,
    ILogger<TmdbClient> logger) : IPublicMediaService
{
    private const string Language = "es-AR";
    private const string Region = "AR";
    private static readonly TimeSpan TrendingTtl = TimeSpan.FromMinutes(45);
    private static readonly TimeSpan PopularTtl = TimeSpan.FromHours(3);
    private static readonly TimeSpan SearchTtl = TimeSpan.FromHours(12);
    private static readonly TimeSpan DetailsTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan GenresTtl = TimeSpan.FromDays(7);
    private readonly TmdbOptions _options = options.Value;

    public async Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken)
    {
        var trendingMovies = await GetTrendingMoviesAsync(cancellationToken);
        var nowPlayingMovies = await GetNowPlayingMoviesAsync(cancellationToken);
        var popularMovies = await GetPopularMoviesAsync(cancellationToken);
        var upcomingMovies = await GetUpcomingMoviesAsync(cancellationToken);
        var trendingSeries = await GetTrendingSeriesAsync(cancellationToken);
        var popularSeries = await GetPopularSeriesAsync(cancellationToken);

        return new PublicHomeResponse(trendingMovies, nowPlayingMovies, popularMovies, upcomingMovies, trendingSeries, popularSeries);
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> SearchMoviesAsync(string query, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuery(query);
        return GetCachedAsync<IReadOnlyList<MediaSummaryResponse>>(
            $"tmdb:movies:search:{normalized}",
            SearchTtl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(
                    $"search/movie?query={Uri.EscapeDataString(normalized)}&include_adult=false&language={Language}&region={Region}&page=1",
                    cancellationToken);
                return response.Results.Select(movie => MapMovieSummary(movie, genres)).ToList();
            });
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingMoviesAsync(CancellationToken cancellationToken)
    {
        return GetMovieListAsync("tmdb:movies:trending", $"trending/movie/week?language={Language}", TrendingTtl, cancellationToken);
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetNowPlayingMoviesAsync(CancellationToken cancellationToken)
    {
        return GetMovieListAsync("tmdb:movies:now-playing", $"movie/now_playing?language={Language}&region={Region}&page=1", PopularTtl, cancellationToken);
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetPopularMoviesAsync(CancellationToken cancellationToken)
    {
        return GetMovieListAsync("tmdb:movies:popular", $"movie/popular?language={Language}&region={Region}&page=1", PopularTtl, cancellationToken);
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetUpcomingMoviesAsync(CancellationToken cancellationToken)
    {
        return GetMovieListAsync("tmdb:movies:upcoming", $"movie/upcoming?language={Language}&region={Region}&page=1", PopularTtl, cancellationToken);
    }

    public Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<MovieDetailsResponse?>(
            $"tmdb:movies:details:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                TmdbMovieDto movie;
                try
                {
                    movie = await GetAsync<TmdbMovieDto>($"movie/{tmdbId}?language={Language}", cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                return new MovieDetailsResponse(
                    movie.Id,
                    movie.Title ?? "Sin título",
                    movie.OriginalTitle,
                    movie.Overview,
                    BuildImageUrl(movie.PosterPath, _options.PosterSize),
                    BuildImageUrl(movie.BackdropPath, _options.BackdropSize),
                    ParseDate(movie.ReleaseDate),
                    movie.Runtime,
                    movie.VoteAverage,
                    movie.Genres?.Select(genre => genre.Name).ToList() ?? [],
                    "Movie");
            });
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> SearchSeriesAsync(string query, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuery(query);
        return GetCachedAsync<IReadOnlyList<MediaSummaryResponse>>(
            $"tmdb:series:search:{normalized}",
            SearchTtl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(
                    $"search/tv?query={Uri.EscapeDataString(normalized)}&include_adult=false&language={Language}&page=1",
                    cancellationToken);
                return response.Results.Select(series => MapSeriesSummary(series, genres)).ToList();
            });
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetTrendingSeriesAsync(CancellationToken cancellationToken)
    {
        return GetSeriesListAsync("tmdb:series:trending", $"trending/tv/week?language={Language}", TrendingTtl, cancellationToken);
    }

    public Task<IReadOnlyList<MediaSummaryResponse>> GetPopularSeriesAsync(CancellationToken cancellationToken)
    {
        return GetSeriesListAsync("tmdb:series:popular", $"tv/popular?language={Language}&page=1", PopularTtl, cancellationToken);
    }

    public Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<SeriesDetailsResponse?>(
            $"tmdb:series:details:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                TmdbSeriesDto series;
                try
                {
                    series = await GetAsync<TmdbSeriesDto>($"tv/{tmdbId}?language={Language}", cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                return new SeriesDetailsResponse(
                    series.Id,
                    series.Name ?? "Sin título",
                    series.OriginalName,
                    series.Overview,
                    BuildImageUrl(series.PosterPath, _options.PosterSize),
                    BuildImageUrl(series.BackdropPath, _options.BackdropSize),
                    ParseDate(series.FirstAirDate),
                    ParseDate(series.LastAirDate),
                    series.NumberOfSeasons,
                    series.NumberOfEpisodes,
                    series.VoteAverage,
                    series.Genres?.Select(genre => genre.Name).ToList() ?? [],
                    "Series");
            });
    }

    public Task<IReadOnlyList<GenreResponse>> GetMovieGenresAsync(CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<GenreResponse>>(
            "tmdb:genres:movies",
            GenresTtl,
            async () =>
            {
                var response = await GetAsync<TmdbGenresResponseDto>($"genre/movie/list?language={Language}", cancellationToken);
                return response.Genres.Select(genre => new GenreResponse(genre.Id, genre.Name)).ToList();
            });
    }

    public Task<IReadOnlyList<GenreResponse>> GetSeriesGenresAsync(CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<GenreResponse>>(
            "tmdb:genres:series",
            GenresTtl,
            async () =>
            {
                var response = await GetAsync<TmdbGenresResponseDto>($"genre/tv/list?language={Language}", cancellationToken);
                return response.Genres.Select(genre => new GenreResponse(genre.Id, genre.Name)).ToList();
            });
    }

    private Task<IReadOnlyList<MediaSummaryResponse>> GetMovieListAsync(
        string cacheKey,
        string path,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<MediaSummaryResponse>>(
            cacheKey,
            ttl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(path, cancellationToken);
                return response.Results.Select(movie => MapMovieSummary(movie, genres)).ToList();
            });
    }

    private Task<IReadOnlyList<MediaSummaryResponse>> GetSeriesListAsync(
        string cacheKey,
        string path,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<MediaSummaryResponse>>(
            cacheKey,
            ttl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(path, cancellationToken);
                return response.Results.Select(series => MapSeriesSummary(series, genres)).ToList();
            });
    }

    private async Task<T> GetCachedAsync<T>(string cacheKey, TimeSpan ttl, Func<Task<T>> factory)
    {
        if (cache.TryGetValue(cacheKey, out T? cached) && cached is not null)
        {
            return cached;
        }

        var value = await factory();
        cache.Set(cacheKey, value, ttl);
        return value;
    }

    private async Task<T> GetAsync<T>(string path, CancellationToken cancellationToken)
    {
        EnsureConfigured();

        using var request = CreateRequest(path);
        using var response = await SendAsync(request, path, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new TmdbNotFoundException("TMDB resource was not found.");
        }

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("TMDB request failed with status {StatusCode} for path {Path}", (int)response.StatusCode, path);
            throw new TmdbExternalException("TMDB request failed.");
        }

        var result = await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken);
        return result ?? throw new TmdbExternalException("TMDB returned an empty response.");
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        string path,
        CancellationToken cancellationToken)
    {
        try
        {
            return await httpClient.SendAsync(request, cancellationToken);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(exception, "TMDB request timed out for path {Path}", path);
            throw new TmdbExternalException("TMDB request timed out.", exception);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "TMDB request failed for path {Path}", path);
            throw new TmdbExternalException("TMDB request failed.", exception);
        }
    }

    private async Task<IReadOnlyDictionary<int, string>> GetMovieGenreMapAsync(CancellationToken cancellationToken)
    {
        var genres = await GetMovieGenresAsync(cancellationToken);
        return genres.ToDictionary(genre => genre.TmdbId, genre => genre.Name);
    }

    private async Task<IReadOnlyDictionary<int, string>> GetSeriesGenreMapAsync(CancellationToken cancellationToken)
    {
        var genres = await GetSeriesGenresAsync(cancellationToken);
        return genres.ToDictionary(genre => genre.TmdbId, genre => genre.Name);
    }

    private MediaSummaryResponse MapMovieSummary(TmdbMovieDto movie, IReadOnlyDictionary<int, string> genres)
    {
        return new MediaSummaryResponse(
            movie.Id,
            movie.Title ?? "Sin título",
            movie.Overview,
            BuildImageUrl(movie.PosterPath, _options.PosterSize),
            BuildImageUrl(movie.BackdropPath, _options.BackdropSize),
            ParseDate(movie.ReleaseDate),
            movie.VoteAverage,
            MapGenreNames(movie.GenreIds, genres),
            "Movie");
    }

    private MediaSummaryResponse MapSeriesSummary(TmdbSeriesDto series, IReadOnlyDictionary<int, string> genres)
    {
        return new MediaSummaryResponse(
            series.Id,
            series.Name ?? "Sin título",
            series.Overview,
            BuildImageUrl(series.PosterPath, _options.PosterSize),
            BuildImageUrl(series.BackdropPath, _options.BackdropSize),
            ParseDate(series.FirstAirDate),
            series.VoteAverage,
            MapGenreNames(series.GenreIds, genres),
            "Series");
    }

    private static IReadOnlyList<string> MapGenreNames(IReadOnlyList<int>? genreIds, IReadOnlyDictionary<int, string> genres)
    {
        return genreIds?
            .Where(genres.ContainsKey)
            .Select(id => genres[id])
            .ToList()
            ?? [];
    }

    private string? BuildImageUrl(string? path, string size)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        return $"{_options.ImageBaseUrl.TrimEnd('/')}/{size}/{path.TrimStart('/')}";
    }

    private static DateOnly? ParseDate(string? value)
    {
        return DateOnly.TryParse(value, out var date) ? date : null;
    }

    private static string NormalizeQuery(string query)
    {
        return query.Trim().ToLowerInvariant();
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) && string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            throw new TmdbExternalException("TMDB credentials are not configured.");
        }
    }

    private HttpRequestMessage CreateRequest(string path)
    {
        var requestPath = string.IsNullOrWhiteSpace(_options.AccessToken) ? AddApiKey(path) : path;
        var request = new HttpRequestMessage(HttpMethod.Get, requestPath);

        if (!string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        }

        return request;
    }

    private string AddApiKey(string path)
    {
        var separator = path.Contains('?') ? '&' : '?';
        return $"{path}{separator}api_key={Uri.EscapeDataString(_options.ApiKey)}";
    }
}
