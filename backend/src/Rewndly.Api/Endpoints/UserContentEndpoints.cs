using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Rewndly.Api.Extensions;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Application.Modules.UserContent;
using Rewndly.Domain.Events;
using Rewndly.Domain.Library;
using Rewndly.Domain.Lists;
using Rewndly.Domain.Media;
using Rewndly.Domain.Reviews;
using Rewndly.Infrastructure.ExternalServices.Tmdb;
using Rewndly.Infrastructure.Persistence;
using ListEntity = Rewndly.Domain.Lists.List;
using ListItemEntity = Rewndly.Domain.Lists.ListItem;

namespace Rewndly.Api.Endpoints;

public static class UserContentEndpoints
{
    public static IEndpointRouteBuilder MapUserContentEndpoints(this IEndpointRouteBuilder app)
    {
        var me = app.MapGroup("/api/me")
            .RequireAuthorization(AuthPolicies.RequireUser)
            .RequireRateLimiting("user-content");

        me.MapGet("/library", GetLibraryAsync).WithTags("Library");
        me.MapPost("/library/items", CreateLibraryItemAsync).WithTags("Library");
        me.MapPut("/library/items/{id:guid}", UpdateLibraryItemAsync).WithTags("Library");
        me.MapDelete("/library/items/{id:guid}", DeleteLibraryItemAsync).WithTags("Library");

        me.MapGet("/reviews", GetMyReviewsAsync).WithTags("Reviews");
        me.MapPost("/reviews", CreateReviewAsync).WithTags("Reviews");
        me.MapPut("/reviews/{id:guid}", UpdateReviewAsync).WithTags("Reviews");
        me.MapDelete("/reviews/{id:guid}", DeleteReviewAsync).WithTags("Reviews");

        me.MapGet("/lists", GetMyListsAsync).WithTags("Lists");
        me.MapPost("/lists", CreateListAsync).WithTags("Lists");
        me.MapGet("/lists/{id:guid}", GetListDetailsAsync).WithTags("Lists");
        me.MapPut("/lists/{id:guid}", UpdateListAsync).WithTags("Lists");
        me.MapDelete("/lists/{id:guid}", DeleteListAsync).WithTags("Lists");
        me.MapPost("/lists/{id:guid}/items", AddListItemAsync).WithTags("Lists");
        me.MapDelete("/lists/{id:guid}/items/{itemId:guid}", DeleteListItemAsync).WithTags("Lists");

        app.MapGet("/api/reviews/media/{mediaType}/{tmdbId:int}", GetMediaReviewsAsync)
            .WithTags("Reviews")
            .AllowAnonymous();

        return app;
    }

