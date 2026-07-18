using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Application.Modules.Tmdb;

namespace Rewndly.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbClient(
    HttpClient httpClient,
    IMemoryCache cache,
    IOptions<TmdbOptions> options,
    ILogger<TmdbClient> logger) : IPublicMediaService, ITmdbReadOnlyGateway, ITmdbAccountService
{
    private const string Language = "es-AR";
    private const string Region = "AR";
    private static readonly TimeSpan TrendingTtl = TimeSpan.FromMinutes(45);
    private static readonly TimeSpan PopularTtl = TimeSpan.FromHours(3);
    private static readonly TimeSpan SearchTtl = TimeSpan.FromHours(12);
    private static readonly TimeSpan DetailsTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan GenresTtl = TimeSpan.FromDays(7);
    private static readonly TimeSpan ProvidersTtl = TimeSpan.FromDays(3);
    private static readonly TimeSpan DiscoverTtl = TimeSpan.FromHours(2);
    private const int CastLimit = 12;
    private const int RelatedLimit = 12;
    private static readonly IReadOnlySet<string> MovieSortOptions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "popularity.desc",
        "vote_average.desc",
        "primary_release_date.desc",
        "revenue.desc",
    };
    private static readonly IReadOnlySet<string> SeriesSortOptions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "popularity.desc",
        "vote_average.desc",
        "first_air_date.desc",
    };
    private readonly TmdbOptions _options = options.Value;

    public IReadOnlyList<TmdbEndpointInfo> GetPublicReadOnlyEndpoints()
    {
        return TmdbEndpointCatalog.PublicReadOnlyEndpoints
            .Select(endpoint => new TmdbEndpointInfo(endpoint.OperationId, endpoint.Path, endpoint.Summary))
            .ToList();
    }

    public async Task<JsonElement> GetPublicReadOnlyAsync(string path, string queryString, CancellationToken cancellationToken)
    {
        var normalizedPath = NormalizeTmdbPath(path);
        if (!IsAllowedPublicReadOnlyPath(normalizedPath))
        {
            throw new ArgumentException("TMDB endpoint is not in the public read-only allowlist.", nameof(path));
        }

        if (queryString.Contains("api_key", StringComparison.OrdinalIgnoreCase) ||
            queryString.Contains("session_id", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Credential query parameters are not accepted.", nameof(queryString));
        }

        using var request = CreateRequest($"{normalizedPath}{queryString}");
        using var response = await SendAsync(request, normalizedPath, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("TMDB public gateway request failed with status {StatusCode} for path {Path}", (int)response.StatusCode, normalizedPath);
            throw new TmdbExternalException("TMDB request failed.");
        }

        using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
        return document?.RootElement.Clone() ?? throw new TmdbExternalException("TMDB returned an empty response.");
    }

    public async Task<PublicHomeResponse> GetHomeAsync(CancellationToken cancellationToken)
    {
        var trendingMovies = await GetTrendingMoviesAsync(1, cancellationToken);
        var nowPlayingMovies = await GetNowPlayingMoviesAsync(1, cancellationToken);
        var popularMovies = await GetPopularMoviesAsync(1, cancellationToken);
        var upcomingMovies = await GetUpcomingMoviesAsync(1, cancellationToken);
        var trendingSeries = await GetTrendingSeriesAsync(1, cancellationToken);
        var popularSeries = await GetPopularSeriesAsync(1, cancellationToken);
        var trendingPeople = await GetTrendingPeopleAsync(1, cancellationToken);

        return new PublicHomeResponse(
            trendingMovies.Items,
            nowPlayingMovies.Items,
            popularMovies.Items,
            upcomingMovies.Items,
            trendingSeries.Items,
            popularSeries.Items,
            trendingPeople.Items);
    }

    public Task<PagedResponse<MediaSummaryResponse>> SearchMoviesAsync(string query, int page, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuery(query);
        var normalizedPage = NormalizePage(page);
        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            $"tmdb:movies:search:{normalized}:{normalizedPage}",
            SearchTtl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(
                    $"search/movie?query={Uri.EscapeDataString(normalized)}&include_adult=false&language={Language}&region={Region}&page={normalizedPage}",
                    cancellationToken);
                return ToPagedResponse(response, response.Results.Select(movie => MapMovieSummary(movie, genres)).ToList());
            });
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetTrendingMoviesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetMovieListAsync("tmdb:movies:trending", $"trending/movie/week?language={Language}&page={normalizedPage}", normalizedPage, TrendingTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetNowPlayingMoviesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetMovieListAsync("tmdb:movies:now-playing", $"movie/now_playing?language={Language}&region={Region}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetPopularMoviesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetMovieListAsync("tmdb:movies:popular", $"movie/popular?language={Language}&region={Region}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetUpcomingMoviesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetMovieListAsync("tmdb:movies:upcoming", $"movie/upcoming?language={Language}&region={Region}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetTopRatedMoviesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetMovieListAsync("tmdb:movies:top-rated", $"movie/top_rated?language={Language}&region={Region}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetMovieCalendarAsync(DateOnly from, DateOnly to, int page, CancellationToken cancellationToken)
    {
        // Sin region: TMDB filtra y devuelve el primary_release_date, así la fecha del item
        // coincide con la ventana pedida (con region=AR el release_date devuelto es el de AR
        // y puede caer fuera del rango filtrado por primary_release_date).
        var normalizedPage = NormalizePage(page);
        var path = $"discover/movie?language={Language}&include_adult=false&sort_by=popularity.desc" +
            $"&primary_release_date.gte={from:yyyy-MM-dd}&primary_release_date.lte={to:yyyy-MM-dd}&page={normalizedPage}";
        return GetMovieListAsync($"tmdb:movies:calendar:{from:yyyyMMdd}:{to:yyyyMMdd}", path, normalizedPage, DiscoverTtl, cancellationToken);
    }

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
        CancellationToken cancellationToken)
    {
        var normalizedSort = NormalizeSort(sortBy, MovieSortOptions, "popularity.desc");
        var normalizedPage = NormalizePage(page);
        var cacheKey = $"tmdb:movies:discover:{genreId}:{year}:{yearFrom}:{yearTo}:{watchProviderId}:{normalizedSort}:{minVoteAverage}:{runtimeMax}:{normalizedPage}";

        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            cacheKey,
            DiscoverTtl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                var query = BuildDiscoverQuery(normalizedSort, genreId, year, yearFrom, yearTo, watchProviderId, minVoteAverage, runtimeMax, normalizedPage, isMovie: true);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>($"discover/movie?{query}", cancellationToken);
                return ToPagedResponse(response, response.Results.Select(movie => MapMovieSummary(movie, genres)).ToList());
            });
    }

    public Task<MovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<MovieDetailsResponse?>(
            $"tmdb:movies:details:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                TmdbMovieDto movie;
                try
                {
                    movie = await GetAsync<TmdbMovieDto>(
                        $"movie/{tmdbId}?language={Language}&append_to_response=credits,videos,watch/providers,recommendations,similar,images,keywords,reviews,release_dates,external_ids,translations,alternative_titles&include_image_language=es,null,en&include_video_language=es,en,null",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                return new MovieDetailsResponse(
                    movie.Id,
                    movie.Title ?? "Sin título",
                    movie.OriginalTitle,
                    movie.Tagline,
                    movie.Overview,
                    BuildImageUrl(movie.PosterPath, _options.PosterSize),
                    BuildImageUrl(movie.BackdropPath, _options.BackdropSize),
                    ParseDate(movie.ReleaseDate),
                    movie.Runtime,
                    movie.VoteAverage,
                    movie.Genres?.Select(genre => genre.Name).ToList() ?? [],
                    movie.Homepage,
                    MapCollectionSummary(movie.BelongsToCollection),
                    MapCompanySummaries(movie.ProductionCompanies),
                    MapCast(movie.Credits),
                    MapCrew(movie.Credits),
                    MapVideos(movie.Videos),
                    MapWatchProviders(movie.WatchProviders),
                    MapMovieList(movie.Recommendations?.Results, genres).Take(RelatedLimit).ToList(),
                    MapMovieList(movie.Similar?.Results, genres).Take(RelatedLimit).ToList(),
                    MapImages(movie.Images),
                    MapKeywords(movie.Keywords),
                    MapReviews(movie.Reviews),
                    MapExternalLinks(movie.ExternalIds, movie.Homepage),
                    MapAlternativeTitles(movie.AlternativeTitles),
                    MapTranslations(movie.Translations),
                    MapMovieReleaseInfo(movie.ReleaseDates),
                    [],
                    null,
                    "Movie");
            });
    }

    public Task<MediaSummaryResponse?> GetMovieSummaryByIdAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<MediaSummaryResponse?>(
            $"tmdb:movies:summary:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                try
                {
                    var movie = await GetAsync<TmdbMovieDto>($"movie/{tmdbId}?language={Language}", cancellationToken);
                    return new MediaSummaryResponse(
                        movie.Id,
                        movie.Title ?? "Sin titulo",
                        movie.Overview,
                        BuildImageUrl(movie.PosterPath, _options.PosterSize),
                        BuildImageUrl(movie.BackdropPath, _options.BackdropSize),
                        ParseDate(movie.ReleaseDate),
                        movie.VoteAverage,
                        movie.Genres?.Select(genre => genre.Name).ToList() ?? [],
                        "Movie");
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }
            });
    }

    public Task<PagedResponse<MediaSummaryResponse>> SearchSeriesAsync(string query, int page, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuery(query);
        var normalizedPage = NormalizePage(page);
        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            $"tmdb:series:search:{normalized}:{normalizedPage}",
            SearchTtl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(
                    $"search/tv?query={Uri.EscapeDataString(normalized)}&include_adult=false&language={Language}&page={normalizedPage}",
                    cancellationToken);
                return ToPagedResponse(response, response.Results.Select(series => MapSeriesSummary(series, genres)).ToList());
            });
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetTrendingSeriesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetSeriesListAsync("tmdb:series:trending", $"trending/tv/week?language={Language}&page={normalizedPage}", normalizedPage, TrendingTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetPopularSeriesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetSeriesListAsync("tmdb:series:popular", $"tv/popular?language={Language}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetTopRatedSeriesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetSeriesListAsync("tmdb:series:top-rated", $"tv/top_rated?language={Language}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetAiringTodaySeriesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetSeriesListAsync("tmdb:series:airing-today", $"tv/airing_today?language={Language}&timezone=America/Argentina/Buenos_Aires&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetOnTheAirSeriesAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetSeriesListAsync("tmdb:series:on-the-air", $"tv/on_the_air?language={Language}&timezone=America/Argentina/Buenos_Aires&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> GetSeriesCalendarAsync(DateOnly from, DateOnly to, int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        var path = $"discover/tv?language={Language}&include_adult=false&sort_by=popularity.desc" +
            $"&first_air_date.gte={from:yyyy-MM-dd}&first_air_date.lte={to:yyyy-MM-dd}&page={normalizedPage}";
        return GetSeriesListAsync($"tmdb:series:calendar:{from:yyyyMMdd}:{to:yyyyMMdd}", path, normalizedPage, DiscoverTtl, cancellationToken);
    }

    public Task<PagedResponse<MediaSummaryResponse>> DiscoverSeriesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        CancellationToken cancellationToken)
    {
        var normalizedSort = NormalizeSort(sortBy, SeriesSortOptions, "popularity.desc");
        var normalizedPage = NormalizePage(page);
        var cacheKey = $"tmdb:series:discover:{genreId}:{year}:{yearFrom}:{yearTo}:{watchProviderId}:{normalizedSort}:{minVoteAverage}:{normalizedPage}";

        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            cacheKey,
            DiscoverTtl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                var query = BuildDiscoverQuery(normalizedSort, genreId, year, yearFrom, yearTo, watchProviderId, minVoteAverage, null, normalizedPage, isMovie: false);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>($"discover/tv?{query}", cancellationToken);
                return ToPagedResponse(response, response.Results.Select(series => MapSeriesSummary(series, genres)).ToList());
            });
    }

    public Task<SeriesDetailsResponse?> GetSeriesDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<SeriesDetailsResponse?>(
            $"tmdb:series:details:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                TmdbSeriesDto series;
                try
                {
                    series = await GetAsync<TmdbSeriesDto>(
                        $"tv/{tmdbId}?language={Language}&append_to_response=credits,videos,watch/providers,recommendations,similar,images,keywords,reviews,content_ratings,external_ids,translations,alternative_titles&include_image_language=es,null,en&include_video_language=es,en,null",
                        cancellationToken);
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
                    series.Status,
                    series.VoteAverage,
                    series.Genres?.Select(genre => genre.Name).ToList() ?? [],
                    series.Homepage,
                    MapCompanySummaries(series.ProductionCompanies),
                    MapNetworkSummaries(series.Networks),
                    MapCast(series.Credits),
                    MapCrew(series.Credits),
                    MapVideos(series.Videos),
                    MapWatchProviders(series.WatchProviders),
                    MapSeriesList(series.Recommendations?.Results, genres).Take(RelatedLimit).ToList(),
                    MapSeriesList(series.Similar?.Results, genres).Take(RelatedLimit).ToList(),
                    MapImages(series.Images),
                    MapKeywords(series.Keywords),
                    MapReviews(series.Reviews),
                    MapExternalLinks(series.ExternalIds, series.Homepage),
                    MapAlternativeTitles(series.AlternativeTitles),
                    MapTranslations(series.Translations),
                    MapSeriesContentRatings(series.ContentRatings),
                    MapSeasonSummaries(series.Seasons),
                    [],
                    null,
                    "Series");
            });
    }

    public Task<MediaSummaryResponse?> GetSeriesSummaryByIdAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<MediaSummaryResponse?>(
            $"tmdb:series:summary:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                try
                {
                    var series = await GetAsync<TmdbSeriesDto>($"tv/{tmdbId}?language={Language}", cancellationToken);
                    return new MediaSummaryResponse(
                        series.Id,
                        series.Name ?? "Sin titulo",
                        series.Overview,
                        BuildImageUrl(series.PosterPath, _options.PosterSize),
                        BuildImageUrl(series.BackdropPath, _options.BackdropSize),
                        ParseDate(series.FirstAirDate),
                        series.VoteAverage,
                        series.Genres?.Select(genre => genre.Name).ToList() ?? [],
                        "Series");
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }
            });
    }

    public async Task<IReadOnlyList<WatchProviderResponse>> GetWatchProvidersAsync(
        Rewndly.Domain.Media.MediaType mediaType,
        int tmdbId,
        CancellationToken cancellationToken)
    {
        var kind = mediaType == Rewndly.Domain.Media.MediaType.Movie ? "movie" : "tv";
        return await GetCachedAsync<IReadOnlyList<WatchProviderResponse>>(
            $"tmdb:{kind}:watch-providers:{tmdbId}",
            ProvidersTtl,
            async () =>
            {
                try
                {
                    var response = await GetAsync<TmdbWatchProvidersResponseDto>($"{kind}/{tmdbId}/watch/providers", cancellationToken);
                    return MapWatchProviders(response);
                }
                catch (TmdbNotFoundException)
                {
                    return [];
                }
            });
    }

    public Task<SeasonDetailsResponse?> GetSeasonDetailsAsync(int seriesTmdbId, int seasonNumber, CancellationToken cancellationToken)
    {
        return GetCachedAsync<SeasonDetailsResponse?>(
            $"tmdb:series:{seriesTmdbId}:season:{seasonNumber}",
            DetailsTtl,
            async () =>
            {
                TmdbSeasonDto season;
                try
                {
                    season = await GetAsync<TmdbSeasonDto>(
                        $"tv/{seriesTmdbId}/season/{seasonNumber}?language={Language}&append_to_response=credits,videos,watch/providers,images,external_ids,translations&include_image_language=es,null,en&include_video_language=es,en,null",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                return new SeasonDetailsResponse(
                    season.Id,
                    seriesTmdbId,
                    season.SeasonNumber,
                    season.Name ?? $"Temporada {season.SeasonNumber}",
                    season.Overview,
                    BuildImageUrl(season.PosterPath, _options.PosterSize),
                    ParseDate(season.AirDate),
                    season.VoteAverage,
                    MapEpisodeSummaries(season.Episodes),
                    MapCast(season.Credits),
                    MapCrew(season.Credits),
                    MapVideos(season.Videos),
                    MapWatchProviders(season.WatchProviders),
                    MapImages(season.Images),
                    MapExternalLinks(season.ExternalIds, null),
                    MapTranslations(season.Translations));
            });
    }

    public Task<EpisodeDetailsResponse?> GetEpisodeDetailsAsync(
        int seriesTmdbId,
        int seasonNumber,
        int episodeNumber,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<EpisodeDetailsResponse?>(
            $"tmdb:series:{seriesTmdbId}:season:{seasonNumber}:episode:{episodeNumber}",
            DetailsTtl,
            async () =>
            {
                TmdbEpisodeDto episode;
                try
                {
                    episode = await GetAsync<TmdbEpisodeDto>(
                        $"tv/{seriesTmdbId}/season/{seasonNumber}/episode/{episodeNumber}?language={Language}&append_to_response=credits,videos,images,external_ids,translations&include_image_language=es,null,en&include_video_language=es,en,null",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                return new EpisodeDetailsResponse(
                    episode.Id,
                    seriesTmdbId,
                    episode.SeasonNumber,
                    episode.EpisodeNumber,
                    episode.Name ?? $"Episodio {episode.EpisodeNumber}",
                    episode.Overview,
                    BuildImageUrl(episode.StillPath, _options.BackdropSize),
                    ParseDate(episode.AirDate),
                    episode.Runtime,
                    episode.VoteAverage,
                    MapCast(episode.Credits),
                    MapCrew(episode.Credits),
                    MapVideos(episode.Videos),
                    MapImages(episode.Images),
                    MapExternalLinks(episode.ExternalIds, null),
                    MapTranslations(episode.Translations));
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

    public Task<IReadOnlyList<WatchProviderOptionResponse>> GetMovieWatchProvidersAsync(CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<WatchProviderOptionResponse>>(
            "tmdb:watch-providers:movies",
            ProvidersTtl,
            async () =>
            {
                var response = await GetAsync<TmdbWatchProviderListResponseDto>($"watch/providers/movie?language={Language}&watch_region={Region}", cancellationToken);
                return MapProviderOptions(response.Results);
            });
    }

    public Task<IReadOnlyList<WatchProviderOptionResponse>> GetSeriesWatchProvidersAsync(CancellationToken cancellationToken)
    {
        return GetCachedAsync<IReadOnlyList<WatchProviderOptionResponse>>(
            "tmdb:watch-providers:series",
            ProvidersTtl,
            async () =>
            {
                var response = await GetAsync<TmdbWatchProviderListResponseDto>($"watch/providers/tv?language={Language}&watch_region={Region}", cancellationToken);
                return MapProviderOptions(response.Results);
            });
    }

    public Task<PagedResponse<PersonSummaryResponse>> SearchPeopleAsync(string query, int page, CancellationToken cancellationToken)
    {
        var normalized = NormalizeQuery(query);
        var normalizedPage = NormalizePage(page);
        return GetCachedAsync<PagedResponse<PersonSummaryResponse>>(
            $"tmdb:people:search:{normalized}:{normalizedPage}",
            SearchTtl,
            async () =>
            {
                var response = await GetAsync<TmdbSearchResponseDto<TmdbPersonDto>>(
                    $"search/person?query={Uri.EscapeDataString(normalized)}&include_adult=false&language={Language}&page={normalizedPage}",
                    cancellationToken);
                return ToPagedResponse(response, await MapPeopleAsync(response.Results, cancellationToken));
            });
    }

    public Task<PagedResponse<PersonSummaryResponse>> GetTrendingPeopleAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetPeopleListAsync("tmdb:people:trending", $"trending/person/week?language={Language}&page={normalizedPage}", normalizedPage, TrendingTtl, cancellationToken);
    }

    public Task<PagedResponse<PersonSummaryResponse>> GetPopularPeopleAsync(int page, CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        return GetPeopleListAsync("tmdb:people:popular", $"person/popular?language={Language}&page={normalizedPage}", normalizedPage, PopularTtl, cancellationToken);
    }

    public Task<PersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<PersonDetailsResponse?>(
            $"tmdb:people:details:{tmdbId}",
            DetailsTtl,
            async () =>
            {
                TmdbPersonDto person;
                try
                {
                    person = await GetAsync<TmdbPersonDto>(
                        $"person/{tmdbId}?language={Language}&append_to_response=combined_credits,movie_credits,tv_credits,images,tagged_images,external_ids,translations&include_image_language=es,null,en",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                var movieGenres = await GetMovieGenreMapAsync(cancellationToken);
                var seriesGenres = await GetSeriesGenreMapAsync(cancellationToken);

                return new PersonDetailsResponse(
                    person.Id,
                    person.Name ?? "Sin nombre",
                    person.Biography,
                    ParseDate(person.Birthday),
                    ParseDate(person.Deathday),
                    person.PlaceOfBirth,
                    person.KnownForDepartment,
                    BuildImageUrl(person.ProfilePath, _options.PosterSize),
                    person.Homepage,
                    person.ImdbId,
                    MapCombinedCredits(person.CombinedCredits, movieGenres, seriesGenres),
                    MapPersonMovieCredits(person.MovieCredits, movieGenres),
                    MapPersonTvCredits(person.TvCredits, seriesGenres),
                    MapPersonImages(person.Images),
                    MapTaggedImages(person.TaggedImages, movieGenres, seriesGenres),
                    MapPersonExternalLinks(person.ExternalIds, person.Homepage),
                    MapTranslations(person.Translations));
            });
    }

    public Task<CollectionDetailsResponse?> GetCollectionDetailsAsync(int collectionId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<CollectionDetailsResponse?>(
            $"tmdb:collections:details:{collectionId}",
            DetailsTtl,
            async () =>
            {
                TmdbCollectionDto collection;
                try
                {
                    collection = await GetAsync<TmdbCollectionDto>(
                        $"collection/{collectionId}?language={Language}&append_to_response=images,translations&include_image_language=es,null,en",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                var genres = await GetMovieGenreMapAsync(cancellationToken);

                return new CollectionDetailsResponse(
                    collection.Id,
                    collection.Name ?? "Sin titulo",
                    collection.Overview,
                    BuildImageUrl(collection.PosterPath, _options.PosterSize),
                    BuildImageUrl(collection.BackdropPath, _options.BackdropSize),
                    MapMovieList(collection.Parts, genres).ToList(),
                    MapImages(collection.Images),
                    MapTranslations(collection.Translations));
            });
    }

    public Task<CompanyDetailsResponse?> GetCompanyDetailsAsync(int companyId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<CompanyDetailsResponse?>(
            $"tmdb:companies:details:{companyId}",
            DetailsTtl,
            async () =>
            {
                TmdbCompanyDto company;
                try
                {
                    company = await GetAsync<TmdbCompanyDto>(
                        $"company/{companyId}?append_to_response=alternative_names,images",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                var movies = await DiscoverCompanyMoviesAsync(companyId, cancellationToken);
                var series = await DiscoverCompanySeriesAsync(companyId, cancellationToken);

                return new CompanyDetailsResponse(
                    company.Id,
                    company.Name ?? "Sin nombre",
                    company.Description,
                    company.Headquarters,
                    company.Homepage,
                    BuildImageUrl(company.LogoPath, _options.PosterSize),
                    company.OriginCountry,
                    company.ParentCompany is null ? null : MapCompanySummary(company.ParentCompany),
                    MapAliases(company.AlternativeNames),
                    MapImages(company.Images),
                    movies,
                    series);
            });
    }

    public Task<NetworkDetailsResponse?> GetNetworkDetailsAsync(int networkId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<NetworkDetailsResponse?>(
            $"tmdb:networks:details:{networkId}",
            DetailsTtl,
            async () =>
            {
                TmdbNetworkDto network;
                try
                {
                    network = await GetAsync<TmdbNetworkDto>(
                        $"network/{networkId}?append_to_response=alternative_names,images",
                        cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                var series = await DiscoverNetworkSeriesAsync(networkId, cancellationToken);

                return new NetworkDetailsResponse(
                    network.Id,
                    network.Name ?? "Sin nombre",
                    network.Headquarters,
                    network.Homepage,
                    BuildImageUrl(network.LogoPath, _options.PosterSize),
                    network.OriginCountry,
                    MapAliases(network.AlternativeNames),
                    MapImages(network.Images),
                    series);
            });
    }

    public Task<KeywordDetailsResponse?> GetKeywordDetailsAsync(int keywordId, CancellationToken cancellationToken)
    {
        return GetCachedAsync<KeywordDetailsResponse?>(
            $"tmdb:keywords:details:{keywordId}",
            DetailsTtl,
            async () =>
            {
                TmdbKeywordDto keyword;
                try
                {
                    keyword = await GetAsync<TmdbKeywordDto>($"keyword/{keywordId}", cancellationToken);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }

                var movies = await GetKeywordMoviesAsync(keywordId, cancellationToken);
                var series = await DiscoverKeywordSeriesAsync(keywordId, cancellationToken);

                return new KeywordDetailsResponse(keyword.Id, keyword.Name, movies, series);
            });
    }

    public Task<MediaReviewResponse?> GetTmdbReviewDetailsAsync(string reviewId, CancellationToken cancellationToken)
    {
        var normalized = reviewId.Trim();
        return GetCachedAsync<MediaReviewResponse?>(
            $"tmdb:reviews:details:{normalized}",
            DetailsTtl,
            async () =>
            {
                try
                {
                    var review = await GetAsync<TmdbReviewDto>($"review/{Uri.EscapeDataString(normalized)}", cancellationToken);
                    return MapReview(review);
                }
                catch (TmdbNotFoundException)
                {
                    return null;
                }
            });
    }

    public async Task<TmdbConnectResponse> CreateRequestTokenAsync(string authorizationRedirectUrl, CancellationToken cancellationToken)
    {
        var token = await GetAsync<TmdbRequestTokenDto>("authentication/token/new", cancellationToken);
        if (!token.Success || string.IsNullOrWhiteSpace(token.RequestToken))
        {
            throw new TmdbExternalException("TMDB did not return a usable request token.");
        }

        var expiresAt = ParseDateTime(token.ExpiresAt) ?? DateTimeOffset.UtcNow.AddMinutes(15);
        var authorizationUrl =
            $"https://www.themoviedb.org/authenticate/{Uri.EscapeDataString(token.RequestToken)}?redirect_to={Uri.EscapeDataString(authorizationRedirectUrl)}";

        return new TmdbConnectResponse(token.RequestToken, authorizationUrl, expiresAt);
    }

    public async Task<string> CreateSessionAsync(string requestToken, CancellationToken cancellationToken)
    {
        var session = await SendJsonAsync<TmdbSessionDto>(
            HttpMethod.Post,
            "authentication/session/new",
            new TmdbCreateSessionRequestDto(requestToken),
            cancellationToken);

        if (!session.Success || string.IsNullOrWhiteSpace(session.SessionId))
        {
            throw new TmdbExternalException("TMDB did not create a user session.");
        }

        return session.SessionId;
    }

    public async Task DeleteSessionAsync(string sessionId, CancellationToken cancellationToken)
    {
        await SendJsonAsync<TmdbActionResultDto>(
            HttpMethod.Delete,
            "authentication/session",
            new TmdbDeleteSessionRequestDto(sessionId),
            cancellationToken);
    }

    public async Task<TmdbAccountDetailsResponse> GetAccountDetailsAsync(string sessionId, CancellationToken cancellationToken)
    {
        var account = await GetAsync<TmdbAccountDetailsDto>($"account?session_id={Uri.EscapeDataString(sessionId)}", cancellationToken);
        return new TmdbAccountDetailsResponse(
            account.Id,
            account.Username ?? "tmdb",
            account.Name,
            BuildImageUrl(account.Avatar?.Tmdb?.AvatarPath, _options.PosterSize));
    }

    public async Task<TmdbMediaAccountStateResponse> GetMediaAccountStateAsync(
        string mediaType,
        int tmdbId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var pathMediaType = ToTmdbPathMediaType(mediaType);
        var state = await GetAsync<TmdbAccountStateDto>(
            $"{pathMediaType}/{tmdbId}/account_states?session_id={Uri.EscapeDataString(sessionId)}",
            cancellationToken);

        return new TmdbMediaAccountStateResponse(state.Favorite, state.Watchlist, ExtractRating(state.Rated));
    }

    public async Task SetFavoriteAsync(
        int accountId,
        string sessionId,
        string mediaType,
        int tmdbId,
        bool value,
        CancellationToken cancellationToken)
    {
        await SendJsonAsync<TmdbActionResultDto>(
            HttpMethod.Post,
            $"account/{accountId}/favorite?session_id={Uri.EscapeDataString(sessionId)}",
            new TmdbAccountActionDto(ToTmdbBodyMediaType(mediaType), tmdbId, value, null),
            cancellationToken);
    }

    public async Task SetWatchlistAsync(
        int accountId,
        string sessionId,
        string mediaType,
        int tmdbId,
        bool value,
        CancellationToken cancellationToken)
    {
        await SendJsonAsync<TmdbActionResultDto>(
            HttpMethod.Post,
            $"account/{accountId}/watchlist?session_id={Uri.EscapeDataString(sessionId)}",
            new TmdbAccountActionDto(ToTmdbBodyMediaType(mediaType), tmdbId, null, value),
            cancellationToken);
    }

    public async Task SetRatingAsync(
        string sessionId,
        string mediaType,
        int tmdbId,
        decimal value,
        CancellationToken cancellationToken)
    {
        if (value is < 0.5m or > 10m)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "TMDB ratings must be between 0.5 and 10.");
        }

        await SendJsonAsync<TmdbActionResultDto>(
            HttpMethod.Post,
            $"{ToTmdbPathMediaType(mediaType)}/{tmdbId}/rating?session_id={Uri.EscapeDataString(sessionId)}",
            new TmdbRatingDto(value),
            cancellationToken);
    }

    public async Task DeleteRatingAsync(
        string sessionId,
        string mediaType,
        int tmdbId,
        CancellationToken cancellationToken)
    {
        await SendJsonAsync<TmdbActionResultDto>(
            HttpMethod.Delete,
            $"{ToTmdbPathMediaType(mediaType)}/{tmdbId}/rating?session_id={Uri.EscapeDataString(sessionId)}",
            body: null,
            cancellationToken);
    }

    public async Task<TmdbAccountLibraryResponse> GetAccountLibraryAsync(
        int accountId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var movieGenres = await GetMovieGenreMapAsync(cancellationToken);
        var seriesGenres = await GetSeriesGenreMapAsync(cancellationToken);
        var query = $"language={Language}&page=1&sort_by=created_at.desc&session_id={Uri.EscapeDataString(sessionId)}";

        var favoriteMovies = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>($"account/{accountId}/favorite/movies?{query}", cancellationToken);
        var favoriteSeries = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>($"account/{accountId}/favorite/tv?{query}", cancellationToken);
        var watchlistMovies = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>($"account/{accountId}/watchlist/movies?{query}", cancellationToken);
        var watchlistSeries = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>($"account/{accountId}/watchlist/tv?{query}", cancellationToken);
        var ratedMovies = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>($"account/{accountId}/rated/movies?{query}", cancellationToken);
        var ratedSeries = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>($"account/{accountId}/rated/tv?{query}", cancellationToken);

        return new TmdbAccountLibraryResponse(
            favoriteMovies.Results.Select(movie => MapMovieSummary(movie, movieGenres)).Take(24).ToList(),
            favoriteSeries.Results.Select(series => MapSeriesSummary(series, seriesGenres)).Take(24).ToList(),
            watchlistMovies.Results.Select(movie => MapMovieSummary(movie, movieGenres)).Take(24).ToList(),
            watchlistSeries.Results.Select(series => MapSeriesSummary(series, seriesGenres)).Take(24).ToList(),
            ratedMovies.Results.Select(movie => MapMovieSummary(movie, movieGenres)).Take(24).ToList(),
            ratedSeries.Results.Select(series => MapSeriesSummary(series, seriesGenres)).Take(24).ToList());
    }

    private Task<PagedResponse<MediaSummaryResponse>> GetMovieListAsync(
        string cacheKey,
        string path,
        int page,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            $"{cacheKey}:{page}",
            ttl,
            async () =>
            {
                var genres = await GetMovieGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(path, cancellationToken);
                return ToPagedResponse(response, response.Results.Select(movie => MapMovieSummary(movie, genres)).ToList());
            });
    }

    private Task<PagedResponse<MediaSummaryResponse>> GetSeriesListAsync(
        string cacheKey,
        string path,
        int page,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<PagedResponse<MediaSummaryResponse>>(
            $"{cacheKey}:{page}",
            ttl,
            async () =>
            {
                var genres = await GetSeriesGenreMapAsync(cancellationToken);
                var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(path, cancellationToken);
                return ToPagedResponse(response, response.Results.Select(series => MapSeriesSummary(series, genres)).ToList());
            });
    }

    private Task<PagedResponse<PersonSummaryResponse>> GetPeopleListAsync(
        string cacheKey,
        string path,
        int page,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        return GetCachedAsync<PagedResponse<PersonSummaryResponse>>(
            $"{cacheKey}:{page}",
            ttl,
            async () =>
            {
                var response = await GetAsync<TmdbSearchResponseDto<TmdbPersonDto>>(path, cancellationToken);
                return ToPagedResponse(response, await MapPeopleAsync(response.Results, cancellationToken));
            });
    }

    private async Task<IReadOnlyList<MediaSummaryResponse>> DiscoverCompanyMoviesAsync(int companyId, CancellationToken cancellationToken)
    {
        var genres = await GetMovieGenreMapAsync(cancellationToken);
        var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(
            $"discover/movie?language={Language}&region={Region}&page=1&include_adult=false&sort_by=popularity.desc&with_companies={companyId}",
            cancellationToken);
        return response.Results.Select(movie => MapMovieSummary(movie, genres)).Take(RelatedLimit).ToList();
    }

    private async Task<IReadOnlyList<MediaSummaryResponse>> DiscoverCompanySeriesAsync(int companyId, CancellationToken cancellationToken)
    {
        var genres = await GetSeriesGenreMapAsync(cancellationToken);
        var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(
            $"discover/tv?language={Language}&region={Region}&page=1&include_adult=false&sort_by=popularity.desc&with_companies={companyId}",
            cancellationToken);
        return response.Results.Select(series => MapSeriesSummary(series, genres)).Take(RelatedLimit).ToList();
    }

    private async Task<IReadOnlyList<MediaSummaryResponse>> DiscoverNetworkSeriesAsync(int networkId, CancellationToken cancellationToken)
    {
        var genres = await GetSeriesGenreMapAsync(cancellationToken);
        var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(
            $"discover/tv?language={Language}&region={Region}&page=1&include_adult=false&sort_by=popularity.desc&with_networks={networkId}",
            cancellationToken);
        return response.Results.Select(series => MapSeriesSummary(series, genres)).Take(24).ToList();
    }

    private async Task<IReadOnlyList<MediaSummaryResponse>> GetKeywordMoviesAsync(int keywordId, CancellationToken cancellationToken)
    {
        var genres = await GetMovieGenreMapAsync(cancellationToken);
        var response = await GetAsync<TmdbSearchResponseDto<TmdbMovieDto>>(
            $"keyword/{keywordId}/movies?language={Language}&include_adult=false&page=1",
            cancellationToken);
        return response.Results.Select(movie => MapMovieSummary(movie, genres)).Take(24).ToList();
    }

    private async Task<IReadOnlyList<MediaSummaryResponse>> DiscoverKeywordSeriesAsync(int keywordId, CancellationToken cancellationToken)
    {
        var genres = await GetSeriesGenreMapAsync(cancellationToken);
        var response = await GetAsync<TmdbSearchResponseDto<TmdbSeriesDto>>(
            $"discover/tv?language={Language}&region={Region}&page=1&include_adult=false&sort_by=popularity.desc&with_keywords={keywordId}",
            cancellationToken);
        return response.Results.Select(series => MapSeriesSummary(series, genres)).Take(24).ToList();
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

    private async Task<T> SendJsonAsync<T>(
        HttpMethod method,
        string path,
        object? body,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        using var request = CreateRequest(path, method);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

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

    private IEnumerable<MediaSummaryResponse> MapMovieList(
        IReadOnlyList<TmdbMovieDto>? movies,
        IReadOnlyDictionary<int, string> genres)
    {
        return movies?.Select(movie => MapMovieSummary(movie, genres)) ?? [];
    }

    private IEnumerable<MediaSummaryResponse> MapSeriesList(
        IReadOnlyList<TmdbSeriesDto>? series,
        IReadOnlyDictionary<int, string> genres)
    {
        return series?.Select(item => MapSeriesSummary(item, genres)) ?? [];
    }

    private CollectionSummaryResponse? MapCollectionSummary(TmdbCollectionSummaryDto? collection)
    {
        return collection is null
            ? null
            : new CollectionSummaryResponse(
                collection.Id,
                collection.Name ?? "Sin titulo",
                BuildImageUrl(collection.PosterPath, _options.PosterSize),
                BuildImageUrl(collection.BackdropPath, _options.BackdropSize));
    }

    private CompanySummaryResponse MapCompanySummary(TmdbCompanySummaryDto company)
    {
        return new CompanySummaryResponse(
            company.Id,
            company.Name ?? "Sin nombre",
            BuildImageUrl(company.LogoPath, _options.PosterSize),
            company.OriginCountry);
    }

    private IReadOnlyList<CompanySummaryResponse> MapCompanySummaries(IReadOnlyList<TmdbCompanySummaryDto>? companies)
    {
        return companies?
            .Select(MapCompanySummary)
            .Take(12)
            .ToList()
            ?? [];
    }

    private NetworkSummaryResponse MapNetworkSummary(TmdbNetworkSummaryDto network)
    {
        return new NetworkSummaryResponse(
            network.Id,
            network.Name ?? "Sin nombre",
            BuildImageUrl(network.LogoPath, _options.PosterSize),
            network.OriginCountry);
    }

    private IReadOnlyList<NetworkSummaryResponse> MapNetworkSummaries(IReadOnlyList<TmdbNetworkSummaryDto>? networks)
    {
        return networks?
            .Select(MapNetworkSummary)
            .Take(12)
            .ToList()
            ?? [];
    }

    private static IReadOnlyList<EntityAliasResponse> MapAliases(TmdbEntityAliasesResponseDto? aliases)
    {
        return aliases?.Results?
            .Where(alias => !string.IsNullOrWhiteSpace(alias.Name))
            .Select(alias => new EntityAliasResponse(alias.Name!, alias.Type))
            .DistinctBy(alias => alias.Name)
            .Take(16)
            .ToList()
            ?? [];
    }

    private IReadOnlyList<MediaPersonResponse> MapCast(TmdbCreditsDto? credits)
    {
        return credits?.Cast?
            .OrderBy(member => member.Order ?? int.MaxValue)
            .Take(CastLimit)
            .Select(member => new MediaPersonResponse(
                member.Id,
                member.Name,
                string.IsNullOrWhiteSpace(member.Character) ? null : member.Character,
                BuildImageUrl(member.ProfilePath, _options.PosterSize)))
            .ToList()
            ?? [];
    }

    private IReadOnlyList<MediaCrewResponse> MapCrew(TmdbCreditsDto? credits)
    {
        return credits?.Crew?
            .Where(member => !string.IsNullOrWhiteSpace(member.Job))
            .OrderBy(member => CrewPriority(member.Job))
            .ThenBy(member => member.Name)
            .Take(12)
            .Select(member => new MediaCrewResponse(
                member.Id,
                member.Name,
                member.Job,
                member.Department,
                BuildImageUrl(member.ProfilePath, _options.PosterSize)))
            .ToList()
            ?? [];
    }

    private static int CrewPriority(string? job)
    {
        return job?.ToLowerInvariant() switch
        {
            "director" => 0,
            "writer" => 1,
            "screenplay" => 2,
            "executive producer" => 3,
            "producer" => 4,
            _ => 10,
        };
    }

    private static IReadOnlyList<MediaVideoResponse> MapVideos(TmdbVideosResponseDto? videos)
    {
        return videos?.Results
            .Where(video => video.Site.Equals("YouTube", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(video => video.Official)
            .ThenBy(video => video.Type.Equals("Trailer", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(video => video.Name)
            .Select(video => new MediaVideoResponse(video.Name, video.Key, video.Site, video.Type, video.Official))
            .Take(4)
            .ToList()
            ?? [];
    }

    private IReadOnlyList<WatchProviderResponse> MapWatchProviders(TmdbWatchProvidersResponseDto? providers)
    {
        if (providers?.Results.TryGetValue(Region, out var countryProviders) != true || countryProviders is null)
        {
            return [];
        }

        return MapProviderGroup(countryProviders.Flatrate, "Streaming")
            .Concat(MapProviderGroup(countryProviders.Rent, "Alquiler"))
            .Concat(MapProviderGroup(countryProviders.Buy, "Compra"))
            .GroupBy(provider => new { provider.ProviderId, provider.Type })
            .Select(group => group.First())
            .ToList();
    }

    private IEnumerable<WatchProviderResponse> MapProviderGroup(IReadOnlyList<TmdbWatchProviderDto>? providers, string type)
    {
        return providers?
            .OrderBy(provider => provider.DisplayPriority)
            .Select(provider => new WatchProviderResponse(
                provider.ProviderId,
                provider.ProviderName,
                BuildImageUrl(provider.LogoPath, _options.PosterSize),
                type))
            ?? [];
    }

    private IReadOnlyList<WatchProviderOptionResponse> MapProviderOptions(IReadOnlyList<TmdbWatchProviderDto> providers)
    {
        return providers
            .OrderBy(provider => provider.DisplayPriority)
            .ThenBy(provider => provider.ProviderName)
            .Select(provider => new WatchProviderOptionResponse(
                provider.ProviderId,
                provider.ProviderName,
                BuildImageUrl(provider.LogoPath, _options.PosterSize)))
            .ToList();
    }

    private IReadOnlyList<MediaImageResponse> MapImages(TmdbImagesResponseDto? images)
    {
        return MapImageGroup(images?.Backdrops, "Backdrop", _options.BackdropSize)
            .Concat(MapImageGroup(images?.Posters, "Poster", _options.PosterSize))
            .Concat(MapImageGroup(images?.Logos, "Logo", _options.PosterSize))
            .Take(18)
            .ToList();
    }

    private IEnumerable<MediaImageResponse> MapImageGroup(IReadOnlyList<TmdbImageDto>? images, string type, string size)
    {
        return images?
            .Where(image => !string.IsNullOrWhiteSpace(image.FilePath))
            .OrderByDescending(image => image.VoteAverage ?? 0)
            .Take(type == "Backdrop" ? 10 : 8)
            .Select(image => new MediaImageResponse(
                BuildImageUrl(image.FilePath, size)!,
                image.Width,
                image.Height,
                type))
            ?? [];
    }

    private static IReadOnlyList<MediaKeywordResponse> MapKeywords(TmdbKeywordsResponseDto? keywords)
    {
        return (keywords?.Keywords ?? keywords?.Results ?? [])
            .Select(keyword => new MediaKeywordResponse(keyword.Id, keyword.Name))
            .DistinctBy(keyword => keyword.TmdbId)
            .Take(16)
            .ToList();
    }

    private IReadOnlyList<MediaReviewResponse> MapReviews(TmdbSearchResponseDto<TmdbReviewDto>? reviews)
    {
        return reviews?.Results
            .Where(review => !string.IsNullOrWhiteSpace(review.Content))
            .OrderByDescending(review => ParseDateTime(review.CreatedAt) ?? DateTimeOffset.MinValue)
            .Take(4)
            .Select(MapReview)
            .ToList()
            ?? [];
    }

    private MediaReviewResponse MapReview(TmdbReviewDto review)
    {
        return new MediaReviewResponse(
            review.Id,
            review.Author,
            review.AuthorDetails?.Username,
            BuildAvatarUrl(review.AuthorDetails?.AvatarPath),
            review.AuthorDetails?.Rating,
            review.Content ?? string.Empty,
            ParseDateTime(review.CreatedAt),
            review.Url);
    }

    private static IReadOnlyList<MediaExternalLinkResponse> MapExternalLinks(TmdbExternalIdsDto? externalIds, string? homepage)
    {
        var links = new List<MediaExternalLinkResponse>();

        AddExternalLink(links, "Sitio oficial", homepage, homepage);
        AddExternalLink(links, "IMDb", externalIds?.ImdbId, externalIds?.ImdbId is null ? null : $"https://www.imdb.com/title/{externalIds.ImdbId}/");
        AddExternalLink(links, "Facebook", externalIds?.FacebookId, externalIds?.FacebookId is null ? null : $"https://www.facebook.com/{externalIds.FacebookId}");
        AddExternalLink(links, "Instagram", externalIds?.InstagramId, externalIds?.InstagramId is null ? null : $"https://www.instagram.com/{externalIds.InstagramId}");
        AddExternalLink(links, "X/Twitter", externalIds?.TwitterId, externalIds?.TwitterId is null ? null : $"https://x.com/{externalIds.TwitterId}");
        AddExternalLink(links, "Wikidata", externalIds?.WikidataId, externalIds?.WikidataId is null ? null : $"https://www.wikidata.org/wiki/{externalIds.WikidataId}");

        return links;
    }

    private static IReadOnlyList<MediaExternalLinkResponse> MapPersonExternalLinks(TmdbExternalIdsDto? externalIds, string? homepage)
    {
        var links = new List<MediaExternalLinkResponse>();

        AddExternalLink(links, "Sitio oficial", homepage, homepage);
        AddExternalLink(links, "IMDb", externalIds?.ImdbId, externalIds?.ImdbId is null ? null : $"https://www.imdb.com/name/{externalIds.ImdbId}/");
        AddExternalLink(links, "Facebook", externalIds?.FacebookId, externalIds?.FacebookId is null ? null : $"https://www.facebook.com/{externalIds.FacebookId}");
        AddExternalLink(links, "Instagram", externalIds?.InstagramId, externalIds?.InstagramId is null ? null : $"https://www.instagram.com/{externalIds.InstagramId}");
        AddExternalLink(links, "X/Twitter", externalIds?.TwitterId, externalIds?.TwitterId is null ? null : $"https://x.com/{externalIds.TwitterId}");
        AddExternalLink(links, "Wikidata", externalIds?.WikidataId, externalIds?.WikidataId is null ? null : $"https://www.wikidata.org/wiki/{externalIds.WikidataId}");

        return links;
    }

    private static void AddExternalLink(List<MediaExternalLinkResponse> links, string site, string? id, string? url)
    {
        if (!string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(url))
        {
            links.Add(new MediaExternalLinkResponse(site, id, url));
        }
    }

    private static IReadOnlyList<MediaAlternativeTitleResponse> MapAlternativeTitles(TmdbAlternativeTitlesResponseDto? alternativeTitles)
    {
        return (alternativeTitles?.Titles ?? alternativeTitles?.Results ?? [])
            .Where(title => !string.IsNullOrWhiteSpace(title.Title))
            .Select(title => new MediaAlternativeTitleResponse(title.Title, title.Country, title.Type))
            .DistinctBy(title => $"{title.Country}:{title.Title}")
            .Take(16)
            .ToList();
    }

    private static IReadOnlyList<MediaTranslationResponse> MapTranslations(TmdbTranslationsResponseDto? translations)
    {
        return translations?.Translations?
            .Select(translation => new MediaTranslationResponse(
                translation.LanguageCode,
                translation.CountryCode,
                translation.EnglishName,
                translation.Name))
            .Take(24)
            .ToList()
            ?? [];
    }

    private static IReadOnlyList<MovieReleaseInfoResponse> MapMovieReleaseInfo(TmdbReleaseDatesResponseDto? releaseDates)
    {
        return releaseDates?.Results?
            .SelectMany(country => (country.ReleaseDates ?? [])
                .Select(release => new MovieReleaseInfoResponse(
                    country.Country,
                    string.IsNullOrWhiteSpace(release.Certification) ? null : release.Certification,
                    ParseDateTime(release.ReleaseDate),
                    release.Type)))
            .Where(release => release.Certification is not null || release.ReleaseDate is not null)
            .OrderBy(release => release.Country == Region ? 0 : 1)
            .ThenBy(release => release.Country)
            .Take(16)
            .ToList()
            ?? [];
    }

    private static IReadOnlyList<SeriesContentRatingResponse> MapSeriesContentRatings(TmdbContentRatingsResponseDto? contentRatings)
    {
        return contentRatings?.Results?
            .Where(rating => !string.IsNullOrWhiteSpace(rating.Rating))
            .OrderBy(rating => rating.Country == Region ? 0 : 1)
            .ThenBy(rating => rating.Country)
            .Select(rating => new SeriesContentRatingResponse(rating.Country, rating.Rating!))
            .Take(16)
            .ToList()
            ?? [];
    }

    private IReadOnlyList<SeasonSummaryResponse> MapSeasonSummaries(IReadOnlyList<TmdbSeasonDto>? seasons)
    {
        return seasons?
            .Where(season => season.SeasonNumber >= 0)
            .OrderBy(season => season.SeasonNumber)
            .Select(season => new SeasonSummaryResponse(
                season.Id,
                season.SeasonNumber,
                season.Name ?? $"Temporada {season.SeasonNumber}",
                season.Overview,
                BuildImageUrl(season.PosterPath, _options.PosterSize),
                ParseDate(season.AirDate),
                season.EpisodeCount,
                season.VoteAverage))
            .ToList()
            ?? [];
    }

    private IReadOnlyList<PersonImageResponse> MapPersonImages(TmdbPersonImagesResponseDto? images)
    {
        return images?.Profiles?
            .Where(image => !string.IsNullOrWhiteSpace(image.FilePath))
            .OrderByDescending(image => image.VoteAverage ?? 0)
            .Take(18)
            .Select(image => new PersonImageResponse(
                BuildImageUrl(image.FilePath, _options.PosterSize)!,
                image.Width,
                image.Height))
            .ToList()
            ?? [];
    }

    private IReadOnlyList<PersonTaggedImageResponse> MapTaggedImages(
        TmdbSearchResponseDto<TmdbTaggedImageDto>? taggedImages,
        IReadOnlyDictionary<int, string> movieGenres,
        IReadOnlyDictionary<int, string> seriesGenres)
    {
        return taggedImages?.Results
            .Where(image => !string.IsNullOrWhiteSpace(image.FilePath))
            .Take(18)
            .Select(image => new PersonTaggedImageResponse(
                BuildImageUrl(image.FilePath, _options.BackdropSize)!,
                image.Width,
                image.Height,
                image.Media is null ? null : MapMixedMedia(image.Media, movieGenres, seriesGenres)))
            .ToList()
            ?? [];
    }

    private IReadOnlyList<EpisodeSummaryResponse> MapEpisodeSummaries(IReadOnlyList<TmdbEpisodeDto>? episodes)
    {
        return episodes?
            .OrderBy(episode => episode.EpisodeNumber)
            .Select(episode => new EpisodeSummaryResponse(
                episode.Id,
                episode.EpisodeNumber,
                episode.SeasonNumber,
                episode.Name ?? $"Episodio {episode.EpisodeNumber}",
                episode.Overview,
                BuildImageUrl(episode.StillPath, _options.BackdropSize),
                ParseDate(episode.AirDate),
                episode.Runtime,
                episode.VoteAverage))
            .ToList()
            ?? [];
    }

    private async Task<IReadOnlyList<PersonSummaryResponse>> MapPeopleAsync(
        IReadOnlyList<TmdbPersonDto> people,
        CancellationToken cancellationToken)
    {
        var movieGenres = await GetMovieGenreMapAsync(cancellationToken);
        var seriesGenres = await GetSeriesGenreMapAsync(cancellationToken);

        return people
            .Select(person => new PersonSummaryResponse(
                person.Id,
                person.Name ?? "Sin nombre",
                person.KnownForDepartment,
                BuildImageUrl(person.ProfilePath, _options.PosterSize),
                person.Popularity,
                MapMixedMediaList(person.KnownFor, movieGenres, seriesGenres).Take(4).ToList()))
            .ToList();
    }

    private IReadOnlyList<MediaSummaryResponse> MapCombinedCredits(
        TmdbCombinedCreditsDto? credits,
        IReadOnlyDictionary<int, string> movieGenres,
        IReadOnlyDictionary<int, string> seriesGenres)
    {
        return (credits?.Cast ?? [])
            .Concat(credits?.Crew ?? [])
            .GroupBy(item => new { item.Id, MediaType = item.MediaType?.ToLowerInvariant() })
            .Select(group => group.OrderByDescending(item => item.Popularity ?? 0).First())
            .OrderByDescending(item => item.Popularity ?? 0)
            .Select(item => MapMixedMedia(item, movieGenres, seriesGenres))
            .OfType<MediaSummaryResponse>()
            .Take(40)
            .ToList();
    }

    private IReadOnlyList<MediaSummaryResponse> MapPersonMovieCredits(
        TmdbCombinedCreditsDto? credits,
        IReadOnlyDictionary<int, string> movieGenres)
    {
        return (credits?.Cast ?? [])
            .Concat(credits?.Crew ?? [])
            .GroupBy(item => item.Id)
            .Select(group => group.OrderByDescending(item => item.Popularity ?? 0).First())
            .OrderByDescending(item => item.Popularity ?? 0)
            .Select(item => MapMovieCredit(item, movieGenres))
            .Take(40)
            .ToList();
    }

    private IReadOnlyList<MediaSummaryResponse> MapPersonTvCredits(
        TmdbCombinedCreditsDto? credits,
        IReadOnlyDictionary<int, string> seriesGenres)
    {
        return (credits?.Cast ?? [])
            .Concat(credits?.Crew ?? [])
            .GroupBy(item => item.Id)
            .Select(group => group.OrderByDescending(item => item.Popularity ?? 0).First())
            .OrderByDescending(item => item.Popularity ?? 0)
            .Select(item => MapSeriesCredit(item, seriesGenres))
            .Take(40)
            .ToList();
    }

    private MediaSummaryResponse MapMovieCredit(TmdbMixedMediaDto item, IReadOnlyDictionary<int, string> movieGenres)
    {
        return new MediaSummaryResponse(
            item.Id,
            item.Title ?? item.Name ?? "Sin tÃ­tulo",
            item.Overview,
            BuildImageUrl(item.PosterPath, _options.PosterSize),
            BuildImageUrl(item.BackdropPath, _options.BackdropSize),
            ParseDate(item.ReleaseDate),
            item.VoteAverage,
            MapGenreNames(item.GenreIds, movieGenres),
            "Movie");
    }

    private MediaSummaryResponse MapSeriesCredit(TmdbMixedMediaDto item, IReadOnlyDictionary<int, string> seriesGenres)
    {
        return new MediaSummaryResponse(
            item.Id,
            item.Name ?? item.Title ?? "Sin tÃ­tulo",
            item.Overview,
            BuildImageUrl(item.PosterPath, _options.PosterSize),
            BuildImageUrl(item.BackdropPath, _options.BackdropSize),
            ParseDate(item.FirstAirDate),
            item.VoteAverage,
            MapGenreNames(item.GenreIds, seriesGenres),
            "Series");
    }

    private IEnumerable<MediaSummaryResponse> MapMixedMediaList(
        IReadOnlyList<TmdbMixedMediaDto>? items,
        IReadOnlyDictionary<int, string> movieGenres,
        IReadOnlyDictionary<int, string> seriesGenres)
    {
        return items?
            .OrderByDescending(item => item.Popularity ?? 0)
            .Select(item => MapMixedMedia(item, movieGenres, seriesGenres))
            .OfType<MediaSummaryResponse>()
            ?? [];
    }

    private MediaSummaryResponse? MapMixedMedia(
        TmdbMixedMediaDto item,
        IReadOnlyDictionary<int, string> movieGenres,
        IReadOnlyDictionary<int, string> seriesGenres)
    {
        return item.MediaType?.ToLowerInvariant() switch
        {
            "movie" => new MediaSummaryResponse(
                item.Id,
                item.Title ?? item.Name ?? "Sin tÃ­tulo",
                item.Overview,
                BuildImageUrl(item.PosterPath, _options.PosterSize),
                BuildImageUrl(item.BackdropPath, _options.BackdropSize),
                ParseDate(item.ReleaseDate),
                item.VoteAverage,
                MapGenreNames(item.GenreIds, movieGenres),
                "Movie"),
            "tv" => new MediaSummaryResponse(
                item.Id,
                item.Name ?? item.Title ?? "Sin tÃ­tulo",
                item.Overview,
                BuildImageUrl(item.PosterPath, _options.PosterSize),
                BuildImageUrl(item.BackdropPath, _options.BackdropSize),
                ParseDate(item.FirstAirDate),
                item.VoteAverage,
                MapGenreNames(item.GenreIds, seriesGenres),
                "Series"),
            _ => null,
        };
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

    private string? BuildAvatarUrl(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        var trimmed = path.TrimStart('/');
        if (trimmed.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        return BuildImageUrl(path, _options.PosterSize);
    }

    private static DateOnly? ParseDate(string? value)
    {
        return DateOnly.TryParse(value, out var date) ? date : null;
    }

    private static DateTimeOffset? ParseDateTime(string? value)
    {
        return DateTimeOffset.TryParse(value, out var date) ? date : null;
    }

    private static string NormalizeQuery(string query)
    {
        return query.Trim().ToLowerInvariant();
    }

    private static string NormalizeSort(string? sortBy, IReadOnlySet<string> allowedSorts, string fallback)
    {
        return !string.IsNullOrWhiteSpace(sortBy) && allowedSorts.Contains(sortBy.Trim())
            ? sortBy.Trim()
            : fallback;
    }

    private static int NormalizePage(int page)
    {
        return page <= 0 ? 1 : Math.Min(page, 500);
    }

    private static PagedResponse<TResponse> ToPagedResponse<TDto, TResponse>(
        TmdbSearchResponseDto<TDto> response,
        IReadOnlyList<TResponse> items)
    {
        var page = response.Page <= 0 ? 1 : response.Page;
        var totalPages = response.TotalPages <= 0 ? page : Math.Min(response.TotalPages, 500);
        return new PagedResponse<TResponse>(
            items,
            page,
            totalPages,
            response.TotalResults,
            page < totalPages);
    }

    private static string BuildDiscoverQuery(
        string sortBy,
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        decimal? minVoteAverage,
        int? runtimeMax,
        int page,
        bool isMovie)
    {
        var query = new List<KeyValuePair<string, string>>
        {
            new("language", Language),
            new("region", Region),
            new("page", page.ToString()),
            new("include_adult", "false"),
            new("sort_by", sortBy),
        };

        if (genreId is > 0)
        {
            query.Add(new("with_genres", genreId.Value.ToString()));
        }

        if (year is >= 1900 and <= 2100)
        {
            query.Add(new(isMovie ? "primary_release_year" : "first_air_date_year", year.Value.ToString()));
        }
        else
        {
            if (yearFrom is >= 1900 and <= 2100)
            {
                query.Add(new(isMovie ? "primary_release_date.gte" : "first_air_date.gte", $"{yearFrom.Value:0000}-01-01"));
            }

            if (yearTo is >= 1900 and <= 2100)
            {
                query.Add(new(isMovie ? "primary_release_date.lte" : "first_air_date.lte", $"{yearTo.Value:0000}-12-31"));
            }
        }

        if (watchProviderId is > 0)
        {
            query.Add(new("watch_region", Region));
            query.Add(new("with_watch_providers", watchProviderId.Value.ToString()));
        }

        if (minVoteAverage is >= 0 and <= 10)
        {
            query.Add(new("vote_average.gte", minVoteAverage.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)));
        }

        if (isMovie && runtimeMax is >= 45 and <= 240)
        {
            query.Add(new("with_runtime.lte", runtimeMax.Value.ToString()));
        }

        if (sortBy.Equals("vote_average.desc", StringComparison.OrdinalIgnoreCase))
        {
            query.Add(new("vote_count.gte", isMovie ? "150" : "75"));
        }

        return string.Join("&", query.Select(item => $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value)}"));
    }

    private static string NormalizeTmdbPath(string path)
    {
        var normalized = path.Trim().Trim('/');
        if (string.IsNullOrWhiteSpace(normalized) ||
            normalized.Contains("..", StringComparison.Ordinal) ||
            normalized.Contains('?') ||
            normalized.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invalid TMDB path.", nameof(path));
        }

        return normalized;
    }

    private static bool IsAllowedPublicReadOnlyPath(string path)
    {
        return TmdbEndpointCatalog.PublicReadOnlyEndpoints.Any(endpoint => PathMatches(endpoint.Path, path));
    }

    private static bool PathMatches(string pattern, string path)
    {
        var patternSegments = pattern.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var pathSegments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (patternSegments.Length != pathSegments.Length)
        {
            return false;
        }

        return patternSegments.Zip(pathSegments).All(pair =>
            IsPathParameter(pair.First) ||
            pair.First.Equals(pair.Second, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsPathParameter(string segment)
    {
        return segment.StartsWith('{') && segment.EndsWith('}');
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
        return CreateRequest(path, HttpMethod.Get);
    }

    private HttpRequestMessage CreateRequest(string path, HttpMethod method)
    {
        var requestPath = string.IsNullOrWhiteSpace(_options.AccessToken) ? AddApiKey(path) : path;
        var request = new HttpRequestMessage(method, requestPath);

        if (!string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        }

        return request;
    }

    private static string ToTmdbPathMediaType(string mediaType)
    {
        return mediaType.Equals("Movie", StringComparison.OrdinalIgnoreCase)
            ? "movie"
            : mediaType.Equals("Series", StringComparison.OrdinalIgnoreCase) || mediaType.Equals("TV", StringComparison.OrdinalIgnoreCase)
                ? "tv"
                : throw new ArgumentException("Invalid media type.", nameof(mediaType));
    }

    private static string ToTmdbBodyMediaType(string mediaType)
    {
        return mediaType.Equals("Movie", StringComparison.OrdinalIgnoreCase)
            ? "movie"
            : mediaType.Equals("Series", StringComparison.OrdinalIgnoreCase) || mediaType.Equals("TV", StringComparison.OrdinalIgnoreCase)
                ? "tv"
                : throw new ArgumentException("Invalid media type.", nameof(mediaType));
    }

    private static decimal? ExtractRating(JsonElement rated)
    {
        if (rated.ValueKind != JsonValueKind.Object ||
            !rated.TryGetProperty("value", out var value) ||
            !value.TryGetDecimal(out var rating))
        {
            return null;
        }

        return rating;
    }

    private string AddApiKey(string path)
    {
        var separator = path.Contains('?') ? '&' : '?';
        return $"{path}{separator}api_key={Uri.EscapeDataString(_options.ApiKey)}";
    }
}
