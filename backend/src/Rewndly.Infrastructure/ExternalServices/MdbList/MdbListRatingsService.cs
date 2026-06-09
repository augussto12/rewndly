using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public sealed class MdbListRatingsService(
    AppDbContext dbContext,
    MdbListClient client,
    IDateTimeProvider dateTimeProvider,
    IOptions<MdbListOptions> options,
    IServiceScopeFactory scopeFactory,
    ILogger<MdbListRatingsService> logger) : IExternalMediaRatingsService
{
    private const string NoDataSource = "__none";
    private static readonly ConcurrentDictionary<string, byte> PendingRefreshes = new(StringComparer.Ordinal);
    private readonly MdbListOptions _options = options.Value;

    public async Task<ExternalRatingsResponse> GetRatingsAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken)
    {
        if (tmdbId <= 0 || !_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return EmptyResponse;
        }

        var now = dateTimeProvider.UtcNow;
        var cachedRows = await QueryRows(mediaType, tmdbId).ToListAsync(cancellationToken);
        if (cachedRows.Count == 0)
        {
            await RefreshRatingsAsync(mediaType, tmdbId, cancellationToken);
            cachedRows = await QueryRows(mediaType, tmdbId).ToListAsync(cancellationToken);
        }
        else if (cachedRows.All(row => row.ExpiresAt <= now))
        {
            QueueRefresh(mediaType, tmdbId);
        }

        return ToResponse(cachedRows);
    }

    public async Task RefreshRatingsAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken)
    {
        if (tmdbId <= 0 || !_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return;
        }

        var result = await client.GetMediaRatingsAsync(mediaType, tmdbId, cancellationToken);
        if (!result.ShouldCache)
        {
            return;
        }

        var now = dateTimeProvider.UtcNow;
        var expiresAt = now.AddHours(Math.Clamp(_options.CacheHours, 1, 168));
        var existingRows = await QueryRows(mediaType, tmdbId).ToListAsync(cancellationToken);
        dbContext.ExternalMediaRatings.RemoveRange(existingRows);

        if (result.Ratings.Count == 0)
        {
            dbContext.ExternalMediaRatings.Add(new ExternalMediaRating
            {
                MediaType = mediaType,
                TmdbId = tmdbId,
                Source = NoDataSource,
                FetchedAt = now,
                ExpiresAt = expiresAt,
            });
        }
        else
        {
            foreach (var rating in result.Ratings)
            {
                dbContext.ExternalMediaRatings.Add(new ExternalMediaRating
                {
                    MediaType = mediaType,
                    TmdbId = tmdbId,
                    Source = rating.Source,
                    Value = rating.Value,
                    Votes = rating.Votes,
                    Scale = rating.Scale,
                    FetchedAt = now,
                    ExpiresAt = expiresAt,
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<ExternalMediaRating> QueryRows(MediaType mediaType, int tmdbId)
    {
        return dbContext.ExternalMediaRatings
            .AsNoTracking()
            .Where(rating => rating.MediaType == mediaType && rating.TmdbId == tmdbId)
            .OrderBy(rating => rating.Source);
    }

    private void QueueRefresh(MediaType mediaType, int tmdbId)
    {
        var key = $"{mediaType}:{tmdbId}";
        if (!PendingRefreshes.TryAdd(key, 0))
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<MdbListRatingsService>();
                await service.RefreshRatingsAsync(mediaType, tmdbId, CancellationToken.None);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Background MDBList refresh failed for {MediaType} {TmdbId}.", mediaType, tmdbId);
            }
            finally
            {
                PendingRefreshes.TryRemove(key, out _);
            }
        });
    }

    private static ExternalRatingsResponse ToResponse(IReadOnlyList<ExternalMediaRating> rows)
    {
        var visibleRows = rows
            .Where(row => row.Source != NoDataSource && row.Value is not null && row.Scale is not null)
            .ToList();

        if (visibleRows.Count == 0)
        {
            return new ExternalRatingsResponse([], rows.Count == 0 ? null : rows.Max(row => row.FetchedAt));
        }

        return new ExternalRatingsResponse(
            visibleRows.Select(row => new ExternalRatingResponse(
                row.Source,
                ToLabel(row.Source),
                row.Value!.Value,
                row.Scale!.Value,
                row.Votes)).ToList(),
            visibleRows.Max(row => row.FetchedAt));
    }

    private static string ToLabel(string source)
    {
        return source switch
        {
            "IMDb" => "IMDb",
            "RottenTomatoes" => "Rotten Tomatoes",
            "RottenAudience" => "Rotten Audience",
            "Metacritic" => "Metacritic",
            "Letterboxd" => "Letterboxd",
            "Trakt" => "Trakt",
            "TMDB" => "TMDB",
            "MDBListScore" => "MDBList",
            _ => source,
        };
    }

    private static ExternalRatingsResponse EmptyResponse => new([], null);
}
