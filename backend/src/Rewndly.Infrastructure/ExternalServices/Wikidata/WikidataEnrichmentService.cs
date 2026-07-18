using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure.ExternalServices.Wikidata;

public sealed class WikidataEnrichmentService(
    AppDbContext dbContext,
    WikidataClient client,
    IDateTimeProvider dateTimeProvider,
    IServiceScopeFactory scopeFactory,
    IOptions<WikidataOptions> options,
    ILogger<WikidataEnrichmentService> logger)
{
    private static readonly ConcurrentDictionary<string, byte> PendingRefreshes = new(StringComparer.Ordinal);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly WikidataOptions _options = options.Value;

    public async Task<MediaAwardsResponse> GetMediaAwardsAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken)
    {
        var entityType = mediaType == MediaType.Movie ? WikidataEntityType.Movie : WikidataEntityType.Series;
        var row = await GetOrRefreshAsync(entityType, tmdbId, cancellationToken);
        if (row is null)
        {
            return new MediaAwardsResponse(false, null, [], null);
        }

        return new MediaAwardsResponse(
            row.WikidataId is not null,
            row.WikidataId,
            DeserializeAwards(row.AwardsJson),
            row.FetchedAt);
    }

    public async Task<PersonWikiResponse> GetPersonWikiAsync(int tmdbId, CancellationToken cancellationToken)
    {
        var row = await GetOrRefreshAsync(WikidataEntityType.Person, tmdbId, cancellationToken);
        if (row is null)
        {
            return new PersonWikiResponse(false, null, null, [], null);
        }

        WikiBioResponse? bio = row.BioExtract is { Length: > 0 } extract
            ? new WikiBioResponse(extract, row.BioSourceTitle ?? "Wikipedia", row.BioSourceUrl ?? "", row.BioThumbnailUrl)
            : null;

        return new PersonWikiResponse(
            row.WikidataId is not null,
            row.WikidataId,
            bio,
            DeserializeAwards(row.AwardsJson),
            row.FetchedAt);
    }

    public async Task RefreshAsync(WikidataEntityType entityType, int tmdbId, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || tmdbId <= 0)
        {
            return;
        }

        var result = await client.FetchAsync(entityType, tmdbId, cancellationToken);
        if (!result.ShouldCache || result.Data is null)
        {
            return;
        }

        var data = result.Data;
        var now = dateTimeProvider.UtcNow;
        var hasData = data.WikidataId is not null && (data.Awards.Count > 0 || data.Bio is not null);
        var expiresAt = now.AddHours(Math.Clamp(hasData ? _options.CacheHours : _options.NoDataCacheHours, 1, 24 * 90));

        var existing = await dbContext.WikidataEnrichmentCaches
            .FirstOrDefaultAsync(cache => cache.EntityType == entityType && cache.TmdbId == tmdbId, cancellationToken);

        if (existing is null)
        {
            existing = new WikidataEnrichmentCache { EntityType = entityType, TmdbId = tmdbId };
            dbContext.WikidataEnrichmentCaches.Add(existing);
        }

        existing.WikidataId = data.WikidataId;
        existing.AwardsJson = JsonSerializer.Serialize(data.Awards, JsonOptions);
        existing.BioExtract = data.Bio?.Extract;
        existing.BioSourceTitle = data.Bio?.SourceTitle;
        existing.BioSourceUrl = data.Bio?.SourceUrl;
        existing.BioThumbnailUrl = data.Bio?.ThumbnailUrl;
        existing.FetchedAt = now;
        existing.ExpiresAt = expiresAt;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Otra request concurrente ya insertó la fila para esta (EntityType, TmdbId) en el
            // camino de cache fría; su dato es válido, así que ignoramos la violación de unicidad.
            logger.LogDebug("Concurrent Wikidata cache insert for {EntityType} {TmdbId}; ignoring unique violation.", entityType, tmdbId);
        }
    }

    private async Task<WikidataEnrichmentCache?> GetOrRefreshAsync(WikidataEntityType entityType, int tmdbId, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || tmdbId <= 0)
        {
            return null;
        }

        var now = dateTimeProvider.UtcNow;
        var cached = await QueryRow(entityType, tmdbId).FirstOrDefaultAsync(cancellationToken);

        if (cached is null)
        {
            await RefreshAsync(entityType, tmdbId, cancellationToken);
            cached = await QueryRow(entityType, tmdbId).FirstOrDefaultAsync(cancellationToken);
        }
        else if (cached.ExpiresAt <= now)
        {
            QueueRefresh(entityType, tmdbId);
        }

        return cached;
    }

    private IQueryable<WikidataEnrichmentCache> QueryRow(WikidataEntityType entityType, int tmdbId)
    {
        return dbContext.WikidataEnrichmentCaches
            .AsNoTracking()
            .Where(cache => cache.EntityType == entityType && cache.TmdbId == tmdbId);
    }

    private void QueueRefresh(WikidataEntityType entityType, int tmdbId)
    {
        var key = $"{entityType}:{tmdbId}";
        if (!PendingRefreshes.TryAdd(key, 0))
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<WikidataEnrichmentService>();
                await service.RefreshAsync(entityType, tmdbId, CancellationToken.None);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Background Wikidata refresh failed for {EntityType} {TmdbId}.", entityType, tmdbId);
            }
            finally
            {
                PendingRefreshes.TryRemove(key, out _);
            }
        });
    }

    private static IReadOnlyList<WikidataAwardResponse> DeserializeAwards(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var awards = JsonSerializer.Deserialize<List<WikidataAward>>(json, JsonOptions);
            return awards?
                .Select(award => new WikidataAwardResponse(award.Status, award.Award, award.Year, award.Detail))
                .ToList() ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
