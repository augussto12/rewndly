using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Rewndly.Api.Extensions;
using Rewndly.Api.Services;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Social;
using Rewndly.Domain.Admin;
using Rewndly.Domain.Events;
using Rewndly.Domain.Friends;
using Rewndly.Domain.Lists;
using Rewndly.Domain.Media;
using Rewndly.Domain.Reviews;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Persistence;
using ListEntity = Rewndly.Domain.Lists.List;
using ListItemEntity = Rewndly.Domain.Lists.ListItem;

namespace Rewndly.Api.Endpoints;

public static class SocialEndpoints
{
    private static readonly ActivityEventType[] FeedEventTypes =
    [
        ActivityEventType.AddedToWatchlist,
        ActivityEventType.MarkedAsWatched,
        ActivityEventType.Rated,
        ActivityEventType.Reviewed,
        ActivityEventType.CreatedList,
        ActivityEventType.AddedToList,
        ActivityEventType.Favorited,
        ActivityEventType.FriendRequestAccepted,
        ActivityEventType.FriendAdded
    ];

    public static IEndpointRouteBuilder MapSocialEndpoints(this IEndpointRouteBuilder app)
    {
        var friends = app.MapGroup("/api/friends")
            .RequireAuthorization(AuthPolicies.RequireUser)
            .RequireRateLimiting("user-content")
            .WithTags("Friends");

        friends.MapGet("/", GetFriendsAsync);
        friends.MapGet("/requests", GetFriendRequestsAsync);
        friends.MapPost("/requests", CreateFriendRequestAsync);
        friends.MapPost("/requests/{id:guid}/accept", AcceptFriendRequestAsync);
        friends.MapPost("/requests/{id:guid}/reject", RejectFriendRequestAsync);
        friends.MapDelete("/{id:guid}", DeleteFriendshipAsync);

        app.MapGet("/api/users/{username}", GetUserProfileAsync)
            .AllowAnonymous()
            .WithTags("Users");
        app.MapGet("/api/users/{username}/stats", GetUserStatsAsync)
            .AllowAnonymous()
            .WithTags("Users");
        app.MapGet("/api/users/{username}/lists", GetUserListsAsync)
            .AllowAnonymous()
            .WithTags("Users");
        app.MapGet("/api/users/{username}/reviews", GetUserReviewsAsync)
            .AllowAnonymous()
            .WithTags("Users");

        app.MapGet("/api/reviews/public", GetPublicReviewsAsync)
            .AllowAnonymous()
            .WithTags("Reviews");
        app.MapGet("/api/reviews/users/{username}", GetUserReviewsAsync)
            .AllowAnonymous()
            .WithTags("Reviews");

        app.MapGet("/api/lists/public", GetPublicListsAsync)
            .AllowAnonymous()
            .WithTags("Lists");
        app.MapGet("/api/lists/{id:guid}", GetPublicListDetailsAsync)
            .AllowAnonymous()
            .WithTags("Lists");

        app.MapGet("/api/feed", GetFeedAsync)
            .RequireAuthorization(AuthPolicies.RequireUser)
            .WithTags("Feed");

        return app;
    }

    private static async Task<IResult> GetFriendsAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var friendships = await dbContext.Friendships
            .AsNoTracking()
            .Include(friendship => friendship.Requester)
            .Include(friendship => friendship.Receiver)
            .Where(friendship =>
                friendship.Status == FriendshipStatus.Accepted &&
                (friendship.RequesterId == currentUser.UserId.Value || friendship.ReceiverId == currentUser.UserId.Value))
            .OrderByDescending(friendship => friendship.CreatedAt)
            .ToListAsync(cancellationToken);

        var response = friendships
            .Select(friendship =>
            {
                var friend = friendship.RequesterId == currentUser.UserId.Value ? friendship.Receiver! : friendship.Requester!;
                return new FriendResponse(friendship.Id, friend.Username, friend.DisplayName, friend.AvatarUrl, friendship.CreatedAt);
            })
            .ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> GetFriendRequestsAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var requests = await dbContext.FriendshipRequests
            .AsNoTracking()
            .Include(request => request.Requester)
            .Include(request => request.Receiver)
            .Where(request => request.RequesterId == currentUser.UserId.Value || request.ReceiverId == currentUser.UserId.Value)
            .OrderByDescending(request => request.CreatedAt)
            .ToListAsync(cancellationToken);

