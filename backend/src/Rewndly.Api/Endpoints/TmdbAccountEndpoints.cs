using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Rewndly.Api.Extensions;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Application.Modules.Tmdb;
using Rewndly.Domain.Library;
using Rewndly.Domain.Media;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.ExternalServices.Tmdb;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Api.Endpoints;

public static class TmdbAccountEndpoints
{
    private const string ProtectorPurpose = "Rewndly.TmdbSession.v1";

    public static IEndpointRouteBuilder MapTmdbAccountEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/me/tmdb")
            .RequireAuthorization(AuthPolicies.RequireUser)
            .RequireRateLimiting("user-content")
            .WithTags("TMDB Account");

        group.MapGet("/status", GetStatusAsync);
        group.MapPost("/connect", ConnectAsync);
        group.MapPost("/complete", CompleteAsync);
        group.MapDelete("/connection", DisconnectAsync);
        group.MapGet("/library", GetRemoteLibraryAsync);
        group.MapPost("/sync", SyncAsync);
        group.MapGet("/media/{mediaType}/{tmdbId:int}/state", GetMediaStateAsync);
        group.MapPost("/media/{mediaType}/{tmdbId:int}/favorite", SetFavoriteAsync);
        group.MapPost("/media/{mediaType}/{tmdbId:int}/watchlist", SetWatchlistAsync);
        group.MapPost("/media/{mediaType}/{tmdbId:int}/rating", SetRatingAsync);
        group.MapDelete("/media/{mediaType}/{tmdbId:int}/rating", DeleteRatingAsync);

