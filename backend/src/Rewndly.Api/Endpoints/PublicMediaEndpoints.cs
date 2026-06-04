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

        app.MapGet("/api/series/{tmdbId:int}", GetSeriesDetailsAsync)
            .WithTags("Series")
            .AllowAnonymous();

        app.MapGet("/api/genres/movies", GetMovieGenresAsync)
            .WithTags("Genres")
            .AllowAnonymous();

        app.MapGet("/api/genres/series", GetSeriesGenresAsync)
            .WithTags("Genres")
            .AllowAnonymous();

        return app;
    }

    private static async Task<IResult> GetHomeAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetHomeAsync(cancellationToken));
    }

    private static async Task<IResult> SearchMoviesAsync(
        string query,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Results.BadRequest(new { message = "Search query must contain at least 2 characters." });
        }

        return await ExecuteTmdbAsync(() => mediaService.SearchMoviesAsync(query, cancellationToken));
    }

    private static async Task<IResult> GetTrendingMoviesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTrendingMoviesAsync(cancellationToken));
    }

    private static async Task<IResult> GetNowPlayingMoviesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetNowPlayingMoviesAsync(cancellationToken));
    }

    private static async Task<IResult> GetPopularMoviesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetPopularMoviesAsync(cancellationToken));
    }

    private static async Task<IResult> GetUpcomingMoviesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetUpcomingMoviesAsync(cancellationToken));
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
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            return Results.BadRequest(new { message = "Search query must contain at least 2 characters." });
        }

        return await ExecuteTmdbAsync(() => mediaService.SearchSeriesAsync(query, cancellationToken));
    }

    private static async Task<IResult> GetTrendingSeriesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetTrendingSeriesAsync(cancellationToken));
    }

    private static async Task<IResult> GetPopularSeriesAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetPopularSeriesAsync(cancellationToken));
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

    private static async Task<IResult> GetMovieGenresAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetMovieGenresAsync(cancellationToken));
    }

    private static async Task<IResult> GetSeriesGenresAsync(IPublicMediaService mediaService, CancellationToken cancellationToken)
    {
        return await ExecuteTmdbAsync(() => mediaService.GetSeriesGenresAsync(cancellationToken));
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
}