        var response = requests.Select(request =>
        {
            var isIncoming = request.ReceiverId == currentUser.UserId.Value;
            var other = isIncoming ? request.Requester! : request.Receiver!;
            return new FriendshipRequestResponse(
                request.Id,
                isIncoming ? "Incoming" : "Outgoing",
                other.Username,
                other.DisplayName,
                other.AvatarUrl,
                request.CreatedAt);
        }).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateFriendRequestAsync(
        FriendshipRequestCreateRequest request,
        IValidator<FriendshipRequestCreateRequest> validator,
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

        var receiver = await dbContext.Users.FirstOrDefaultAsync(user =>
            user.Username.ToLower() == request.Username.Trim().ToLowerInvariant() &&
            !user.IsDeleted &&
            !user.IsDisabled,
            cancellationToken);

        if (receiver is null)
        {
            return Results.NotFound(new { message = "User was not found." });
        }

        if (receiver.Id == currentUser.UserId.Value)
        {
            return Results.BadRequest(new { message = "You cannot send a friendship request to yourself." });
        }

        var alreadyFriends = await FriendshipExistsAsync(dbContext, currentUser.UserId.Value, receiver.Id, cancellationToken);
        if (alreadyFriends)
        {
            return Results.Conflict(new { message = "Friendship already exists." });
        }

        var duplicateRequest = await dbContext.FriendshipRequests.AnyAsync(friendshipRequest =>
            (friendshipRequest.RequesterId == currentUser.UserId.Value && friendshipRequest.ReceiverId == receiver.Id) ||
            (friendshipRequest.RequesterId == receiver.Id && friendshipRequest.ReceiverId == currentUser.UserId.Value),
            cancellationToken);

        if (duplicateRequest)
        {
            return Results.Conflict(new { message = "Friendship request already exists." });
        }

        var friendshipRequest = new FriendshipRequest
        {
            RequesterId = currentUser.UserId.Value,
            ReceiverId = receiver.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.FriendshipRequests.Add(friendshipRequest);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.FriendRequestSent, new { receiver.Username });
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/friends/requests/{friendshipRequest.Id}", new FriendshipRequestResponse(
            friendshipRequest.Id,
            "Outgoing",
            receiver.Username,
            receiver.DisplayName,
            receiver.AvatarUrl,
            friendshipRequest.CreatedAt));
    }

    private static async Task<IResult> AcceptFriendRequestAsync(
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

        var request = await dbContext.FriendshipRequests
            .Include(friendshipRequest => friendshipRequest.Requester)
            .FirstOrDefaultAsync(friendshipRequest =>
                friendshipRequest.Id == id &&
                friendshipRequest.ReceiverId == currentUser.UserId.Value,
                cancellationToken);

        if (request is null)
        {
            return Results.NotFound();
        }

        if (await FriendshipExistsAsync(dbContext, request.RequesterId, request.ReceiverId, cancellationToken))
        {
            dbContext.FriendshipRequests.Remove(request);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Conflict(new { message = "Friendship already exists." });
        }

        var friendship = new Friendship
        {
            RequesterId = request.RequesterId,
            ReceiverId = request.ReceiverId,
            Status = FriendshipStatus.Accepted
        };

        dbContext.Friendships.Add(friendship);
        dbContext.FriendshipRequests.Remove(request);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.FriendRequestAccepted, new { requesterId = request.RequesterId });
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.FriendAdded, new { friendId = request.RequesterId });
        AddSystemEvent(dbContext, SystemEventType.FriendshipCreated, currentUser.UserId.Value, "Friendship", friendship.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new FriendResponse(
            friendship.Id,
            request.Requester?.Username ?? string.Empty,
            request.Requester?.DisplayName ?? string.Empty,
            request.Requester?.AvatarUrl,
            friendship.CreatedAt));
    }

    private static async Task<IResult> RejectFriendRequestAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var request = await dbContext.FriendshipRequests
            .FirstOrDefaultAsync(friendshipRequest =>
                friendshipRequest.Id == id &&
                friendshipRequest.ReceiverId == currentUser.UserId.Value,
                cancellationToken);

        if (request is null)
        {
            return Results.NotFound();
        }

        dbContext.FriendshipRequests.Remove(request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteFriendshipAsync(
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

        var friendship = await dbContext.Friendships.FirstOrDefaultAsync(candidate =>
            candidate.Id == id &&
            candidate.Status == FriendshipStatus.Accepted &&
            (candidate.RequesterId == currentUser.UserId.Value || candidate.ReceiverId == currentUser.UserId.Value),
            cancellationToken);

        if (friendship is null)
        {
            return Results.NotFound();
        }

        dbContext.Friendships.Remove(friendship);
        AddActivityEvent(dbContext, currentUser.UserId.Value, ActivityEventType.FriendRemoved, new { friendshipId = friendship.Id });
        AddSystemEvent(dbContext, SystemEventType.FriendshipDeleted, currentUser.UserId.Value, "Friendship", friendship.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetUserProfileAsync(
        string username,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        SocialVisibilityService visibilityService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var user = await FindPublicUserAsync(dbContext, username, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        var canView = await visibilityService.CanViewProfileAsync(user, cancellationToken);
        var isFriend = currentUser.UserId.HasValue &&
            await visibilityService.AreFriendsAsync(currentUser.UserId.Value, user.Id, cancellationToken);

        if (!canView)
        {
            return Results.Forbid();
        }

        if (currentUser.Role == "Admin" && currentUser.UserId != user.Id &&
            user.PrivacySettings?.ProfileVisibility == ProfileVisibility.Private)
        {
            AddAdminAuditLog(dbContext, currentUser.UserId, user.Id, httpContext);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Results.Ok(new PublicUserProfileResponse(
            user.Username,
            user.DisplayName,
            user.AvatarUrl,
            user.Bio,
            (user.PrivacySettings?.ProfileVisibility ?? ProfileVisibility.Public).ToString(),
            currentUser.UserId == user.Id,
            isFriend,
            canView));
    }

    private static async Task<IResult> GetUserStatsAsync(
        string username,
        AppDbContext dbContext,
        SocialVisibilityService visibilityService,
        CancellationToken cancellationToken)
    {
        var user = await FindPublicUserAsync(dbContext, username, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        if (!await visibilityService.CanViewProfileAsync(user, cancellationToken) || user.PrivacySettings?.ShowStats == false)
        {
            return Results.Forbid();
        }

        var libraryItems = await dbContext.UserMediaItems.CountAsync(item => item.UserId == user.Id, cancellationToken);
        var watched = await dbContext.UserMediaItems.CountAsync(item => item.UserId == user.Id && item.Status == Domain.Library.WatchStatus.Watched, cancellationToken);
        var reviews = await dbContext.Reviews.CountAsync(review => review.UserId == user.Id, cancellationToken);
        var lists = await dbContext.Lists.CountAsync(list => list.UserId == user.Id, cancellationToken);
        var friends = await dbContext.Friendships.CountAsync(friendship =>
            friendship.Status == FriendshipStatus.Accepted &&
            (friendship.RequesterId == user.Id || friendship.ReceiverId == user.Id),
            cancellationToken);

        return Results.Ok(new UserStatsResponse(user.Username, libraryItems, watched, reviews, lists, friends));
    }

    private static async Task<IResult> GetUserListsAsync(
        string username,
        int page,
        int pageSize,
        AppDbContext dbContext,
        SocialVisibilityService visibilityService,
        CancellationToken cancellationToken)
    {
        var user = await FindPublicUserAsync(dbContext, username, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        if (!await visibilityService.CanViewProfileAsync(user, cancellationToken))
        {
            return Results.Forbid();
        }

        var lists = await dbContext.Lists
            .AsNoTracking()
            .Include(list => list.User)
            .Where(list => list.UserId == user.Id)
            .OrderByDescending(list => list.UpdatedAt)
            .Skip((NormalizePage(page) - 1) * NormalizePageSize(pageSize))
            .Take(NormalizePageSize(pageSize))
            .ToListAsync(cancellationToken);

        var visible = new List<ListEntity>();
        foreach (var list in lists)
        {
            if (await visibilityService.CanViewListAsync(list, cancellationToken))
            {
                visible.Add(list);
            }
        }

        return Results.Ok(await ToPublicListsAsync(dbContext, visible, cancellationToken));
    }

    private static async Task<IResult> GetUserReviewsAsync(
        string username,
        int page,
        int pageSize,
        AppDbContext dbContext,
        SocialVisibilityService visibilityService,
        CancellationToken cancellationToken)
    {
        var user = await FindPublicUserAsync(dbContext, username, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        if (!await visibilityService.CanViewProfileAsync(user, cancellationToken))
        {
            return Results.Forbid();
        }

        var reviews = await LoadReviewsQuery(dbContext)
            .Where(review => review.UserId == user.Id)
            .OrderByDescending(review => review.CreatedAt)
            .Skip((NormalizePage(page) - 1) * NormalizePageSize(pageSize))
            .Take(NormalizePageSize(pageSize))
            .ToListAsync(cancellationToken);

        var visible = new List<Review>();
        foreach (var review in reviews)
        {
            if (await visibilityService.CanViewReviewAsync(review, cancellationToken))
            {
                visible.Add(review);
            }
        }

        return Results.Ok(visible.Select(ToPublicReviewResponse).ToList());
    }

    private static async Task<IResult> GetPublicReviewsAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);

        var reviews = await LoadReviewsQuery(dbContext)
            .Where(review => review.Visibility == ReviewVisibility.Public)
            .OrderByDescending(review => review.CreatedAt)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return Results.Ok(reviews.Select(ToPublicReviewResponse).ToList());
    }

    private static async Task<IResult> GetPublicListsAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);

        var lists = await dbContext.Lists
            .AsNoTracking()
            .Include(list => list.User)
            .Where(list => list.Visibility == ListVisibility.Public)
            .OrderByDescending(list => list.UpdatedAt)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return Results.Ok(await ToPublicListsAsync(dbContext, lists, cancellationToken));
    }

    private static async Task<IResult> GetPublicListDetailsAsync(
        Guid id,
        AppDbContext dbContext,
        SocialVisibilityService visibilityService,
        CancellationToken cancellationToken)
    {
        var list = await dbContext.Lists
            .AsNoTracking()
            .Include(entity => entity.User)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        if (!await visibilityService.CanViewListAsync(list, cancellationToken))
        {
            return Results.Forbid();
        }

        var items = await dbContext.ListItems
            .AsNoTracking()
            .Include(item => item.Movie)
            .Include(item => item.Series)
            .Where(item => item.ListId == list.Id)
            .OrderBy(item => item.Position)
            .ThenBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(new PublicListDetailsResponse(
            list.Id,
            list.User?.Username ?? string.Empty,
            list.User?.DisplayName ?? string.Empty,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            items.Select(ToPublicListItemResponse).ToList(),
            list.CreatedAt,
            list.UpdatedAt));
    }

    private static async Task<IResult> GetFeedAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return Results.Unauthorized();
        }

        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);
        var friendIds = await GetFriendIdsAsync(dbContext, currentUser.UserId.Value, cancellationToken);
        var visibleUserIds = friendIds.Append(currentUser.UserId.Value).ToList();

        var events = await dbContext.ActivityEvents
            .AsNoTracking()
            .Include(activityEvent => activityEvent.User)
                .ThenInclude(user => user!.PrivacySettings)
            .Include(activityEvent => activityEvent.Movie)
            .Include(activityEvent => activityEvent.Series)
            .Where(activityEvent =>
                visibleUserIds.Contains(activityEvent.UserId) &&
                FeedEventTypes.Contains(activityEvent.EventType) &&
                (activityEvent.UserId == currentUser.UserId.Value || activityEvent.User!.PrivacySettings == null || activityEvent.User.PrivacySettings.ShowActivity))
            .OrderByDescending(activityEvent => activityEvent.CreatedAt)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize + 1)
            .ToListAsync(cancellationToken);

        var hasMore = events.Count > normalizedPageSize;
        var items = events.Take(normalizedPageSize).Select(ToActivityEventResponse).ToList();
        return Results.Ok(new FeedResponse(items, normalizedPage, normalizedPageSize, hasMore));
    }

    private static async Task<User?> FindPublicUserAsync(AppDbContext dbContext, string username, CancellationToken cancellationToken)
    {
        var normalized = username.Trim().ToLowerInvariant();
        return await dbContext.Users
            .Include(user => user.PrivacySettings)
            .FirstOrDefaultAsync(user =>
                user.Username.ToLower() == normalized &&
                !user.IsDeleted &&
                !user.IsDisabled,
                cancellationToken);
    }

    private static IQueryable<Review> LoadReviewsQuery(AppDbContext dbContext)
    {
        return dbContext.Reviews
            .AsNoTracking()
            .Include(review => review.User)
            .Include(review => review.Movie)
            .Include(review => review.Series);
    }

    private static async Task<bool> FriendshipExistsAsync(AppDbContext dbContext, Guid userA, Guid userB, CancellationToken cancellationToken)
    {
        return await dbContext.Friendships.AnyAsync(friendship =>
            friendship.Status == FriendshipStatus.Accepted &&
            ((friendship.RequesterId == userA && friendship.ReceiverId == userB) ||
             (friendship.RequesterId == userB && friendship.ReceiverId == userA)),
            cancellationToken);
    }

    private static async Task<IReadOnlyList<Guid>> GetFriendIdsAsync(AppDbContext dbContext, Guid userId, CancellationToken cancellationToken)
    {
        var friendships = await dbContext.Friendships
            .AsNoTracking()
            .Where(friendship =>
                friendship.Status == FriendshipStatus.Accepted &&
                (friendship.RequesterId == userId || friendship.ReceiverId == userId))
            .Select(friendship => friendship.RequesterId == userId ? friendship.ReceiverId : friendship.RequesterId)
            .ToListAsync(cancellationToken);

        return friendships;
    }

    private static async Task<IReadOnlyList<PublicListResponse>> ToPublicListsAsync(
        AppDbContext dbContext,
        IReadOnlyList<ListEntity> lists,
        CancellationToken cancellationToken)
    {
        var listIds = lists.Select(list => list.Id).ToList();
        var itemCounts = await dbContext.ListItems
            .AsNoTracking()
            .Where(item => listIds.Contains(item.ListId))
            .GroupBy(item => item.ListId)
            .Select(group => new { ListId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.ListId, group => group.Count, cancellationToken);

        return lists.Select(list => new PublicListResponse(
            list.Id,
            list.User?.Username ?? string.Empty,
            list.User?.DisplayName ?? string.Empty,
            list.Title,
            list.Description,
            list.Visibility.ToString(),
            itemCounts.GetValueOrDefault(list.Id),
            list.CreatedAt,
            list.UpdatedAt)).ToList();
    }

    private static PublicReviewResponse ToPublicReviewResponse(Review review)
    {
        var media = MediaView.From(review.MediaType, review.Movie, review.Series);
        return new PublicReviewResponse(
            review.Id,
            review.User?.Username ?? string.Empty,
            review.User?.DisplayName ?? string.Empty,
            review.MediaType.ToString(),
            media.TmdbId,
            media.Title,
            review.RatingSnapshot,
            review.Title,
            review.Body,
            review.ContainsSpoilers,
            review.Visibility.ToString(),
            review.CreatedAt);
    }

    private static PublicListItemResponse ToPublicListItemResponse(ListItemEntity item)
    {
        var media = MediaView.From(item.MediaType, item.Movie, item.Series);
        return new PublicListItemResponse(item.Id, item.MediaType.ToString(), media.TmdbId, media.Title, media.PosterUrl, item.Position, item.CreatedAt);
    }

    private static ActivityEventResponse ToActivityEventResponse(ActivityEvent activityEvent)
    {
        var media = MediaView.From(activityEvent.MediaType, activityEvent.Movie, activityEvent.Series);
        return new ActivityEventResponse(
            activityEvent.Id,
            activityEvent.EventType.ToString(),
            activityEvent.User?.Username ?? string.Empty,
            activityEvent.User?.DisplayName ?? string.Empty,
            activityEvent.User?.AvatarUrl,
            activityEvent.MediaType?.ToString(),
            media?.TmdbId,
            media?.Title,
            media?.PosterUrl,
            activityEvent.MetadataJson,
            activityEvent.CreatedAt);
    }

    private static void AddActivityEvent(AppDbContext dbContext, Guid userId, ActivityEventType eventType, object? metadata)
    {
        dbContext.ActivityEvents.Add(new ActivityEvent
        {
            UserId = userId,
            EventType = eventType,
            MetadataJson = metadata is null ? null : System.Text.Json.JsonSerializer.Serialize(metadata),
            CreatedAt = DateTimeOffset.UtcNow
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
            UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTimeOffset.UtcNow
        });
    }

    private static void AddAdminAuditLog(AppDbContext dbContext, Guid? adminUserId, Guid targetUserId, HttpContext httpContext)
    {
        if (!adminUserId.HasValue)
        {
            return;
        }

        dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = adminUserId.Value,
            Action = AdminAuditAction.PrivateProfileViewed,
            TargetType = "User",
            TargetId = targetUserId,
            Reason = "Admin viewed private profile.",
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTimeOffset.UtcNow
        });
    }

    private static int NormalizePage(int page)
    {
        return page <= 0 ? 1 : page;
    }

    private static int NormalizePageSize(int pageSize)
    {
        return pageSize <= 0 ? 20 : Math.Min(pageSize, 50);
    }

    private sealed record MediaView(int TmdbId, string Title, string? PosterUrl)
    {
        public static MediaView? From(MediaType? mediaType, Movie? movie, Series? series)
        {
            if (mediaType is null)
            {
                return null;
            }

            return mediaType == MediaType.Movie
                ? new MediaView(movie?.TmdbId ?? 0, movie?.Title ?? "Sin titulo", movie?.PosterPath)
                : new MediaView(series?.TmdbId ?? 0, series?.Name ?? "Sin titulo", series?.PosterPath);
        }

        public static MediaView From(MediaType mediaType, Movie? movie, Series? series)
        {
            return mediaType == MediaType.Movie
                ? new MediaView(movie?.TmdbId ?? 0, movie?.Title ?? "Sin titulo", movie?.PosterPath)
                : new MediaView(series?.TmdbId ?? 0, series?.Name ?? "Sin titulo", series?.PosterPath);
        }
    }
}
