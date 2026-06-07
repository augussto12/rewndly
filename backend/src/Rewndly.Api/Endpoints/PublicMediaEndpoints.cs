using Rewndly.Application.Common.Interfaces;
using Rewndly.Infrastructure.ExternalServices.Tmdb;

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

        app.MapGet("/api/movies/discover", DiscoverMoviesAsync)
            .WithTags("Movies")
            .AllowAnonymous();

        app.MapGet("/api/movies/{tmdbId:int}", GetMovieDetailsAsync)
            .WithTags("Movies")
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

        app.MapGet("/api/series/airing-today", GetAiringTodaySeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/on-the-air", GetOnTheAirSeriesAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/series/discover", DiscoverSeriesAsync)
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
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.DiscoverMoviesAsync(genreId, year, watchProviderId, sortBy, minVoteAverage, NormalizePage(page), cancellationToken));
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
        int? watchProviderId,
        string? sortBy,
        decimal? minVoteAverage,
        int page,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.DiscoverSeriesAsync(genreId, year, watchProviderId, sortBy, minVoteAverage, NormalizePage(page), cancellationToken));
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
}
