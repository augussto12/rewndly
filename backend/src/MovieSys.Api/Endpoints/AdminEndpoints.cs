using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using MovieSys.Api.Extensions;
using MovieSys.Application.Common.Interfaces;
using MovieSys.Application.Modules.Admin;
using MovieSys.Domain.Admin;
using MovieSys.Domain.Events;
using MovieSys.Domain.Friends;
using MovieSys.Domain.Library;
using MovieSys.Domain.Lists;
using MovieSys.Domain.Media;
using MovieSys.Domain.Reviews;
using MovieSys.Domain.Users;
using MovieSys.Infrastructure.Persistence;
using ListEntity = MovieSys.Domain.Lists.List;

namespace MovieSys.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .RequireAuthorization(AuthPolicies.CanAccessAdminPanel)
            .RequireRateLimiting("user-content")
            .WithTags("Admin");

        group.MapGet("/dashboard", GetDashboardAsync).RequireAuthorization(AuthPolicies.CanViewSystemMetrics);
        group.MapGet("/users", GetUsersAsync).RequireAuthorization(AuthPolicies.CanManageUsers);
        group.MapGet("/users/{id:guid}", GetUserDetailsAsync).RequireAuthorization(AuthPolicies.CanManageUsers);
        group.MapPatch("/users/{id:guid}/disable", DisableUserAsync).RequireAuthorization(AuthPolicies.CanManageUsers);
        group.MapPatch("/users/{id:guid}/enable", EnableUserAsync).RequireAuthorization(AuthPolicies.CanManageUsers);
        group.MapDelete("/users/{id:guid}", DeleteUserAsync).RequireAuthorization(AuthPolicies.CanManageUsers);

        group.MapGet("/reviews", GetReviewsAsync).RequireAuthorization(AuthPolicies.CanModerateContent);
        group.MapDelete("/reviews/{id:guid}", DeleteReviewAsync).RequireAuthorization(AuthPolicies.CanModerateContent);
        group.MapGet("/lists", GetListsAsync).RequireAuthorization(AuthPolicies.CanModerateContent);
        group.MapDelete("/lists/{id:guid}", DeleteListAsync).RequireAuthorization(AuthPolicies.CanModerateContent);

        group.MapGet("/system-events", GetSystemEventsAsync).RequireAuthorization(AuthPolicies.CanViewSystemMetrics);
        group.MapGet("/activity-events", GetActivityEventsAsync).RequireAuthorization(AuthPolicies.CanViewSystemMetrics);
        group.MapGet("/audit-logs", GetAuditLogsAsync).RequireAuthorization(AuthPolicies.CanViewAuditLogs);

        return app;
    }

    private static async Task<IResult> GetDashboardAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);
        var yesterday = now.AddHours(-24);

        var users = dbContext.Users.IgnoreQueryFilters();
        var activeUsers = await users.CountAsync(user => !user.IsDeleted && !user.IsDisabled, cancellationToken);
        var disabledUsers = await users.CountAsync(user => !user.IsDeleted && user.IsDisabled, cancellationToken);
        var deletedUsers = await users.CountAsync(user => user.IsDeleted, cancellationToken);

        var savedMovies = await dbContext.UserMediaItems.CountAsync(item => item.MediaType == MediaType.Movie, cancellationToken);
        var savedSeries = await dbContext.UserMediaItems.CountAsync(item => item.MediaType == MediaType.Series, cancellationToken);

        var mostSavedMovieRows = await dbContext.UserMediaItems
            .AsNoTracking()
            .Where(item => item.MovieId != null)
            .GroupBy(item => new { item.Movie!.TmdbId, item.Movie.Title })
            .Select(group => new { group.Key.TmdbId, group.Key.Title, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .Take(5)
            .ToListAsync(cancellationToken);

        var mostSavedMovies = mostSavedMovieRows
            .Select(item => new AdminPopularContentResponse("Movie", item.TmdbId, item.Title, item.Count))
            .ToList();

        var mostSavedSeriesRows = await dbContext.UserMediaItems
            .AsNoTracking()
            .Where(item => item.SeriesId != null)
            .GroupBy(item => new { item.Series!.TmdbId, item.Series.Name })
            .Select(group => new { group.Key.TmdbId, Title = group.Key.Name, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .Take(5)
            .ToListAsync(cancellationToken);

        var mostSavedSeries = mostSavedSeriesRows
            .Select(item => new AdminPopularContentResponse("Series", item.TmdbId, item.Title, item.Count))
            .ToList();

        var topMovieRows = await dbContext.UserMediaItems
            .AsNoTracking()
            .Where(item => item.MovieId != null && item.Rating != null)
            .GroupBy(item => new { item.Movie!.TmdbId, item.Movie.Title })
            .Select(group => new { group.Key.TmdbId, group.Key.Title, AverageRating = group.Average(item => item.Rating!.Value), RatingCount = group.Count() })
            .OrderByDescending(item => item.AverageRating)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topMovies = topMovieRows
            .Select(item => new AdminTopRatedContentResponse("Movie", item.TmdbId, item.Title, Convert.ToDecimal(item.AverageRating), item.RatingCount))
            .ToList();

        var topSeriesRows = await dbContext.UserMediaItems
            .AsNoTracking()
            .Where(item => item.SeriesId != null && item.Rating != null)
            .GroupBy(item => new { item.Series!.TmdbId, item.Series.Name })
            .Select(group => new { group.Key.TmdbId, Title = group.Key.Name, AverageRating = group.Average(item => item.Rating!.Value), RatingCount = group.Count() })
            .OrderByDescending(item => item.AverageRating)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topSeries = topSeriesRows
            .Select(item => new AdminTopRatedContentResponse("Series", item.TmdbId, item.Title, Convert.ToDecimal(item.AverageRating), item.RatingCount))
            .ToList();

        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.AdminViewedDashboard, "Dashboard", null, null, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminViewedDashboard, currentUser.UserId, "Dashboard", null, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new AdminDashboardResponse(
            await users.CountAsync(cancellationToken),
            activeUsers,
            disabledUsers,
            deletedUsers,
            await users.CountAsync(user => user.CreatedAt >= sevenDaysAgo, cancellationToken),
            savedMovies,
            savedSeries,
            await dbContext.Reviews.IgnoreQueryFilters().CountAsync(cancellationToken),
            await dbContext.Lists.IgnoreQueryFilters().CountAsync(cancellationToken),
            await dbContext.Friendships.CountAsync(friendship => friendship.Status == FriendshipStatus.Accepted, cancellationToken),
            await dbContext.SystemEvents.CountAsync(systemEvent => systemEvent.CreatedAt >= yesterday, cancellationToken),
            await dbContext.SystemEvents.CountAsync(systemEvent => systemEvent.EventType == SystemEventType.UserLoginFailed && systemEvent.CreatedAt >= yesterday, cancellationToken),
            mostSavedMovies.Concat(mostSavedSeries).OrderByDescending(item => item.Count).Take(5).ToList(),
            topMovies.Concat(topSeries).OrderByDescending(item => item.AverageRating).Take(5).ToList()));
    }

    private static async Task<IResult> GetUsersAsync(
        string? search,
        string? role,
        bool? disabled,
        bool? deleted,
        int page,
        int pageSize,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users.IgnoreQueryFilters().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(user =>
                user.Username.ToLower().Contains(normalized) ||
                user.Email.ToLower().Contains(normalized) ||
                user.DisplayName.ToLower().Contains(normalized));
        }

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            query = query.Where(user => user.Role == parsedRole);
        }

        if (disabled.HasValue)
        {
            query = query.Where(user => user.IsDisabled == disabled.Value);
        }

        if (deleted.HasValue)
        {
            query = query.Where(user => user.IsDeleted == deleted.Value);
        }

        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(user => user.CreatedAt)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(user => ToUserResponse(user))
            .ToListAsync(cancellationToken);

        return Results.Ok(new AdminPagedResponse<AdminUserResponse>(items, normalizedPage, normalizedPageSize, total));
    }

    private static async Task<IResult> GetUserDetailsAsync(
        Guid id,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (user is null)
        {
            return Results.NotFound();
        }

        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.AdminViewedUser, "User", user.Id, null, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminViewedUser, currentUser.UserId, "User", user.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToUserDetailsResponse(user));
    }

    private static async Task<IResult> DisableUserAsync(
        Guid id,
        [FromBody]
        AdminActionRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId == id)
        {
            return Results.BadRequest(new { message = "Admin cannot disable itself." });
        }

        var user = await dbContext.Users.IgnoreQueryFilters().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Results.NotFound();
        }

        user.IsDisabled = true;
        user.DisabledAt = dateTimeProvider.UtcNow;
        user.DisabledByAdminId = currentUser.UserId;
        user.DisableReason = TrimReason(request.Reason);

        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.UserDisabled, "User", user.Id, request.Reason, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminUserDisabled, currentUser.UserId, "User", user.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToUserDetailsResponse(user));
    }

    private static async Task<IResult> EnableUserAsync(
        Guid id,
        [FromBody]
        AdminActionRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.IgnoreQueryFilters().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Results.NotFound();
        }

        user.IsDisabled = false;
        user.DisabledAt = null;
        user.DisabledByAdminId = null;
        user.DisableReason = null;

        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.UserEnabled, "User", user.Id, request.Reason, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminUserEnabled, currentUser.UserId, "User", user.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToUserDetailsResponse(user));
    }

    private static async Task<IResult> DeleteUserAsync(
        Guid id,
        [FromBody]
        AdminActionRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId == id)
        {
            return Results.BadRequest(new { message = "Admin cannot delete itself." });
        }

        var user = await dbContext.Users.IgnoreQueryFilters().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (user is null || user.IsDeleted)
        {
            return Results.NotFound();
        }

        user.IsDeleted = true;
        user.DeletedAt = dateTimeProvider.UtcNow;
        user.DeletedByAdminId = currentUser.UserId;
        user.DeleteReason = TrimReason(request.Reason);

        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.UserSoftDeleted, "User", user.Id, request.Reason, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminUserSoftDeleted, currentUser.UserId, "User", user.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetReviewsAsync(
        string? search,
        bool? deleted,
        int page,
        int pageSize,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Reviews.IgnoreQueryFilters().AsNoTracking()
            .Include(review => review.User)
            .Include(review => review.Movie)
            .Include(review => review.Series)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(review => review.Title.ToLower().Contains(normalized) || review.Body.ToLower().Contains(normalized));
        }

        if (deleted.HasValue)
        {
            query = query.Where(review => review.IsDeleted == deleted.Value);
        }

        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);
        var total = await query.CountAsync(cancellationToken);
        var reviews = await query.OrderByDescending(review => review.CreatedAt).Skip((normalizedPage - 1) * normalizedPageSize).Take(normalizedPageSize).ToListAsync(cancellationToken);
        return Results.Ok(new AdminPagedResponse<AdminReviewResponse>(reviews.Select(ToReviewResponse).ToList(), normalizedPage, normalizedPageSize, total));
    }

    private static async Task<IResult> DeleteReviewAsync(
        Guid id,
        [FromBody]
        AdminActionRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var review = await dbContext.Reviews.IgnoreQueryFilters().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (review is null || review.IsDeleted)
        {
            return Results.NotFound();
        }

        review.IsDeleted = true;
        review.DeletedAt = dateTimeProvider.UtcNow;
        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.ReviewSoftDeleted, "Review", review.Id, request.Reason, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminReviewSoftDeleted, currentUser.UserId, "Review", review.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetListsAsync(
        string? search,
        bool? deleted,
        int page,
        int pageSize,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Lists.IgnoreQueryFilters().AsNoTracking().Include(list => list.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(list => list.Title.ToLower().Contains(normalized) || (list.Description != null && list.Description.ToLower().Contains(normalized)));
        }

        if (deleted.HasValue)
        {
            query = query.Where(list => list.IsDeleted == deleted.Value);
        }

        var normalizedPage = NormalizePage(page);
        var normalizedPageSize = NormalizePageSize(pageSize);
        var total = await query.CountAsync(cancellationToken);
        var lists = await query.OrderByDescending(list => list.CreatedAt).Skip((normalizedPage - 1) * normalizedPageSize).Take(normalizedPageSize).ToListAsync(cancellationToken);
        return Results.Ok(new AdminPagedResponse<AdminListResponse>(lists.Select(ToListResponse).ToList(), normalizedPage, normalizedPageSize, total));
    }

    private static async Task<IResult> DeleteListAsync(
        Guid id,
        [FromBody]
        AdminActionRequest request,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        IDateTimeProvider dateTimeProvider,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var list = await dbContext.Lists.IgnoreQueryFilters().FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (list is null || list.IsDeleted)
        {
            return Results.NotFound();
        }

        list.IsDeleted = true;
        list.DeletedAt = dateTimeProvider.UtcNow;
        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.ListSoftDeleted, "List", list.Id, request.Reason, httpContext, cancellationToken);
        AddSystemEvent(dbContext, SystemEventType.AdminListSoftDeleted, currentUser.UserId, "List", list.Id, httpContext);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> GetSystemEventsAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.SystemEventsViewed, "SystemEvent", null, null, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var query = dbContext.SystemEvents.AsNoTracking().OrderByDescending(systemEvent => systemEvent.CreatedAt);
        var result = await PageAsync(query, NormalizePage(page), NormalizePageSize(pageSize), ToSystemEventResponse, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetActivityEventsAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.ActivityEventsViewed, "ActivityEvent", null, null, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var query = dbContext.ActivityEvents.AsNoTracking()
            .Include(activityEvent => activityEvent.User)
            .Include(activityEvent => activityEvent.Movie)
            .Include(activityEvent => activityEvent.Series)
            .OrderByDescending(activityEvent => activityEvent.CreatedAt);
        var result = await PageAsync(query, NormalizePage(page), NormalizePageSize(pageSize), ToActivityEventResponse, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetAuditLogsAsync(
        int page,
        int pageSize,
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        await AddAuditAsync(dbContext, currentUser, AdminAuditAction.AuditLogsViewed, "AdminAuditLog", null, null, httpContext, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var query = dbContext.AdminAuditLogs.AsNoTracking().Include(log => log.AdminUser).OrderByDescending(log => log.CreatedAt);
        var result = await PageAsync(query, NormalizePage(page), NormalizePageSize(pageSize), ToAuditLogResponse, cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<AdminPagedResponse<TResponse>> PageAsync<TEntity, TResponse>(
        IOrderedQueryable<TEntity> query,
        int page,
        int pageSize,
        Func<TEntity, TResponse> mapper,
        CancellationToken cancellationToken)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new AdminPagedResponse<TResponse>(items.Select(mapper).ToList(), page, pageSize, total);
    }

    private static async Task AddAuditAsync(
        AppDbContext dbContext,
        ICurrentUserService currentUser,
        AdminAuditAction action,
        string targetType,
        Guid? targetId,
        string? reason,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
        {
            return;
        }

        dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = currentUser.UserId.Value,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Reason = TrimReason(reason),
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTimeOffset.UtcNow
        });

        await Task.CompletedTask;
    }

    private static void AddSystemEvent(
        AppDbContext dbContext,
        SystemEventType eventType,
        Guid? userId,
        string entityType,
        Guid? entityId,
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

    private static AdminUserResponse ToUserResponse(User user)
    {
        return new AdminUserResponse(user.Id, user.Username, user.Email, user.DisplayName, user.Role.ToString(), user.IsDisabled, user.IsDeleted, user.CreatedAt, user.UpdatedAt, user.LastLoginAt);
    }

    private static AdminUserDetailsResponse ToUserDetailsResponse(User user)
    {
        return new AdminUserDetailsResponse(
            user.Id,
            user.Username,
            user.Email,
            user.DisplayName,
            user.AvatarUrl,
            user.Bio,
            user.Role.ToString(),
            user.MustChangePassword,
            user.EmailVerifiedAt,
            user.IsDisabled,
            user.DisabledAt,
            user.DisableReason,
            user.IsDeleted,
            user.DeletedAt,
            user.DeleteReason,
            user.CreatedAt,
            user.UpdatedAt,
            user.LastLoginAt);
    }

    private static AdminReviewResponse ToReviewResponse(Review review)
    {
        var media = MediaView.From(review.MediaType, review.Movie, review.Series);
        return new AdminReviewResponse(review.Id, review.UserId, review.User?.Username ?? "", review.MediaType.ToString(), media.TmdbId, media.Title, review.RatingSnapshot, review.Title, review.ContainsSpoilers, review.Visibility.ToString(), review.IsDeleted, review.CreatedAt, review.UpdatedAt);
    }

    private static AdminListResponse ToListResponse(ListEntity list)
    {
        return new AdminListResponse(list.Id, list.UserId, list.User?.Username ?? "", list.Title, list.Description, list.Visibility.ToString(), list.IsDeleted, list.CreatedAt, list.UpdatedAt);
    }

    private static AdminSystemEventResponse ToSystemEventResponse(SystemEvent systemEvent)
    {
        return new AdminSystemEventResponse(systemEvent.Id, systemEvent.UserId, systemEvent.EventType.ToString(), systemEvent.EntityType, systemEvent.EntityId, systemEvent.IpAddress, systemEvent.UserAgent, systemEvent.CreatedAt);
    }

    private static AdminActivityEventResponse ToActivityEventResponse(ActivityEvent activityEvent)
    {
        var media = MediaView.From(activityEvent.MediaType, activityEvent.Movie, activityEvent.Series);
        return new AdminActivityEventResponse(activityEvent.Id, activityEvent.UserId, activityEvent.User?.Username ?? "", activityEvent.EventType.ToString(), activityEvent.MediaType?.ToString(), media?.TmdbId, media?.Title, activityEvent.CreatedAt);
    }

    private static AdminAuditLogResponse ToAuditLogResponse(AdminAuditLog log)
    {
        return new AdminAuditLogResponse(log.Id, log.AdminUserId, log.AdminUser?.Username ?? "", log.Action.ToString(), log.TargetType, log.TargetId, log.Reason, log.IpAddress, log.UserAgent, log.CreatedAt);
    }

    private static int NormalizePage(int page) => page <= 0 ? 1 : page;

    private static int NormalizePageSize(int pageSize) => pageSize <= 0 ? 25 : Math.Min(pageSize, 100);

    private static string? TrimReason(string? reason) => string.IsNullOrWhiteSpace(reason) ? null : reason.Trim()[..Math.Min(reason.Trim().Length, 1000)];

    private sealed record MediaView(int TmdbId, string Title)
    {
        public static MediaView From(MediaType mediaType, Movie? movie, Series? series)
        {
            return mediaType == MediaType.Movie
                ? new MediaView(movie?.TmdbId ?? 0, movie?.Title ?? "Sin titulo")
                : new MediaView(series?.TmdbId ?? 0, series?.Name ?? "Sin titulo");
        }

        public static MediaView? From(MediaType? mediaType, Movie? movie, Series? series)
        {
            return mediaType is null ? null : From(mediaType.Value, movie, series);
        }
    }
}