    private static async Task<IResult> GetLibraryAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var items = await dbContext.UserMediaItems
            .AsNoTracking()
            .Include(item => item.Movie)
            .Include(item => item.Series)
            .Where(item => item.UserId == currentUser.UserId.Value)
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(items.Select(ToLibraryItemResponse).ToList());
    }

    private static async Task<IResult> CreateLibraryItemAsync(
        LibraryItemRequest request,
        IValidator<LibraryItemRequest> validator,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, request.MediaType, request.TmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.NotFound(new { message = "Media item was not found." });
        }

        var duplicateExists = await LibraryDuplicateExistsAsync(
            dbContext,
            currentUser.UserId.Value,
            mediaRef,
            excludedItemId: null,
            cancellationToken);

        if (duplicateExists)
        {
            return Results.Conflict(new { message = "This media item already exists in your library." });
        }

        var status = ParseEnum<WatchStatus>(request.Status);
        var item = new UserMediaItem
        {
            UserId = currentUser.UserId.Value,
            MediaType = mediaRef.MediaType,
            MovieId = mediaRef.MovieId,
            SeriesId = mediaRef.SeriesId,
            Status = status,
            IsFavorite = request.IsFavorite,
            Rating = request.Rating,
            WatchedAt = request.WatchedAt,
            StartedAt = request.StartedAt
        };

        dbContext.UserMediaItems.Add(item);
        AddLibraryActivityEvents(dbContext, currentUser.UserId.Value, item, isNew: true);
        AddSystemEvent(dbContext, SystemEventType.LibraryItemCreated, currentUser.UserId.Value, "UserMediaItem", item.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.Entry(item).Reference(entity => entity.Movie).LoadAsync(cancellationToken);
        await dbContext.Entry(item).Reference(entity => entity.Series).LoadAsync(cancellationToken);

        return Results.Created($"/api/me/library/items/{item.Id}", ToLibraryItemResponse(item));
    }

    private static async Task<IResult> UpdateLibraryItemAsync(
        Guid id,
        LibraryItemRequest request,
        IValidator<LibraryItemRequest> validator,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var item = await dbContext.UserMediaItems
            .Include(entity => entity.Movie)
            .Include(entity => entity.Series)
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, request.MediaType, request.TmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.NotFound(new { message = "Media item was not found." });
        }

        var duplicateExists = await LibraryDuplicateExistsAsync(
            dbContext,
            currentUser.UserId.Value,
            mediaRef,
            id,
            cancellationToken);

        if (duplicateExists)
        {
            return Results.Conflict(new { message = "This media item already exists in your library." });
        }

        var previousStatus = item.Status;
        var wasFavorite = item.IsFavorite;
        var previousRating = item.Rating;

        item.MediaType = mediaRef.MediaType;
        item.MovieId = mediaRef.MovieId;
        item.SeriesId = mediaRef.SeriesId;
        item.Status = ParseEnum<WatchStatus>(request.Status);
        item.IsFavorite = request.IsFavorite;
        item.Rating = request.Rating;
        item.WatchedAt = request.WatchedAt;
        item.StartedAt = request.StartedAt;

        AddLibraryActivityEvents(dbContext, currentUser.UserId.Value, item, isNew: false, previousStatus, wasFavorite, previousRating);
        AddSystemEvent(dbContext, SystemEventType.LibraryItemUpdated, currentUser.UserId.Value, "UserMediaItem", item.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.Entry(item).Reference(entity => entity.Movie).LoadAsync(cancellationToken);
        await dbContext.Entry(item).Reference(entity => entity.Series).LoadAsync(cancellationToken);

        return Results.Ok(ToLibraryItemResponse(item));
    }

    private static async Task<IResult> DeleteLibraryItemAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var item = await dbContext.UserMediaItems
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        dbContext.UserMediaItems.Remove(item);
        AddSystemEvent(dbContext, SystemEventType.LibraryItemDeleted, currentUser.UserId.Value, "UserMediaItem", item.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> GetMediaReviewsAsync(
        string mediaType,
        int tmdbId,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        CancellationToken cancellationToken)
    {
        if (!TryParseEnum<MediaType>(mediaType, out var parsedMediaType) || tmdbId <= 0)
        {
            return Results.BadRequest(new { message = "Invalid media type or TMDB id." });
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, mediaType, tmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.Ok(Array.Empty<ReviewResponse>());
        }

        var reviews = await dbContext.Reviews
            .AsNoTracking()
            .Include(review => review.User)
            .Include(review => review.Movie)
            .Include(review => review.Series)
            .Where(review =>
                review.Visibility == ReviewVisibility.Public &&
                review.MediaType == parsedMediaType &&
                (parsedMediaType == MediaType.Movie
                    ? review.MovieId == mediaRef.MovieId
                    : review.SeriesId == mediaRef.SeriesId))
            .OrderByDescending(review => review.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(reviews.Select(ToReviewResponse).ToList());
    }

    private static async Task<IResult> GetMyReviewsAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var reviews = await dbContext.Reviews
            .AsNoTracking()
            .Include(review => review.User)
            .Include(review => review.Movie)
            .Include(review => review.Series)
            .Where(review => review.UserId == currentUser.UserId.Value)
            .OrderByDescending(review => review.UpdatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(reviews.Select(ToReviewResponse).ToList());
    }

    private static async Task<IResult> CreateReviewAsync(
        ReviewRequest request,
        IValidator<ReviewRequest> validator,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, request.MediaType, request.TmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.NotFound(new { message = "Media item was not found." });
        }

        var review = new Review
        {
            UserId = currentUser.UserId.Value,
            MediaType = mediaRef.MediaType,
            MovieId = mediaRef.MovieId,
            SeriesId = mediaRef.SeriesId,
            RatingSnapshot = request.RatingSnapshot,
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            ContainsSpoilers = request.ContainsSpoilers,
            Visibility = ParseEnum<ReviewVisibility>(request.Visibility)
        };

        dbContext.Reviews.Add(review);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.Reviewed, mediaRef, new { reviewId = review.Id });
        AddSystemEvent(dbContext, SystemEventType.ReviewCreated, currentUser.UserId.Value, "Review", review.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        await LoadReviewReferencesAsync(dbContext, review, cancellationToken);
        return Results.Created($"/api/me/reviews/{review.Id}", ToReviewResponse(review));
    }

    private static async Task<IResult> UpdateReviewAsync(
        Guid id,
        ReviewRequest request,
        IValidator<ReviewRequest> validator,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var review = await dbContext.Reviews
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (review is null)
        {
            return Results.NotFound();
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, request.MediaType, request.TmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.NotFound(new { message = "Media item was not found." });
        }

        review.MediaType = mediaRef.MediaType;
        review.MovieId = mediaRef.MovieId;
        review.SeriesId = mediaRef.SeriesId;
        review.RatingSnapshot = request.RatingSnapshot;
        review.Title = request.Title.Trim();
        review.Body = request.Body.Trim();
        review.ContainsSpoilers = request.ContainsSpoilers;
        review.Visibility = ParseEnum<ReviewVisibility>(request.Visibility);

        AddSystemEvent(dbContext, SystemEventType.ReviewUpdated, currentUser.UserId.Value, "Review", review.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        await LoadReviewReferencesAsync(dbContext, review, cancellationToken);
        return Results.Ok(ToReviewResponse(review));
    }

    private static async Task<IResult> DeleteReviewAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var review = await dbContext.Reviews
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (review is null)
        {
            return Results.NotFound();
        }

        review.IsDeleted = true;
        review.DeletedAt = dateTimeProvider.UtcNow;
        AddSystemEvent(dbContext, SystemEventType.ReviewDeleted, currentUser.UserId.Value, "Review", review.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> GetMyListsAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var lists = await dbContext.Lists
            .AsNoTracking()
            .Where(list => list.UserId == currentUser.UserId.Value)
            .OrderByDescending(list => list.UpdatedAt)
            .ToListAsync(cancellationToken);

        var listIds = lists.Select(list => list.Id).ToList();
        var itemCounts = await dbContext.ListItems
            .AsNoTracking()
            .Where(item => listIds.Contains(item.ListId))
            .GroupBy(item => item.ListId)
            .Select(group => new { ListId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.ListId, group => group.Count, cancellationToken);

        var response = lists.Select(list => new UserListResponse(
            list.Id,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            itemCounts.GetValueOrDefault(list.Id),
            list.CreatedAt,
            list.UpdatedAt)).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateListAsync(
        UserListRequest request,
        IValidator<UserListRequest> validator,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var list = new ListEntity
        {
            UserId = currentUser.UserId.Value,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Visibility = ParseEnum<ListVisibility>(request.Visibility)
        };

        dbContext.Lists.Add(list);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.CreatedList, null, new { listId = list.Id, list.Title });
        AddSystemEvent(dbContext, SystemEventType.ListCreated, currentUser.UserId.Value, "List", list.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/me/lists/{list.Id}", new UserListResponse(
            list.Id,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            0,
            list.CreatedAt,
            list.UpdatedAt));
    }

    private static async Task<IResult> GetListDetailsAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var list = await dbContext.Lists
            .AsNoTracking()
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        var items = await dbContext.ListItems
            .AsNoTracking()
            .Include(item => item.Movie)
            .Include(item => item.Series)
            .Where(item => item.ListId == list.Id)
            .OrderBy(item => item.Position)
            .ThenBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(new UserListDetailsResponse(
            list.Id,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            items.Select(ToListItemResponse).ToList(),
            list.CreatedAt,
            list.UpdatedAt));
    }

    private static async Task<IResult> UpdateListAsync(
        Guid id,
        UserListRequest request,
        IValidator<UserListRequest> validator,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var list = await dbContext.Lists
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        list.Title = request.Title.Trim();
        list.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        list.Visibility = ParseEnum<ListVisibility>(request.Visibility);

        AddSystemEvent(dbContext, SystemEventType.ListUpdated, currentUser.UserId.Value, "List", list.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        var itemCount = await dbContext.ListItems.CountAsync(item => item.ListId == list.Id, cancellationToken);
        return Results.Ok(new UserListResponse(
            list.Id,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            itemCount,
            list.CreatedAt,
            list.UpdatedAt));
    }

    private static async Task<IResult> DeleteListAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var list = await dbContext.Lists
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        list.IsDeleted = true;
        list.DeletedAt = dateTimeProvider.UtcNow;
        AddSystemEvent(dbContext, SystemEventType.ListDeleted, currentUser.UserId.Value, "List", list.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> AddListItemAsync(
        Guid id,
        UserListItemRequest request,
        IValidator<UserListItemRequest> validator,
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var list = await dbContext.Lists
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        var mediaRef = await EnsureLocalMediaAsync(dbContext, mediaService, request.MediaType, request.TmdbId, cancellationToken);
        if (mediaRef is null)
        {
            return Results.NotFound(new { message = "Media item was not found." });
        }

        var duplicateExists = await dbContext.ListItems.AnyAsync(item =>
            item.ListId == list.Id &&
            (mediaRef.MediaType == MediaType.Movie
                ? item.MovieId == mediaRef.MovieId
                : item.SeriesId == mediaRef.SeriesId),
            cancellationToken);

        if (duplicateExists)
        {
            return Results.Conflict(new { message = "This media item already exists in the list." });
        }

        var nextPosition = request.Position ?? await dbContext.ListItems
            .Where(item => item.ListId == list.Id)
            .Select(item => (int?)item.Position)
            .MaxAsync(cancellationToken) + 1 ?? 0;

        var listItem = new ListItemEntity
        {
            ListId = list.Id,
            MediaType = mediaRef.MediaType,
            MovieId = mediaRef.MovieId,
            SeriesId = mediaRef.SeriesId,
            Position = nextPosition,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        dbContext.ListItems.Add(listItem);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.AddedToList, mediaRef, new { listId = list.Id, list.Title });
        AddSystemEvent(dbContext, SystemEventType.ListItemAdded, currentUser.UserId.Value, "ListItem", listItem.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.Entry(listItem).Reference(entity => entity.Movie).LoadAsync(cancellationToken);
        await dbContext.Entry(listItem).Reference(entity => entity.Series).LoadAsync(cancellationToken);

        return Results.Created($"/api/me/lists/{list.Id}/items/{listItem.Id}", ToListItemResponse(listItem));
    }

    private static async Task<IResult> DeleteListItemAsync(
        Guid id,
        Guid itemId,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var list = await dbContext.Lists
            .FirstOrDefaultAsync(entity =>
                entity.Id == id &&
                entity.UserId == currentUser.UserId.Value,
                cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        var item = await dbContext.ListItems
            .FirstOrDefaultAsync(entity =>
                entity.Id == itemId &&
                entity.ListId == list.Id,
                cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        dbContext.ListItems.Remove(item);
        AddSystemEvent(dbContext, SystemEventType.ListItemRemoved, currentUser.UserId.Value, "ListItem", item.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<MediaRef?> EnsureLocalMediaAsync(
        AppDbContext dbContext,
        IPublicMediaService mediaService,
        string mediaType,
        int tmdbId,
        CancellationToken cancellationToken)
    {
        if (!TryParseEnum<MediaType>(mediaType, out var parsedMediaType) || tmdbId <= 0)
        {
            return null;
        }

        try
        {
            if (parsedMediaType == MediaType.Movie)
            {
                var existing = await dbContext.Movies.FirstOrDefaultAsync(movie => movie.TmdbId == tmdbId, cancellationToken);
                if (existing is not null)
                {
                    return MediaRef.ForMovie(existing);
                }

                var details = await mediaService.GetMovieDetailsAsync(tmdbId, cancellationToken);
                if (details is null)
                {
                    return null;
                }

                var movie = new Movie
                {
                    TmdbId = details.TmdbId,
                    Title = details.Title,
                    OriginalTitle = details.OriginalTitle,
                    Overview = details.Overview,
                    PosterPath = details.PosterUrl,
                    BackdropPath = details.BackdropUrl,
                    ReleaseDate = details.ReleaseDate,
                    RuntimeMinutes = details.RuntimeMinutes,
                    VoteAverage = details.VoteAverage.HasValue ? Convert.ToDecimal(details.VoteAverage.Value) : null,
                    LastSyncedAt = DateTimeOffset.UtcNow
                };

                dbContext.Movies.Add(movie);
                await dbContext.SaveChangesAsync(cancellationToken);
                return MediaRef.ForMovie(movie);
            }

            var existingSeries = await dbContext.Series.FirstOrDefaultAsync(series => series.TmdbId == tmdbId, cancellationToken);
            if (existingSeries is not null)
            {
                return MediaRef.ForSeries(existingSeries);
            }

            var seriesDetails = await mediaService.GetSeriesDetailsAsync(tmdbId, cancellationToken);
            if (seriesDetails is null)
            {
                return null;
            }

            var series = new Series
            {
                TmdbId = seriesDetails.TmdbId,
                Name = seriesDetails.Name,
                OriginalName = seriesDetails.OriginalName,
                Overview = seriesDetails.Overview,
                PosterPath = seriesDetails.PosterUrl,
                BackdropPath = seriesDetails.BackdropUrl,
                FirstAirDate = seriesDetails.FirstAirDate,
                LastAirDate = seriesDetails.LastAirDate,
                NumberOfSeasons = seriesDetails.NumberOfSeasons,
                NumberOfEpisodes = seriesDetails.NumberOfEpisodes,
                VoteAverage = seriesDetails.VoteAverage.HasValue ? Convert.ToDecimal(seriesDetails.VoteAverage.Value) : null,
                LastSyncedAt = DateTimeOffset.UtcNow
            };

            dbContext.Series.Add(series);
            await dbContext.SaveChangesAsync(cancellationToken);
            return MediaRef.ForSeries(series);
        }
        catch (TmdbExternalException)
        {
            return null;
        }
    }

    private static async Task<bool> LibraryDuplicateExistsAsync(
        AppDbContext dbContext,
        Guid userId,
        MediaRef mediaRef,
        Guid? excludedItemId,
        CancellationToken cancellationToken)
    {
        return await dbContext.UserMediaItems.AnyAsync(item =>
            item.UserId == userId &&
            (!excludedItemId.HasValue || item.Id != excludedItemId.Value) &&
            (mediaRef.MediaType == MediaType.Movie
                ? item.MovieId == mediaRef.MovieId
                : item.SeriesId == mediaRef.SeriesId),
            cancellationToken);
    }

    private static void AddLibraryActivityEvents(
        AppDbContext dbContext,
        Guid userId,
        UserMediaItem item,
        bool isNew,
        WatchStatus? previousStatus = null,
        bool wasFavorite = false,
        int? previousRating = null)
    {
        var mediaRef = MediaRef.FromItem(item);

        if (isNew || item.Status == WatchStatus.WantToWatch)
        {
            AddActivityEvent(dbContext, userId, ActivityEventType.AddedToWatchlist, mediaRef, new { itemId = item.Id, item.Status });
        }

        if (item.Status == WatchStatus.Watched && previousStatus != WatchStatus.Watched)
        {
            AddActivityEvent(dbContext, userId, ActivityEventType.MarkedAsWatched, mediaRef, new { itemId = item.Id });
        }

        if (item.Rating.HasValue && item.Rating != previousRating)
        {
            AddActivityEvent(dbContext, userId, ActivityEventType.Rated, mediaRef, new { itemId = item.Id, item.Rating });
        }

        if (item.IsFavorite && !wasFavorite)
        {
            AddActivityEvent(dbContext, userId, ActivityEventType.Favorited, mediaRef, new { itemId = item.Id });
        }
    }

    private static void AddActivityEvent(
        AppDbContext dbContext,
        Guid userId,
        ActivityEventType eventType,
        MediaRef? mediaRef,
        object? metadata)
    {
        dbContext.ActivityEvents.Add(new ActivityEvent
        {
            UserId = userId,
            EventType = eventType,
            MediaType = mediaRef?.MediaType,
            MovieId = mediaRef?.MovieId,
            SeriesId = mediaRef?.SeriesId,
            MetadataJson = metadata is null ? null : JsonSerializer.Serialize(metadata)
        });
    }

    private static void AddSystemEvent(
        AppDbContext dbContext,
        SystemEventType eventType,
        Guid? userId,
        string entityType,
        Guid entityId,
        HttpContext httpContext)
    {
        dbContext.SystemEvents.Add(new SystemEvent
        {
            UserId = userId,
            EventType = eventType,
            EntityType = entityType,
            EntityId = entityId,
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext.Request.Headers.UserAgent.ToString()
        });
    }

    private static async Task LoadReviewReferencesAsync(AppDbContext dbContext, Review review, CancellationToken cancellationToken)
    {
        await dbContext.Entry(review).Reference(entity => entity.User).LoadAsync(cancellationToken);
        await dbContext.Entry(review).Reference(entity => entity.Movie).LoadAsync(cancellationToken);
        await dbContext.Entry(review).Reference(entity => entity.Series).LoadAsync(cancellationToken);
    }

    private static LibraryItemResponse ToLibraryItemResponse(UserMediaItem item)
    {
        var media = MediaView.From(item.MediaType, item.Movie, item.Series);
        return new LibraryItemResponse(
            item.Id,
            item.MediaType.ToString(),
            media.TmdbId,
            media.Title,
            media.PosterUrl,
            item.Status.ToString(),
            item.IsFavorite,
            item.Rating,
            item.WatchedAt,
            item.StartedAt,
            item.CreatedAt,
            item.UpdatedAt);
    }

    private static ReviewResponse ToReviewResponse(Review review)
    {
        var media = MediaView.From(review.MediaType, review.Movie, review.Series);
        return new ReviewResponse(
            review.Id,
            review.UserId,
            review.User?.Username ?? "usuario",
            review.MediaType.ToString(),
            media.TmdbId,
            media.Title,
            review.RatingSnapshot,
            review.Title,
            review.Body,
            review.ContainsSpoilers,
            review.Visibility.ToString(),
            review.CreatedAt,
            review.UpdatedAt);
    }

    private static UserListItemResponse ToListItemResponse(ListItemEntity item)
    {
        var media = MediaView.From(item.MediaType, item.Movie, item.Series);
        return new UserListItemResponse(
            item.Id,
            item.MediaType.ToString(),
            media.TmdbId,
            media.Title,
            media.PosterUrl,
            item.Position,
            item.Note,
            item.CreatedAt);
    }

    private static TEnum ParseEnum<TEnum>(string value)
        where TEnum : struct
    {
        return Enum.Parse<TEnum>(value, ignoreCase: true);
    }

    private static bool TryParseEnum<TEnum>(string value, out TEnum parsed)
        where TEnum : struct
    {
        return Enum.TryParse(value, ignoreCase: true, out parsed);
    }

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

        public static MediaRef FromItem(UserMediaItem item)
        {
            return new MediaRef(item.MediaType, item.MovieId, item.SeriesId);
        }
    }

    private sealed record MediaView(int TmdbId, string Title, string? PosterUrl)
    {
        public static MediaView From(MediaType mediaType, Movie? movie, Series? series)
        {
            if (mediaType == MediaType.Movie)
            {
                return new MediaView(movie?.TmdbId ?? 0, movie?.Title ?? "Sin titulo", movie?.PosterPath);
            }

            return new MediaView(series?.TmdbId ?? 0, series?.Name ?? "Sin titulo", series?.PosterPath);
        }
    }
}