        return app;
    }

    private static async Task<IResult> GetStatusAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        var connection = await GetConnectionAsync(dbContext, currentUser, cancellationToken);
        return Results.Ok(ToStatus(connection));
    }

    private static async Task<IResult> ConnectAsync(
        HttpContext httpContext,
        IConfiguration configuration,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IRefreshTokenGenerator tokenGenerator,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        return await ExecuteTmdbAsync(async () =>
        {
            var callbackUrl = $"{ResolveFrontendOrigin(httpContext, configuration).TrimEnd('/')}/me/tmdb/callback";
            var response = await tmdb.CreateRequestTokenAsync(callbackUrl, cancellationToken);

            dbContext.TmdbAuthRequests.Add(new TmdbAuthRequest
            {
                UserId = currentUser.UserId.Value,
                RequestTokenHash = tokenGenerator.HashToken(response.RequestToken),
                ExpiresAt = response.ExpiresAt
            });
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(response);
        });
    }

    private static async Task<IResult> CompleteAsync(
        TmdbCompleteConnectionRequest request,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IRefreshTokenGenerator tokenGenerator,
        IDateTimeProvider dateTimeProvider,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.RequestToken))
        {
            return Results.BadRequest(new { message = "Request token is required." });
        }

        var now = dateTimeProvider.UtcNow;
        var tokenHash = tokenGenerator.HashToken(request.RequestToken.Trim());
        var authRequest = await dbContext.TmdbAuthRequests.FirstOrDefaultAsync(candidate =>
            candidate.UserId == currentUser.UserId.Value &&
            candidate.RequestTokenHash == tokenHash &&
            candidate.UsedAt == null &&
            candidate.ExpiresAt > now,
            cancellationToken);

        if (authRequest is null)
        {
            return Results.BadRequest(new { message = "TMDB request token is invalid or expired." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            var sessionId = await tmdb.CreateSessionAsync(request.RequestToken.Trim(), cancellationToken);
            var account = await tmdb.GetAccountDetailsAsync(sessionId, cancellationToken);
            var protector = dataProtectionProvider.CreateProtector(ProtectorPurpose);
            var existing = await dbContext.TmdbAccountConnections.FirstOrDefaultAsync(connection =>
                connection.UserId == currentUser.UserId.Value &&
                connection.RevokedAt == null,
                cancellationToken);
            var previousSessionId = existing is null
                ? null
                : UnprotectSession(existing, dataProtectionProvider);

            if (existing is null)
            {
                existing = new TmdbAccountConnection
                {
                    UserId = currentUser.UserId.Value,
                    ConnectedAt = now
                };
                dbContext.TmdbAccountConnections.Add(existing);
            }

            existing.TmdbAccountId = account.Id;
            existing.Username = account.Username;
            existing.DisplayName = account.Name;
            existing.AvatarUrl = account.AvatarUrl;
            existing.ProtectedSessionId = protector.Protect(sessionId);
            existing.RevokedAt = null;
            authRequest.UsedAt = now;

            await dbContext.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(previousSessionId) &&
                !previousSessionId.Equals(sessionId, StringComparison.Ordinal))
            {
                try
                {
                    await tmdb.DeleteSessionAsync(previousSessionId, cancellationToken);
                }
                catch (TmdbExternalException)
                {
                    // The new connection is already stored; a stale TMDB session should not break reconnect.
                }
            }

            return Results.Ok(ToStatus(existing));
        });
    }

    private static async Task<IResult> DisconnectAsync(
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var connection = await GetConnectionAsync(dbContext, currentUser, cancellationToken);
        if (connection is null)
        {
            return Results.NoContent();
        }

        var sessionId = UnprotectSession(connection, dataProtectionProvider);
        if (sessionId is not null)
        {
            try
            {
                await tmdb.DeleteSessionAsync(sessionId, cancellationToken);
            }
            catch (TmdbExternalException)
            {
                // The local disconnect should still revoke our stored session if TMDB is unavailable.
            }
        }

        connection.RevokedAt = dateTimeProvider.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetRemoteLibraryAsync(
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () => Results.Ok(await tmdb.GetAccountLibraryAsync(session.Connection.TmdbAccountId, session.SessionId, cancellationToken)));
    }

    private static async Task<IResult> SyncAsync(
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null || currentUser.UserId is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            var remote = await tmdb.GetAccountLibraryAsync(session.Connection.TmdbAccountId, session.SessionId, cancellationToken);
            var imported = 0;
            var updated = 0;

            foreach (var item in remote.FavoriteMovies)
            {
                var result = await UpsertLibraryItemAsync(dbContext, mediaService, currentUser.UserId.Value, item, isFavorite: true, status: null, rating: null, cancellationToken);
                imported += result.Imported;
                updated += result.Updated;
            }

            foreach (var item in remote.FavoriteSeries)
            {
                var result = await UpsertLibraryItemAsync(dbContext, mediaService, currentUser.UserId.Value, item, isFavorite: true, status: null, rating: null, cancellationToken);
                imported += result.Imported;
                updated += result.Updated;
            }

            foreach (var item in remote.WatchlistMovies.Concat(remote.WatchlistSeries))
            {
                var result = await UpsertLibraryItemAsync(dbContext, mediaService, currentUser.UserId.Value, item, isFavorite: null, status: WatchStatus.WantToWatch, rating: null, cancellationToken);
                imported += result.Imported;
                updated += result.Updated;
            }

            foreach (var item in remote.RatedMovies.Concat(remote.RatedSeries))
            {
                var state = await tmdb.GetMediaAccountStateAsync(item.MediaType, item.TmdbId, session.SessionId, cancellationToken);
                int? rating = state.Rating.HasValue ? Math.Clamp((int)Math.Round(state.Rating.Value), 1, 10) : null;
                var result = await UpsertLibraryItemAsync(dbContext, mediaService, currentUser.UserId.Value, item, isFavorite: null, status: WatchStatus.Watched, rating, cancellationToken);
                imported += result.Imported;
                updated += result.Updated;
            }

            session.Connection.LastSyncedAt = dateTimeProvider.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(new TmdbAccountSyncResponse(imported, updated, remote));
        });
    }

    private static async Task<IResult> GetMediaStateAsync(
        string mediaType,
        int tmdbId,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () => Results.Ok(await tmdb.GetMediaAccountStateAsync(mediaType, tmdbId, session.SessionId, cancellationToken)));
    }

    private static async Task<IResult> SetFavoriteAsync(
        string mediaType,
        int tmdbId,
        TmdbAccountActionRequest request,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            await tmdb.SetFavoriteAsync(session.Connection.TmdbAccountId, session.SessionId, mediaType, tmdbId, request.Value, cancellationToken);
            return Results.Ok(await tmdb.GetMediaAccountStateAsync(mediaType, tmdbId, session.SessionId, cancellationToken));
        });
    }

    private static async Task<IResult> SetWatchlistAsync(
        string mediaType,
        int tmdbId,
        TmdbAccountActionRequest request,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            await tmdb.SetWatchlistAsync(session.Connection.TmdbAccountId, session.SessionId, mediaType, tmdbId, request.Value, cancellationToken);
            return Results.Ok(await tmdb.GetMediaAccountStateAsync(mediaType, tmdbId, session.SessionId, cancellationToken));
        });
    }

    private static async Task<IResult> SetRatingAsync(
        string mediaType,
        int tmdbId,
        TmdbRatingRequest request,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        if (request.Value is < 0.5m or > 10m)
        {
            return Results.BadRequest(new { message = "Rating must be between 0.5 and 10." });
        }

        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            await tmdb.SetRatingAsync(session.SessionId, mediaType, tmdbId, request.Value, cancellationToken);
            return Results.Ok(await tmdb.GetMediaAccountStateAsync(mediaType, tmdbId, session.SessionId, cancellationToken));
        });
    }

    private static async Task<IResult> DeleteRatingAsync(
        string mediaType,
        int tmdbId,
        AppDbContext dbContext,
        ITmdbAccountService tmdb,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var session = await GetSessionAsync(dbContext, currentUser, dataProtectionProvider, cancellationToken);
        if (session is null)
        {
            return Results.NotFound(new { message = "TMDB account is not connected." });
        }

        return await ExecuteTmdbAsync(async () =>
        {
            await tmdb.DeleteRatingAsync(session.SessionId, mediaType, tmdbId, cancellationToken);
            return Results.Ok(await tmdb.GetMediaAccountStateAsync(mediaType, tmdbId, session.SessionId, cancellationToken));
        });
    }

    private static async Task<TmdbAccountConnection?> GetConnectionAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        return currentUser.UserId is null
            ? null
            : await dbContext.TmdbAccountConnections.FirstOrDefaultAsync(connection =>
                connection.UserId == currentUser.UserId.Value &&
                connection.RevokedAt == null,
                cancellationToken);
    }

    private static async Task<TmdbSession?> GetSessionAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDataProtectionProvider dataProtectionProvider,
        CancellationToken cancellationToken)
    {
        var connection = await GetConnectionAsync(dbContext, currentUser, cancellationToken);
        var sessionId = connection is null ? null : UnprotectSession(connection, dataProtectionProvider);
        return connection is null || sessionId is null ? null : new TmdbSession(connection, sessionId);
    }

    private static string? UnprotectSession(TmdbAccountConnection connection, IDataProtectionProvider dataProtectionProvider)
    {
        try
        {
            return dataProtectionProvider.CreateProtector(ProtectorPurpose).Unprotect(connection.ProtectedSessionId);
        }
        catch
        {
            return null;
        }
    }

    private static async Task<UpsertResult> UpsertLibraryItemAsync(
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        Guid userId,
        MediaSummaryResponse summary,
        bool? isFavorite,
        WatchStatus? status,
        int? rating,
        CancellationToken cancellationToken)
    {
        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, summary, cancellationToken);
        if (mediaRef is null)
        {
            return new UpsertResult(0, 0);
        }

        var item = await dbContext.UserMediaItems.FirstOrDefaultAsync(candidate =>
            candidate.UserId == userId &&
            (mediaRef.MediaType == MediaType.Movie
                ? candidate.MovieId == mediaRef.MovieId
                : candidate.SeriesId == mediaRef.SeriesId),
            cancellationToken);

        if (item is null)
        {
            dbContext.UserMediaItems.Add(new UserMediaItem
            {
                UserId = userId,
                MediaType = mediaRef.MediaType,
                MovieId = mediaRef.MovieId,
                SeriesId = mediaRef.SeriesId,
                Status = status ?? WatchStatus.WantToWatch,
                IsFavorite = isFavorite ?? false,
                Rating = rating
            });
            return new UpsertResult(1, 0);
        }

        var changed = false;
        if (isFavorite.HasValue && item.IsFavorite != isFavorite.Value)
        {
            item.IsFavorite = isFavorite.Value;
            changed = true;
        }

        if (status.HasValue && item.Status != status.Value)
        {
            item.Status = status.Value;
            changed = true;
        }

        if (rating.HasValue && item.Rating != rating.Value)
        {
            item.Rating = rating.Value;
            changed = true;
        }

        return changed ? new UpsertResult(0, 1) : new UpsertResult(0, 0);
    }

    private static async Task<MediaRef?> EnsureLocalMediaAsync(
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        MediaSummaryResponse summary,
        CancellationToken cancellationToken)
    {
        if (summary.MediaType == "Movie")
        {
            var existing = await dbContext.Movies.FirstOrDefaultAsync(movie => movie.TmdbId == summary.TmdbId, cancellationToken);
            if (existing is not null)
            {
                return MediaRef.ForMovie(existing);
            }

            var movie = new Movie
            {
                TmdbId = summary.TmdbId,
                Title = summary.Title,
                Overview = summary.Overview,
                PosterPath = summary.PosterUrl,
                BackdropPath = summary.BackdropUrl,
                ReleaseDate = summary.ReleaseDate,
                VoteAverage = summary.VoteAverage,
                LastSyncedAt = DateTimeOffset.UtcNow
            };

            dbContext.Movies.Add(movie);
            await dbContext.SaveChangesAsync(cancellationToken);
            return MediaRef.ForMovie(movie);
        }

        var existingSeries = await dbContext.Series.FirstOrDefaultAsync(series => series.TmdbId == summary.TmdbId, cancellationToken);
        if (existingSeries is not null)
        {
            return MediaRef.ForSeries(existingSeries);
        }

        var details = await mediaService.GetSeriesDetailsAsync(summary.TmdbId, cancellationToken);
        var series = new Series
        {
            TmdbId = summary.TmdbId,
            Name = summary.Title,
            Overview = summary.Overview,
            PosterPath = summary.PosterUrl,
            BackdropPath = summary.BackdropUrl,
            FirstAirDate = summary.ReleaseDate,
            LastAirDate = details?.LastAirDate,
            NumberOfSeasons = details?.NumberOfSeasons,
            NumberOfEpisodes = details?.NumberOfEpisodes,
            VoteAverage = summary.VoteAverage,
            LastSyncedAt = DateTimeOffset.UtcNow
        };

        dbContext.Series.Add(series);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MediaRef.ForSeries(series);
    }

    private static string ResolveFrontendOrigin(HttpContext httpContext, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        var origin = httpContext.Request.Headers.Origin.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(origin) &&
            allowedOrigins.Any(allowed => OriginsMatch(allowed, origin)))
        {
            return origin.TrimEnd('/');
        }

        return allowedOrigins.FirstOrDefault()?.TrimEnd('/')
            ?? "http://localhost:5173";
    }

    private static bool OriginsMatch(string allowedOrigin, string candidateOrigin) =>
        allowedOrigin.TrimEnd('/').Equals(candidateOrigin.TrimEnd('/'), StringComparison.OrdinalIgnoreCase);

    private static TmdbConnectionStatusResponse ToStatus(TmdbAccountConnection? connection)
    {
        return connection is null
            ? new TmdbConnectionStatusResponse(false, null, null, null, null, null)
            : new TmdbConnectionStatusResponse(
                true,
                connection.TmdbAccountId,
                connection.Username,
                connection.DisplayName,
                connection.ConnectedAt,
                connection.LastSyncedAt);
    }

    private static async Task<IResult> ExecuteTmdbAsync(Func<Task<IResult>> action)
    {
        try
        {
            return await action();
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(new { message = exception.Message });
        }
        catch (TmdbExternalException)
        {
            return Results.Problem(
                title: "External media provider unavailable",
                detail: "TMDB account data is temporarily unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private sealed record TmdbSession(TmdbAccountConnection Connection, string SessionId);

    private sealed record UpsertResult(int Imported, int Updated);

    private sealed record MediaRef(MediaType MediaType, Guid? MovieId, Guid? SeriesId)
    {
        public static MediaRef ForMovie(Movie movie)
        {
            return new MediaRef(MediaType.Movie, movie.Id, null);
        }

        public static MediaRef ForSeries(Series series)
        {
            return new MediaRef(MediaType.Series, null, series.Id);
        }
    }
}
