using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;
using Rewndly.Infrastructure.ExternalServices.Tmdb;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public sealed class MdbListRankingService(
    AppDbContext dbContext,
    MdbListClient client,
    MdbListAvailabilityState availabilityState,
    TmdbClient tmdbClient,
    IOptions<MdbListOptions> options,
    ILogger<MdbListRankingService> logger) : IExternalMediaRankingService
{
    private static readonly SemaphoreSlim RefreshGate = new(1, 1);

    private static readonly IReadOnlyDictionary<string, RankingDefinition> Rankings =
        new Dictionary<string, RankingDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["imdb"] = new("imdb", "imdbrating", ["imdbvotes", "score"], "IMDb", 10, "imdb"),
            ["critics"] = new("critics", "score", [], "Critica", 100, null),
        };

    private readonly MdbListOptions _options = options.Value;

    public async Task<MediaRankingResponse> GetRankingAsync(
        MediaType mediaType,
        string rankingKey,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var definition = Rankings.TryGetValue(rankingKey, out var found)
            ? found
            : Rankings["imdb"];

        var normalizedPage = Math.Max(page, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 48);
        var now = DateTimeOffset.UtcNow;

        var cachedItems = await GetCachedItemsAsync(mediaType, definition.Key, cancellationToken);
        if (cachedItems.Count == 0 || cachedItems.Any(item => item.ExpiresAt <= now))
        {
            await TryRefreshAsync(mediaType, definition, now, cancellationToken);
            cachedItems = await GetCachedItemsAsync(mediaType, definition.Key, cancellationToken);
        }

        if (cachedItems.Any(NeedsMetadataBackfill))
        {
            await TryBackfillCachedMetadataAsync(mediaType, definition.Key, cachedItems, cancellationToken);
            cachedItems = await GetCachedItemsAsync(mediaType, definition.Key, cancellationToken);
        }

        var totalResults = cachedItems.Count;
        var totalPages = totalResults == 0 ? 0 : (int)Math.Ceiling(totalResults / (double)normalizedPageSize);
        var pageItems = cachedItems
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(item => ToResponse(item, definition))
            .ToList();

        return new MediaRankingResponse(
            pageItems,
            normalizedPage,
            totalPages,
            totalResults,
            normalizedPage < totalPages,
            definition.Key,
            definition.Source,
            cachedItems.Count == 0 ? null : cachedItems.Min(item => item.FetchedAt),
            cachedItems.Any(item => item.ExpiresAt <= now));
    }

    private Task<List<ExternalMediaRankingItem>> GetCachedItemsAsync(
        MediaType mediaType,
        string rankingKey,
        CancellationToken cancellationToken)
    {
        return dbContext.ExternalMediaRankingItems
            .AsNoTracking()
            .Where(item => item.MediaType == mediaType && item.RankingKey == rankingKey)
            .OrderBy(item => item.Rank)
            .ToListAsync(cancellationToken);
    }

    private async Task TryRefreshAsync(
        MediaType mediaType,
        RankingDefinition definition,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            return;
        }

        await RefreshGate.WaitAsync(cancellationToken);
        try
        {
            var latestFreshItem = await dbContext.ExternalMediaRankingItems
                .AsNoTracking()
                .Where(item => item.MediaType == mediaType && item.RankingKey == definition.Key && item.ExpiresAt > now)
                .OrderByDescending(item => item.FetchedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestFreshItem is not null)
            {
                return;
            }

            var limit = Math.Clamp(_options.RankingLimit, 24, 250);
            var catalogLimit = definition.RatingSource is null
                ? limit
                : Math.Clamp(_options.ImdbRankingCandidateLimit, limit, 1000);
            var orderedItems = new List<RankingCandidate>();
            foreach (var sortBy in new[] { definition.SortBy }.Concat(definition.FallbackSortBy))
            {
                var catalog = await client.GetCatalogAsync(mediaType, sortBy, catalogLimit, cancellationToken);
                if (!catalog.ShouldCache)
                {
                    continue;
                }

                if (catalog.Items.Count == 0)
                {
                    logger.LogInformation(
                        "MDBList ranking {RankingKey} for {MediaType} returned no catalog items for sort {SortBy}.",
                        definition.Key,
                        mediaType,
                        sortBy);
                    continue;
                }

                var catalogItems = catalog.Items.DistinctBy(item => item.TmdbId).Take(catalogLimit).ToList();
                orderedItems = definition.RatingSource is null
                    ? await BuildCatalogCandidatesAsync(mediaType, catalogItems.Take(limit).ToList(), cancellationToken)
                    : await BuildImdbCandidatesAsync(mediaType, catalogItems, cancellationToken);

                if (orderedItems.Count > 0)
                {
                    break;
                }

                logger.LogInformation(
                    "MDBList ranking {RankingKey} for {MediaType} returned no usable candidates for sort {SortBy}.",
                    definition.Key,
                    mediaType,
                    sortBy);
            }

            await MdbListSystemEventRecorder.RecordPendingTransitionsAsync(dbContext, availabilityState, now, cancellationToken);

            var refreshedItems = new List<ExternalMediaRankingItem>();
            var rank = 1;
            foreach (var rankedItem in orderedItems.Take(limit))
            {
                var enrichedItem = await EnrichCandidateAsync(mediaType, rankedItem, cancellationToken);

                refreshedItems.Add(new ExternalMediaRankingItem
                {
                    MediaType = mediaType,
                    RankingKey = definition.Key,
                    Rank = rank++,
                    TmdbId = enrichedItem.TmdbId,
                    Title = enrichedItem.Title,
                    Overview = enrichedItem.Overview,
                    PosterUrl = enrichedItem.PosterUrl,
                    BackdropUrl = enrichedItem.BackdropUrl,
                    ReleaseDate = enrichedItem.ReleaseDate ?? YearToDate(enrichedItem.Year),
                    VoteAverage = enrichedItem.VoteAverage,
                    RankingScore = enrichedItem.DisplayScore,
                    FetchedAt = now,
                    ExpiresAt = now.AddHours(Math.Clamp(_options.RankingCacheHours, 1, 24 * 30)),
                });
            }

            if (refreshedItems.Count == 0)
            {
                return;
            }

            var previousItems = await dbContext.ExternalMediaRankingItems
                .Where(item => item.MediaType == mediaType && item.RankingKey == definition.Key)
                .ToListAsync(cancellationToken);

            dbContext.ExternalMediaRankingItems.RemoveRange(previousItems);
            dbContext.ExternalMediaRankingItems.AddRange(refreshedItems);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to refresh MDBList ranking {RankingKey} for {MediaType}.", definition.Key, mediaType);
        }
        finally
        {
            RefreshGate.Release();
        }
    }

    private async Task TryBackfillCachedMetadataAsync(
        MediaType mediaType,
        string rankingKey,
        IReadOnlyList<ExternalMediaRankingItem> cachedItems,
        CancellationToken cancellationToken)
    {
        await RefreshGate.WaitAsync(cancellationToken);
        try
        {
            var ids = cachedItems
                .Where(NeedsMetadataBackfill)
                .Select(item => item.Id)
                .ToHashSet();

            var items = await dbContext.ExternalMediaRankingItems
                .Where(item => ids.Contains(item.Id) && item.MediaType == mediaType && item.RankingKey == rankingKey)
                .OrderBy(item => item.Rank)
                .ToListAsync(cancellationToken);

            foreach (var item in items)
            {
                var enriched = await GetTmdbSummaryAsync(mediaType, item.TmdbId, cancellationToken);
                if (enriched is null)
                {
                    continue;
                }

                item.Title = string.IsNullOrWhiteSpace(item.Title) ? enriched.Title : item.Title;
                item.Overview ??= enriched.Overview;
                item.PosterUrl ??= enriched.PosterUrl;
                item.BackdropUrl ??= enriched.BackdropUrl;
                item.ReleaseDate ??= enriched.ReleaseDate;
                item.VoteAverage ??= enriched.VoteAverage;
            }

            if (items.Count > 0)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to backfill metadata for MDBList ranking {RankingKey} for {MediaType}.", rankingKey, mediaType);
        }
        finally
        {
            RefreshGate.Release();
        }
    }

    private async Task<List<RankingCandidate>> BuildImdbCandidatesAsync(
        MediaType mediaType,
        IReadOnlyList<MdbListCatalogItem> catalogItems,
        CancellationToken cancellationToken)
    {
        var mediaInfos = await client.GetMediaInfoBatchAsync(mediaType, catalogItems.Select(item => item.TmdbId).ToList(), cancellationToken);
        if (mediaInfos.Count == 0)
        {
            return [];
        }

        var catalogPosition = catalogItems
            .Select((item, index) => new { item.TmdbId, Index = index })
            .ToDictionary(item => item.TmdbId, item => item.Index);

        var minimumVotes = Math.Max(_options.ImdbMinimumVotes, 1);
        var priorMean = _options.ImdbPriorMean is > 0 and <= 10 ? _options.ImdbPriorMean : 7.0m;

        return mediaInfos
            .Where(item => item.ImdbRating is > 0 && item.ImdbVotes >= minimumVotes)
            .Select(item =>
            {
                var votes = Math.Max(item.ImdbVotes ?? 0, 0);
                var rating = item.ImdbRating!.Value;
                var weightedScore = ((votes / (decimal)(votes + minimumVotes)) * rating) +
                    ((minimumVotes / (decimal)(votes + minimumVotes)) * priorMean);

                return RankingCandidate.FromMediaInfo(
                    item,
                    weightedScore,
                    catalogPosition.GetValueOrDefault(item.TmdbId, int.MaxValue));
            })
            .OrderByDescending(item => item.DisplayScore)
            .ThenByDescending(item => item.Votes ?? 0)
            .ThenByDescending(item => item.SortScore)
            .ThenBy(item => item.CatalogPosition)
            .ToList();
    }

    private async Task<List<RankingCandidate>> BuildCatalogCandidatesAsync(
        MediaType mediaType,
        IReadOnlyList<MdbListCatalogItem> catalogItems,
        CancellationToken cancellationToken)
    {
        var mediaInfos = await client.GetMediaInfoBatchAsync(mediaType, catalogItems.Select(item => item.TmdbId).ToList(), cancellationToken);
        if (mediaInfos.Count == 0)
        {
            return catalogItems
                .Select(item => RankingCandidate.FromCatalog(item))
                .ToList();
        }

        var catalogScores = catalogItems.ToDictionary(item => item.TmdbId, item => item.Score);
        var catalogPosition = catalogItems
            .Select((item, index) => new { item.TmdbId, Index = index })
            .ToDictionary(item => item.TmdbId, item => item.Index);

        var enrichedItems = mediaInfos
            .Select(item => RankingCandidate.FromMediaInfo(
                item,
                catalogScores.GetValueOrDefault(item.TmdbId) ?? item.Score,
                catalogScores.GetValueOrDefault(item.TmdbId) ?? item.Score,
                catalogPosition.GetValueOrDefault(item.TmdbId, int.MaxValue)))
            .OrderBy(item => item.CatalogPosition)
            .ToList();

        var enrichedIds = enrichedItems.Select(item => item.TmdbId).ToHashSet();
        var fallbackItems = catalogItems
            .Where(item => !enrichedIds.Contains(item.TmdbId))
            .Select(item => RankingCandidate.FromCatalog(item));

        return enrichedItems.Concat(fallbackItems).ToList();
    }

    private async Task<RankingCandidate> EnrichCandidateAsync(
        MediaType mediaType,
        RankingCandidate candidate,
        CancellationToken cancellationToken)
    {
        if (!NeedsMetadataBackfill(candidate))
        {
            return candidate;
        }

        var summary = await GetTmdbSummaryAsync(mediaType, candidate.TmdbId, cancellationToken);
        if (summary is null)
        {
            return candidate;
        }

        return candidate with
        {
            Title = string.IsNullOrWhiteSpace(candidate.Title) ? summary.Title : candidate.Title,
            Overview = candidate.Overview ?? summary.Overview,
            PosterUrl = candidate.PosterUrl ?? summary.PosterUrl,
            BackdropUrl = candidate.BackdropUrl ?? summary.BackdropUrl,
            ReleaseDate = candidate.ReleaseDate ?? summary.ReleaseDate,
            VoteAverage = candidate.VoteAverage ?? summary.VoteAverage,
        };
    }

    private async Task<TmdbSummary?> GetTmdbSummaryAsync(
        MediaType mediaType,
        int tmdbId,
        CancellationToken cancellationToken)
    {
        try
        {
            if (mediaType == MediaType.Series)
            {
                var series = await tmdbClient.GetSeriesDetailsAsync(tmdbId, cancellationToken);
                return series is null
                    ? null
                    : new TmdbSummary(
                        series.Name,
                        series.Overview,
                        series.PosterUrl,
                        series.BackdropUrl,
                        series.FirstAirDate,
                        series.VoteAverage);
            }

            var movie = await tmdbClient.GetMovieDetailsAsync(tmdbId, cancellationToken);
            return movie is null
                ? null
                : new TmdbSummary(
                    movie.Title,
                    movie.Overview,
                    movie.PosterUrl,
                    movie.BackdropUrl,
                    movie.ReleaseDate,
                    movie.VoteAverage);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogDebug(exception, "Failed to fetch TMDB summary for ranking item {MediaType} {TmdbId}.", mediaType, tmdbId);
            return null;
        }
    }

    private static bool NeedsMetadataBackfill(ExternalMediaRankingItem item)
    {
        return string.IsNullOrWhiteSpace(item.PosterUrl) ||
            string.IsNullOrWhiteSpace(item.BackdropUrl) ||
            item.VoteAverage is null ||
            item.ReleaseDate is null ||
            string.IsNullOrWhiteSpace(item.Overview);
    }

    private static bool NeedsMetadataBackfill(RankingCandidate item)
    {
        return string.IsNullOrWhiteSpace(item.PosterUrl) ||
            string.IsNullOrWhiteSpace(item.BackdropUrl) ||
            item.VoteAverage is null ||
            item.ReleaseDate is null ||
            string.IsNullOrWhiteSpace(item.Overview);
    }

    private static RankedMediaSummaryResponse ToResponse(ExternalMediaRankingItem item, RankingDefinition definition)
    {
        return new RankedMediaSummaryResponse(
            new MediaSummaryResponse(
                item.TmdbId,
                item.Title,
                item.Overview,
                item.PosterUrl,
                item.BackdropUrl,
                item.ReleaseDate,
                item.VoteAverage,
                [],
                item.MediaType.ToString()),
            item.Rank,
            definition.Source,
            item.RankingScore,
            definition.ScoreScale);
    }

    private static DateOnly? YearToDate(int? year)
    {
        return year is >= 1 and <= 9999 ? new DateOnly(year.Value, 1, 1) : null;
    }

    private sealed record RankingDefinition(
        string Key,
        string SortBy,
        IReadOnlyList<string> FallbackSortBy,
        string Source,
        decimal? ScoreScale,
        string? RatingSource);

    private sealed record RankingCandidate(
        int TmdbId,
        string Title,
        int? Year,
        DateOnly? ReleaseDate,
        string? Overview,
        string? PosterUrl,
        string? BackdropUrl,
        decimal? VoteAverage,
        decimal? DisplayScore,
        decimal? SortScore,
        int? Votes,
        int CatalogPosition)
    {
        public static RankingCandidate FromCatalog(MdbListCatalogItem item)
        {
            return new RankingCandidate(
                item.TmdbId,
                item.Title,
                item.Year,
                null,
                null,
                null,
                null,
                null,
                item.Score,
                item.Score,
                null,
                0);
        }

        public static RankingCandidate FromMediaInfo(MdbListMediaInfo item, decimal sortScore, int catalogPosition)
        {
            return FromMediaInfo(item, item.ImdbRating, sortScore, catalogPosition);
        }

        public static RankingCandidate FromMediaInfo(MdbListMediaInfo item, decimal? displayScore, decimal? sortScore, int catalogPosition)
        {
            return new RankingCandidate(
                item.TmdbId,
                item.Title,
                item.Year,
                null,
                item.Overview,
                item.PosterUrl,
                item.BackdropUrl,
                null,
                displayScore,
                sortScore,
                item.ImdbVotes,
                catalogPosition);
        }
    }

    private sealed record TmdbSummary(
        string Title,
        string? Overview,
        string? PosterUrl,
        string? BackdropUrl,
        DateOnly? ReleaseDate,
        decimal? VoteAverage);
}
