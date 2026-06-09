using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Domain.Media;

namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public sealed class MdbListClient(
    HttpClient httpClient,
    IOptions<MdbListOptions> options,
    ILogger<MdbListClient> logger)
{
    private static readonly IReadOnlyDictionary<string, RatingSourceInfo> SourceMap =
        new Dictionary<string, RatingSourceInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["imdb"] = new("IMDb", "IMDb", 10),
            ["internet movie database"] = new("IMDb", "IMDb", 10),
            ["tomatoes"] = new("RottenTomatoes", "Rotten Tomatoes", 100),
            ["rottentomatoes"] = new("RottenTomatoes", "Rotten Tomatoes", 100),
            ["rotten tomatoes"] = new("RottenTomatoes", "Rotten Tomatoes", 100),
            ["rt"] = new("RottenTomatoes", "Rotten Tomatoes", 100),
            ["audience"] = new("RottenAudience", "Rotten Audience", 100),
            ["rtaudience"] = new("RottenAudience", "Rotten Audience", 100),
            ["metacritic"] = new("Metacritic", "Metacritic", 100),
            ["letterboxd"] = new("Letterboxd", "Letterboxd", 5),
            ["trakt"] = new("Trakt", "Trakt", 10),
            ["tmdb"] = new("TMDB", "TMDB", 10),
            ["score"] = new("MDBListScore", "MDBList", 100),
            ["score_average"] = new("MDBListScore", "MDBList", 100),
            ["mdblist"] = new("MDBListScore", "MDBList", 100),
        };

    private readonly MdbListOptions _options = options.Value;
    private bool _disabledByAuthFailure;

    public async Task<MdbListLookupResult> GetMediaRatingsAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey) || _disabledByAuthFailure)
        {
            return MdbListLookupResult.Skip();
        }

        var mdbMediaType = mediaType == MediaType.Movie ? "movie" : "show";
        var path = $"tmdb/{mdbMediaType}/{tmdbId}/?apikey={Uri.EscapeDataString(_options.ApiKey)}";

        try
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                logger.LogDebug("MDBList returned no data for {MediaType} {TmdbId}.", mediaType, tmdbId);
                return MdbListLookupResult.NotFound();
            }

            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                _disabledByAuthFailure = true;
                logger.LogWarning("MDBList rejected the configured API key with status {StatusCode}. Disabling MDBList lookups until restart.", (int)response.StatusCode);
                return MdbListLookupResult.Skip();
            }

            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                logger.LogWarning("MDBList rate limit reached while fetching {MediaType} {TmdbId}.", mediaType, tmdbId);
                return MdbListLookupResult.Skip();
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("MDBList lookup failed with status {StatusCode} for {MediaType} {TmdbId}.", (int)response.StatusCode, mediaType, tmdbId);
                return MdbListLookupResult.Skip();
            }

            using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
            if (document is null)
            {
                return MdbListLookupResult.NotFound();
            }

            var ratings = ParseRatings(document.RootElement);
            return ratings.Count == 0 ? MdbListLookupResult.NotFound() : MdbListLookupResult.Success(ratings);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return MdbListLookupResult.Skip();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "MDBList lookup failed for {MediaType} {TmdbId}.", mediaType, tmdbId);
            return MdbListLookupResult.Skip();
        }
    }

    public async Task<MdbListCatalogResult> GetCatalogAsync(
        MediaType mediaType,
        string sortBy,
        int limit,
        CancellationToken cancellationToken)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey) || _disabledByAuthFailure)
        {
            return MdbListCatalogResult.Skip();
        }

        var catalogType = mediaType == MediaType.Movie ? "movie" : "show";
        var targetCount = Math.Clamp(limit, 1, 1000);
        var pageLimit = Math.Min(targetCount, 100);
        var items = new List<MdbListCatalogItem>();
        string? cursor = null;

        try
        {
            while (items.Count < targetCount)
            {
                var path = $"catalog/{catalogType}?limit={pageLimit}&sort={Uri.EscapeDataString(sortBy)}&sort_order=desc&apikey={Uri.EscapeDataString(_options.ApiKey)}";
                if (!string.IsNullOrWhiteSpace(cursor))
                {
                    path += $"&cursor={Uri.EscapeDataString(cursor)}";
                }

                using var response = await httpClient.GetAsync(path, cancellationToken);

                if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                {
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    if (response.StatusCode == HttpStatusCode.Unauthorized || !body.Contains("Catalog query limit reached", StringComparison.OrdinalIgnoreCase))
                    {
                        _disabledByAuthFailure = true;
                        logger.LogWarning("MDBList rejected the configured API key while fetching {MediaType} catalog. Disabling MDBList lookups until restart.", mediaType);
                    }
                    else
                    {
                        logger.LogWarning("MDBList catalog query limit reached while fetching {MediaType} sorted by {SortBy}.", mediaType, sortBy);
                    }

                    return MdbListCatalogResult.Skip();
                }

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    logger.LogWarning("MDBList rate limit reached while fetching {MediaType} catalog sorted by {SortBy}.", mediaType, sortBy);
                    return MdbListCatalogResult.Skip();
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("MDBList catalog failed with status {StatusCode} for {MediaType} sorted by {SortBy}.", (int)response.StatusCode, mediaType, sortBy);
                    return MdbListCatalogResult.Skip();
                }

                using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
                if (document is null)
                {
                    return MdbListCatalogResult.Empty();
                }

                var pageItems = ParseCatalogItems(document.RootElement, mediaType);
                if (pageItems.Count == 0)
                {
                    break;
                }

                items.AddRange(pageItems);
                cursor = ReadPaginationCursor(document.RootElement);
                if (string.IsNullOrWhiteSpace(cursor))
                {
                    break;
                }
            }

            return MdbListCatalogResult.Success(items.DistinctBy(item => item.TmdbId).Take(targetCount).ToList());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return MdbListCatalogResult.Skip();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "MDBList catalog failed for {MediaType} sorted by {SortBy}.", mediaType, sortBy);
            return MdbListCatalogResult.Skip();
        }
    }

    public async Task<IReadOnlyDictionary<int, decimal>> GetRatingsAsync(
        MediaType mediaType,
        string ratingSource,
        IReadOnlyList<int> tmdbIds,
        CancellationToken cancellationToken)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey) || _disabledByAuthFailure || tmdbIds.Count == 0)
        {
            return new Dictionary<int, decimal>();
        }

        var mdbMediaType = mediaType == MediaType.Movie ? "movie" : "show";
        var boundedIds = tmdbIds.Where(id => id > 0).Distinct().Take(100).ToList();
        var ratings = new Dictionary<int, decimal>();

        foreach (var chunk in boundedIds.Chunk(10))
        {
            var path = $"rating/{mdbMediaType}/{Uri.EscapeDataString(ratingSource)}?apikey={Uri.EscapeDataString(_options.ApiKey)}";
            try
            {
                using var response = await httpClient.PostAsJsonAsync(path, new { provider = "tmdb", ids = chunk.Select(id => id.ToString(CultureInfo.InvariantCulture)).ToArray() }, cancellationToken);

                if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                {
                    _disabledByAuthFailure = true;
                    logger.LogWarning("MDBList rejected the configured API key while fetching {RatingSource} ratings. Disabling MDBList lookups until restart.", ratingSource);
                    break;
                }

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    logger.LogWarning("MDBList rate limit reached while fetching {RatingSource} ratings.", ratingSource);
                    break;
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("MDBList rating batch failed with status {StatusCode} for {RatingSource}.", (int)response.StatusCode, ratingSource);
                    continue;
                }

                using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
                if (document is null || !document.RootElement.TryGetProperty("ratings", out var ratingsElement) || ratingsElement.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var ratingElement in ratingsElement.EnumerateArray())
                {
                    var id = ReadInt(ratingElement, "id");
                    var rating = ReadDecimal(ratingElement, "rating", "value", "score");
                    if (id is not null && rating is not null)
                    {
                        ratings[id.Value] = rating.Value;
                    }
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "MDBList rating batch failed for {RatingSource}.", ratingSource);
            }
        }

        return ratings;
    }

    public async Task<IReadOnlyList<MdbListMediaInfo>> GetMediaInfoBatchAsync(
        MediaType mediaType,
        IReadOnlyList<int> tmdbIds,
        CancellationToken cancellationToken)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.ApiKey) || _disabledByAuthFailure || tmdbIds.Count == 0)
        {
            return [];
        }

        var mdbMediaType = mediaType == MediaType.Movie ? "movie" : "show";
        var boundedIds = tmdbIds.Where(id => id > 0).Distinct().Take(500).ToList();
        var items = new List<MdbListMediaInfo>();

        foreach (var chunk in boundedIds.Chunk(50))
        {
            var path = $"tmdb/{mdbMediaType}/?apikey={Uri.EscapeDataString(_options.ApiKey)}";
            try
            {
                using var response = await httpClient.PostAsJsonAsync(path, new { ids = chunk }, cancellationToken);

                if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                {
                    _disabledByAuthFailure = true;
                    logger.LogWarning("MDBList rejected the configured API key while fetching {MediaType} media batch. Disabling MDBList lookups until restart.", mediaType);
                    break;
                }

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    logger.LogWarning("MDBList rate limit reached while fetching {MediaType} media batch.", mediaType);
                    break;
                }

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("MDBList media batch failed with status {StatusCode} for {MediaType}.", (int)response.StatusCode, mediaType);
                    continue;
                }

                using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
                if (document is null || document.RootElement.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var itemElement in document.RootElement.EnumerateArray())
                {
                    var item = ParseMediaInfo(itemElement);
                    if (item is not null)
                    {
                        items.Add(item);
                    }
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "MDBList media batch failed for {MediaType}.", mediaType);
            }
        }

        return items
            .GroupBy(item => item.TmdbId)
            .Select(group => group.First())
            .ToList();
    }

    private static IReadOnlyList<MdbListRating> ParseRatings(JsonElement root)
    {
        var ratings = new List<MdbListRating>();

        if (root.TryGetProperty("ratings", out var ratingsElement) && ratingsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var ratingElement in ratingsElement.EnumerateArray())
            {
                if (ratingElement.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var sourceName = ReadString(ratingElement, "source", "name", "provider", "id", "type");
                if (string.IsNullOrWhiteSpace(sourceName) || !TryGetSourceInfo(sourceName, out var sourceInfo))
                {
                    continue;
                }

                var value = ReadDecimal(ratingElement, "value", "rating", "score", "average");
                if (value is null)
                {
                    continue;
                }

                var normalizedValue = NormalizeValue(sourceInfo, value.Value);
                if (normalizedValue is null)
                {
                    continue;
                }

                ratings.Add(new MdbListRating(
                    sourceInfo.Source,
                    sourceInfo.Label,
                    normalizedValue.Value,
                    sourceInfo.Scale,
                    ReadInt(ratingElement, "votes", "vote_count", "voteCount", "count")));
            }
        }

        var score = ReadDecimal(root, "score");
        if (score is not null && ratings.All(rating => rating.Source != "MDBListScore"))
        {
            ratings.Add(new MdbListRating("MDBListScore", "MDBList", Math.Clamp(score.Value, 0, 100), 100, null));
        }

        return ratings
            .GroupBy(rating => rating.Source, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();
    }

    private static bool TryGetSourceInfo(string sourceName, out RatingSourceInfo sourceInfo)
    {
        var normalized = sourceName.Trim().Replace("_", string.Empty, StringComparison.Ordinal).Replace("-", string.Empty, StringComparison.Ordinal);
        if (SourceMap.TryGetValue(normalized, out var normalizedSourceInfo))
        {
            sourceInfo = normalizedSourceInfo;
            return true;
        }

        if (SourceMap.TryGetValue(sourceName.Trim(), out var directSourceInfo))
        {
            sourceInfo = directSourceInfo;
            return true;
        }

        sourceInfo = new RatingSourceInfo(string.Empty, string.Empty, 0);
        return false;
    }

    private static IReadOnlyList<MdbListCatalogItem> ParseCatalogItems(JsonElement root, MediaType mediaType)
    {
        var itemsElement = default(JsonElement);
        var foundItems =
            root.ValueKind == JsonValueKind.Array ||
            root.TryGetProperty("items", out itemsElement) ||
            root.TryGetProperty(mediaType == MediaType.Movie ? "movies" : "shows", out itemsElement) ||
            root.TryGetProperty("results", out itemsElement);

        if (!foundItems)
        {
            return [];
        }

        var source = root.ValueKind == JsonValueKind.Array ? root : itemsElement;
        if (source.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var items = new List<MdbListCatalogItem>();
        foreach (var itemElement in source.EnumerateArray())
        {
            if (itemElement.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var tmdbId = ReadTmdbId(itemElement);
            var title = ReadString(itemElement, "title", "name");
            if (tmdbId is null || string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            items.Add(new MdbListCatalogItem(
                tmdbId.Value,
                title.Trim(),
                ReadInt(itemElement, "year"),
                ReadDecimal(itemElement, "score", "score_average", "rating")));
        }

        return items;
    }

    private static MdbListMediaInfo? ParseMediaInfo(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var tmdbId = ReadTmdbId(element);
        var title = ReadString(element, "title", "name");
        if (tmdbId is null || string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var imdbRating = ReadDecimal(element, "imdb_rating", "imdbRating", "imdb_score", "imdbScore");
        var imdbVotes = ReadInt(element, "imdb_votes", "imdbVotes", "imdb_vote_count", "imdbVoteCount");
        if (element.TryGetProperty("ratings", out var ratingsElement) && ratingsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var ratingElement in ratingsElement.EnumerateArray())
            {
                var source = ReadString(ratingElement, "source", "name", "provider", "id", "type");
                if (!IsImdbSource(source))
                {
                    continue;
                }

                imdbRating = ReadDecimal(ratingElement, "value", "rating", "score", "average");
                if (imdbRating is > 10 and <= 100)
                {
                    imdbRating /= 10;
                }

                imdbVotes = ReadInt(ratingElement, "votes", "vote_count", "voteCount", "count");
                break;
            }
        }

        return new MdbListMediaInfo(
            tmdbId.Value,
            title.Trim(),
            ReadInt(element, "year", "release_year"),
            ReadString(element, "description", "overview"),
            ReadString(element, "poster", "poster_url", "posterUrl"),
            ReadString(element, "backdrop", "backdrop_url", "backdropUrl"),
            ReadDecimal(element, "score", "score_average"),
            imdbRating,
            imdbVotes);
    }

    private static bool IsImdbSource(string? source)
    {
        return !string.IsNullOrWhiteSpace(source) &&
            SourceMap.TryGetValue(source.Trim(), out var sourceInfo) &&
            sourceInfo.Source.Equals("IMDb", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ReadPaginationCursor(JsonElement root)
    {
        if (root.TryGetProperty("pagination", out var pagination) && pagination.ValueKind == JsonValueKind.Object)
        {
            return ReadString(pagination, "next_cursor", "nextCursor", "cursor");
        }

        return ReadString(root, "next_cursor", "nextCursor", "cursor");
    }

    private static int? ReadTmdbId(JsonElement element)
    {
        var tmdbId = ReadInt(element, "tmdb_id", "tmdbId", "tmdbid");
        if (tmdbId is not null)
        {
            return tmdbId;
        }

        return element.TryGetProperty("ids", out var ids) && ids.ValueKind == JsonValueKind.Object
            ? ReadInt(ids, "tmdb", "tmdbid", "tmdb_id")
            : null;
    }

    private static decimal? NormalizeValue(RatingSourceInfo sourceInfo, decimal value)
    {
        if (value < 0)
        {
            return null;
        }

        if (sourceInfo.Scale == 10 && value > 10 && value <= 100)
        {
            value /= 10;
        }

        if (sourceInfo.Scale == 5 && value > 5 && value <= 100)
        {
            value /= 20;
        }

        return value > sourceInfo.Scale ? sourceInfo.Scale : value;
    }

    private static string? ReadString(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (element.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.String)
            {
                return property.GetString();
            }
        }

        return null;
    }

    private static decimal? ReadDecimal(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (!element.TryGetProperty(name, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetDecimal(out var value))
            {
                return value;
            }

            if (property.ValueKind == JsonValueKind.String &&
                decimal.TryParse(property.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out value))
            {
                return value;
            }
        }

        return null;
    }

    private static int? ReadInt(JsonElement element, params string[] names)
    {
        foreach (var name in names)
        {
            if (!element.TryGetProperty(name, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var value))
            {
                return value;
            }

            if (property.ValueKind == JsonValueKind.String &&
                int.TryParse(property.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            {
                return value;
            }
        }

        return null;
    }

    private sealed record RatingSourceInfo(string Source, string Label, decimal Scale);
}

public sealed record MdbListRating(string Source, string Label, decimal Value, decimal Scale, int? Votes);

public sealed record MdbListCatalogItem(int TmdbId, string Title, int? Year, decimal? Score);

public sealed record MdbListMediaInfo(
    int TmdbId,
    string Title,
    int? Year,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    decimal? Score,
    decimal? ImdbRating,
    int? ImdbVotes);

public sealed record MdbListCatalogResult(bool ShouldCache, IReadOnlyList<MdbListCatalogItem> Items)
{
    public static MdbListCatalogResult Success(IReadOnlyList<MdbListCatalogItem> items) => new(true, items);

    public static MdbListCatalogResult Empty() => new(true, []);

    public static MdbListCatalogResult Skip() => new(false, []);
}

public sealed record MdbListLookupResult(bool ShouldCache, IReadOnlyList<MdbListRating> Ratings)
{
    public static MdbListLookupResult Success(IReadOnlyList<MdbListRating> ratings) => new(true, ratings);

    public static MdbListLookupResult NotFound() => new(true, []);

    public static MdbListLookupResult Skip() => new(false, []);
}
