using System.Globalization;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;
using Rewndly.Infrastructure.ExternalServices.Tmdb;
using Rewndly.Infrastructure.ExternalServices.Wikidata;

namespace Rewndly.Api.Endpoints;

public static class PublicMediaEndpoints
{
    public static IEndpointRouteBuilder MapPublicMediaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/public/home", GetHomeAsync)
            .WithTags("Public")
            .AllowAnonymous();

        app.MapGet("/api/tmdb/catalog", GetTmdbCatalog)
            .WithTags("TMDB")
            .AllowAnonymous();

        app.MapGet("/api/tmdb/public/{**tmdbPath}", GetTmdbPublicReadOnlyAsync)
            .WithTags("TMDB")
            .AllowAnonymous();

        app.MapGet("/api/movies/search", SearchMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/trending", GetTrendingMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/now-playing", GetNowPlayingMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/popular", GetPopularMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/upcoming", GetUpcomingMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/top-rated", GetTopRatedMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/rankings/{rankingKey}", GetMovieRankingAsync)
            .WithTags("Movies")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapGet("/api/movies/discover", DiscoverMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/calendar", GetMovieCalendarAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/{tmdbId:int}", GetMovieDetailsAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/media/{mediaType}/{tmdbId:int}/ratings", GetExternalRatingsAsync)
            .WithTags("Media")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapPost("/api/media/ratings/batch", GetExternalRatingsBatchAsync)
            .WithTags("Media")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapPost("/api/media/watch-providers/batch", GetWatchProvidersBatchAsync)
            .WithTags("Media")
            .AllowAnonymous();

        app.MapGet("/api/media/{mediaType}/{tmdbId:int}/awards", GetMediaAwardsAsync)
            .WithTags("Media")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapGet("/api/series/search", SearchSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/trending", GetTrendingSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/popular", GetPopularSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/top-rated", GetTopRatedSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/rankings/{rankingKey}", GetSeriesRankingAsync)
            .WithTags("Series")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapGet("/api/series/airing-today", GetAiringTodaySeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/on-the-air", GetOnTheAirSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/discover", DiscoverSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/calendar", GetSeriesCalendarAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/{tmdbId:int}", GetSeriesDetailsAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/{tmdbId:int}/seasons/{seasonNumber:int}", GetSeasonDetailsAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/{tmdbId:int}/seasons/{seasonNumber:int}/episodes/{episodeNumber:int}", GetEpisodeDetailsAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/people/search", SearchPeopleAsync)
            .WithTags("People")
            .AllowAnonymous();

        app.MapGet("/api/people/trending", GetTrendingPeopleAsync)
            .WithTags("People")
            .AllowAnonymous();

        app.MapGet("/api/people/popular", GetPopularPeopleAsync)
            .WithTags("People")
            .AllowAnonymous();

        app.MapGet("/api/people/{tmdbId:int}", GetPersonDetailsAsync)
            .WithTags("People")
            .AllowAnonymous();

        app.MapGet("/api/people/{tmdbId:int}/wiki", GetPersonWikiAsync)
            .WithTags("People")
            .RequireRateLimiting("external-ratings")
            .AllowAnonymous();

        app.MapGet("/api/collections/{collectionId:int}", GetCollectionDetailsAsync)
            .WithTags("Collections")
            .AllowAnonymous();

        app.MapGet("/api/companies/{companyId:int}", GetCompanyDetailsAsync)
            .WithTags("Companies")
            .AllowAnonymous();

        app.MapGet("/api/networks/{networkId:int}", GetNetworkDetailsAsync)
            .WithTags("Networks")
            .AllowAnonymous();

        app.MapGet("/api/keywords/{keywordId:int}", GetKeywordDetailsAsync)
            .WithTags("Keywords")
            .AllowAnonymous();

        app.MapGet("/api/tmdb-reviews/{reviewId}", GetTmdbReviewDetailsAsync)
            .WithTags("Reviews")
            .AllowAnonymous();

        app.MapGet("/api/genres/movies", GetMovieGenresAsync)
            .WithTags("Genres")
            .AllowAnonymous();

        app.MapGet("/api/genres/series", GetSeriesGenresAsync)
            .WithTags("Genres")
            .AllowAnonymous();

        app.MapGet("/api/watch-providers/movies", GetMovieWatchProvidersAsync)
            .WithTags("Watch Providers")
            .AllowAnonymous();

        app.MapGet("/api/watch-providers/series", GetSeriesWatchProvidersAsync)
            .WithTags("Watch Providers")
            .AllowAnonymous();

        return app;
    }

    private static async Task<IResult> GetHomeAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetHomeAsync(cancellationToken));
    }

    private static IResult GetTmdbCatalog(ITmdbReadOnlyGateway gateway)
    {
        return Results.Ok(gateway.GetPublicReadOnlyEndpoints());
    }

    private static async Task<IResult> GetTmdbPublicReadOnlyAsync(
        string tmdbPath,
        HttpRequest request,
        ITmdbReadOnlyGateway gateway,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await gateway.GetPublicReadOnlyAsync(tmdbPath, request.QueryString.Value ?? string.Empty, cancellationToken);
            return Results.Json(response);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { message = exception.Message });
        }
        catch (TmdbExternalException)
        {
            return Results.Problem(
                title: "External media provider unavailable",
                detail: "Movie and series data is temporarily unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> SearchMoviesAsync(
        string query,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Results.BadRequest(new { message = "Search query must contain at least 2 characters." });
        }

        return await ExecuteTmdbAsync(() => mediaService.SearchMoviesAsync(query, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetTrendingMoviesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTrendingMoviesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetNowPlayingMoviesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetNowPlayingMoviesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetPopularMoviesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetPopularMoviesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetUpcomingMoviesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetUpcomingMoviesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetTopRatedMoviesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTopRatedMoviesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> DiscoverMoviesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int? runtimeMax,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.DiscoverMoviesAsync(genreId, year, yearFrom, yearTo, watchProviderId, sortBy, minVoteAverage, runtimeMax, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetMovieCalendarAsync(
        string? from,
        string? to,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken,
        int page = 1)
    {
        var (start, end) = ResolveCalendarWindow(from, to);
        return await ExecuteTmdbAsync(() => mediaService.GetMovieCalendarAsync(start, end, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetSeriesCalendarAsync(
        string? from,
        string? to,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken,
        int page = 1)
    {
        var (start, end) = ResolveCalendarWindow(from, to);
        return await ExecuteTmdbAsync(() => mediaService.GetSeriesCalendarAsync(start, end, NormalizePage(page), cancellationToken));
    }

    // Resuelve la ventana del calendario: por defecto la semana desde hoy, con el rango
    // acotado a 92 días para no abusar de la API de TMDB.
    private static (DateOnly From, DateOnly To) ResolveCalendarWindow(string? from, string? to)
    {
        const int maxRangeDays = 92;
        var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.UtcDateTime);

        var start = DateOnly.TryParse(from, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedFrom) ? parsedFrom : today;
        var end = DateOnly.TryParse(to, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedTo) ? parsedTo : start.AddDays(6);

        if (end < start)
        {
            (start, end) = (end, start);
        }

        if (end.DayNumber - start.DayNumber > maxRangeDays)
        {
            end = start.AddDays(maxRangeDays);
        }

        return (start, end);
    }

    private static async Task<IResult> GetMovieDetailsAsync(
        int tmdbId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var movie = await mediaService.GetMovieDetailsAsync(tmdbId, cancellationToken);
            return movie is null ? Results.NotFound() : Results.Ok(movie);
        });
    }

    private static async Task<IResult> GetExternalRatingsAsync(
        string mediaType,
        int tmdbId,
        IExternalMediaRatingsService ratingsService,
        CancellationToken cancellationToken)
    {
        if (tmdbId <= 0 || !TryParseMediaType(mediaType, out var parsedMediaType))
        {
            return Results.BadRequest(new { message = "Media type must be movie or series." });
        }

        var ratings = await ratingsService.GetRatingsAsync(parsedMediaType, tmdbId, cancellationToken);
        return Results.Ok(ratings);
    }

    private static async Task<IResult> GetMediaAwardsAsync(
        string mediaType,
        int tmdbId,
        WikidataEnrichmentService wikidataService,
        CancellationToken cancellationToken)
    {
        if (tmdbId <= 0 || !TryParseMediaType(mediaType, out var parsedMediaType))
        {
            return Results.BadRequest(new { message = "Media type must be movie or series." });
        }

        var awards = await wikidataService.GetMediaAwardsAsync(parsedMediaType, tmdbId, cancellationToken);
        return Results.Ok(awards);
    }

    private static async Task<IResult> GetPersonWikiAsync(
        int tmdbId,
        WikidataEnrichmentService wikidataService,
        CancellationToken cancellationToken)
    {
        if (tmdbId <= 0)
        {
            return Results.BadRequest(new { message = "Invalid person id." });
        }

        var wiki = await wikidataService.GetPersonWikiAsync(tmdbId, cancellationToken);
        return Results.Ok(wiki);
    }

    private static async Task<IResult> GetExternalRatingsBatchAsync(
        ExternalRatingsBatchRequest request,
        IExternalMediaRatingsService ratingsService,
        CancellationToken cancellationToken)
    {
        const int maxItems = 12;
        var uniqueItems = request.Items
            .Where(item => item.TmdbId > 0 && TryParseMediaType(item.MediaType, out _))
            .GroupBy(item => $"{item.MediaType.Trim().ToLowerInvariant()}:{item.TmdbId}")
            .Select(group => group.First())
            .Take(maxItems)
            .ToList();

        if (uniqueItems.Count == 0)
        {
            return Results.Ok(Array.Empty<ExternalRatingsBatchItemResponse>());
        }

        var response = new List<ExternalRatingsBatchItemResponse>(uniqueItems.Count);
        foreach (var item in uniqueItems)
        {
            TryParseMediaType(item.MediaType, out var parsedMediaType);
            var ratings = await ratingsService.GetRatingsAsync(parsedMediaType, item.TmdbId, cancellationToken);
            response.Add(new ExternalRatingsBatchItemResponse(
                parsedMediaType.ToString(),
                item.TmdbId,
                ratings.Ratings,
                ratings.CachedAt));
        }

        return Results.Ok(response);
    }

    private static async Task<IResult> GetWatchProvidersBatchAsync(
        WatchProvidersBatchRequest request,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        const int maxItems = 12;
        var uniqueItems = request.Items
            .Where(item => item.TmdbId > 0 && TryParseMediaType(item.MediaType, out _))
            .GroupBy(item => $"{item.MediaType.Trim().ToLowerInvariant()}:{item.TmdbId}")
            .Select(group => group.First())
            .Take(maxItems)
            .ToList();

        if (uniqueItems.Count == 0)
        {
            return Results.Ok(Array.Empty<WatchProvidersBatchItemResponse>());
        }

        return await ExecuteTmdbAsync(async () =>
        {
            var response = new List<WatchProvidersBatchItemResponse>(uniqueItems.Count);
            foreach (var item in uniqueItems)
            {
                TryParseMediaType(item.MediaType, out var parsedMediaType);
                var providers = await mediaService.GetWatchProvidersAsync(parsedMediaType, item.TmdbId, cancellationToken);
                response.Add(new WatchProvidersBatchItemResponse(
                    parsedMediaType.ToString(),
                    item.TmdbId,
                    providers));
            }

            return Results.Ok(response);
        });
    }

    private static async Task<IResult> GetMovieRankingAsync(
        string rankingKey,
        int page,
        int pageSize,
        IExternalMediaRankingService rankingService,
        CancellationToken cancellationToken)
    {
        if (!IsSupportedRanking(rankingKey))
        {
            return Results.BadRequest(new { message = "Ranking must be imdb or critics." });
        }

        return Results.Ok(await rankingService.GetRankingAsync(
            MediaType.Movie,
            rankingKey,
            NormalizePage(page),
            NormalizePageSize(pageSize),
            cancellationToken));
    }

    private static async Task<IResult> GetSeriesRankingAsync(
        string rankingKey,
        int page,
        int pageSize,
        IExternalMediaRankingService rankingService,
        CancellationToken cancellationToken)
    {
        if (!IsSupportedRanking(rankingKey))
        {
            return Results.BadRequest(new { message = "Ranking must be imdb or critics." });
        }

        return Results.Ok(await rankingService.GetRankingAsync(
            MediaType.Series,
            rankingKey,
            NormalizePage(page),
            NormalizePageSize(pageSize),
            cancellationToken));
    }

    private static async Task<IResult> SearchSeriesAsync(
        string query,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Results.BadRequest(new { message = "Search query must contain at least 2 characters." });
        }

        return await ExecuteTmdbAsync(() => mediaService.SearchSeriesAsync(query, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetTrendingSeriesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTrendingSeriesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetPopularSeriesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetPopularSeriesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetTopRatedSeriesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTopRatedSeriesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetAiringTodaySeriesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetAiringTodaySeriesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetOnTheAirSeriesAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetOnTheAirSeriesAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> DiscoverSeriesAsync(
        int? genreId,
        int? year,
        int? yearFrom,
        int? yearTo,
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.DiscoverSeriesAsync(genreId, year, yearFrom, yearTo, watchProviderId, sortBy, minVoteAverage, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetSeriesDetailsAsync(
        int tmdbId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var series = await mediaService.GetSeriesDetailsAsync(tmdbId, cancellationToken);
            return series is null ? Results.NotFound() : Results.Ok(series);
        });
    }

    private static async Task<IResult> GetSeasonDetailsAsync(
        int tmdbId,
        int seasonNumber,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var season = await mediaService.GetSeasonDetailsAsync(tmdbId, seasonNumber, cancellationToken);
            return season is null ? Results.NotFound() : Results.Ok(season);
        });
    }

    private static async Task<IResult> GetEpisodeDetailsAsync(
        int tmdbId,
        int seasonNumber,
        int episodeNumber,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var episode = await mediaService.GetEpisodeDetailsAsync(tmdbId, seasonNumber, episodeNumber, cancellationToken);
            return episode is null ? Results.NotFound() : Results.Ok(episode);
        });
    }

    private static async Task<IResult> SearchPeopleAsync(
        string query,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Results.BadRequest(new { message = "Search query must contain at least 2 characters." });
        }

        return await ExecuteTmdbAsync(() => mediaService.SearchPeopleAsync(query, NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetTrendingPeopleAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTrendingPeopleAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetPopularPeopleAsync(int page, IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetPopularPeopleAsync(NormalizePage(page), cancellationToken));
    }

    private static async Task<IResult> GetPersonDetailsAsync(
        int tmdbId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var person = await mediaService.GetPersonDetailsAsync(tmdbId, cancellationToken);
            return person is null ? Results.NotFound() : Results.Ok(person);
        });
    }

    private static async Task<IResult> GetCollectionDetailsAsync(
        int collectionId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var collection = await mediaService.GetCollectionDetailsAsync(collectionId, cancellationToken);
            return collection is null ? Results.NotFound() : Results.Ok(collection);
        });
    }

    private static async Task<IResult> GetCompanyDetailsAsync(
        int companyId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var company = await mediaService.GetCompanyDetailsAsync(companyId, cancellationToken);
            return company is null ? Results.NotFound() : Results.Ok(company);
        });
    }

    private static async Task<IResult> GetNetworkDetailsAsync(
        int networkId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var network = await mediaService.GetNetworkDetailsAsync(networkId, cancellationToken);
            return network is null ? Results.NotFound() : Results.Ok(network);
        });
    }

    private static async Task<IResult> GetKeywordDetailsAsync(
        int keywordId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(async () =>
        {
            var keyword = await mediaService.GetKeywordDetailsAsync(keywordId, cancellationToken);
            return keyword is null ? Results.NotFound() : Results.Ok(keyword);
        });
    }

    private static async Task<IResult> GetTmdbReviewDetailsAsync(
        string reviewId,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reviewId))
        {
            return Results.BadRequest(new { message = "Review id is required." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            var review = await mediaService.GetTmdbReviewDetailsAsync(reviewId, cancellationToken);
            return review is null ? Results.NotFound() : Results.Ok(review);
        });
    }

    private static async Task<IResult> GetMovieGenresAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetMovieGenresAsync(cancellationToken));
    }

    private static async Task<IResult> GetSeriesGenresAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetSeriesGenresAsync(cancellationToken));
    }

    private static async Task<IResult> GetMovieWatchProvidersAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetMovieWatchProvidersAsync(cancellationToken));
    }

    private static async Task<IResult> GetSeriesWatchProvidersAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetSeriesWatchProvidersAsync(cancellationToken));
    }

    private static async Task<IResult> ExecuteTmdbAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Results.Ok(await action());
        }
        catch (TmdbExternalException)
        {
            return Results.Problem(
                title: "External media provider unavailable",
                detail: "Movie and series data is temporarily unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> ExecuteTmdbAsync(Func<Task<IResult>> action)
    {
        try
        {
            return await action();
        }
        catch (TmdbExternalException)
        {
            return Results.Problem(
                title: "External media provider unavailable",
                detail: "Movie and series data is temporarily unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static int NormalizePage(int page)
    {
        return page <= 0 ? 1 : Math.Min(page, 500);
    }

    private static int NormalizePageSize(int pageSize)
    {
        return pageSize <= 0 ? 24 : Math.Clamp(pageSize, 1, 48);
    }

    private static bool IsSupportedRanking(string rankingKey)
    {
        return string.Equals(rankingKey, "imdb", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(rankingKey, "critics", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseMediaType(string mediaType, out MediaType parsedMediaType)
    {
        parsedMediaType = mediaType.Equals("movie", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("movies", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("Movie", StringComparison.Ordinal)
                ? MediaType.Movie
                : MediaType.Series;

        return mediaType.Equals("movie", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("movies", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("series", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("show", StringComparison.OrdinalIgnoreCase) ||
            mediaType.Equals("shows", StringComparison.OrdinalIgnoreCase);
    }
}
