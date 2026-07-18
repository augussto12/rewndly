using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Public;

namespace Rewndly.Infrastructure.ExternalServices.News;

public sealed partial class RssNewsService(
    HttpClient httpClient,
    IMemoryCache cache,
    IDateTimeProvider dateTimeProvider,
    IOptions<RssNewsOptions> options,
    ILogger<RssNewsService> logger)
{
    private const string CacheKey = "rss-news:aggregate";

    // Single-flight: serializa el fetch cross-request para evitar el stampede en cache fría.
    // Estático porque el typed HttpClient service es transient (una instancia por request).
    private static readonly SemaphoreSlim RefreshLock = new(1, 1);

    private static readonly XNamespace Media = "http://search.yahoo.com/mrss/";
    private static readonly XNamespace Content = "http://purl.org/rss/1.0/modules/content/";
    private static readonly XNamespace Atom = "http://www.w3.org/2005/Atom";

    private readonly RssNewsOptions _options = options.Value;

    public async Task<NewsFeedResponse> GetLatestAsync(int limit, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || _options.Feeds.Count == 0)
        {
            return new NewsFeedResponse([], null);
        }

        var boundedLimit = Math.Clamp(limit, 1, _options.MaxTotal);
        var aggregate = await GetOrRefreshAsync(cancellationToken);
        return new NewsFeedResponse(aggregate.Articles.Take(boundedLimit).ToList(), aggregate.FetchedAt);
    }

    private async Task<CachedNews> GetOrRefreshAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out CachedNews? cached) && cached is not null)
        {
            return cached;
        }

        await RefreshLock.WaitAsync(cancellationToken);
        try
        {
            // Double-check: otro request pudo poblar la cache mientras esperábamos el lock.
            if (cache.TryGetValue(CacheKey, out cached) && cached is not null)
            {
                return cached;
            }

            // La computación compartida no se ata al ciclo de vida de un request (si el primero
            // aborta, el fetch igual completa y se cachea para los demás). Los timeouts por feed lo acotan.
            var aggregate = await FetchAllAsync(CancellationToken.None);
            var minutes = aggregate.Articles.Count > 0
                ? Math.Clamp(_options.CacheMinutes, 1, 240)
                : Math.Clamp(_options.EmptyCacheMinutes, 1, 60);
            cache.Set(CacheKey, aggregate, TimeSpan.FromMinutes(minutes));
            return aggregate;
        }
        finally
        {
            RefreshLock.Release();
        }
    }

    private async Task<CachedNews> FetchAllAsync(CancellationToken cancellationToken)
    {
        var tasks = _options.Feeds.Select(feed => FetchFeedAsync(feed, cancellationToken));
        var results = await Task.WhenAll(tasks);

        var merged = results
            .SelectMany(items => items)
            .Where(article => !string.IsNullOrWhiteSpace(article.Url))
            .GroupBy(article => article.Url, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderByDescending(article => article.PublishedAt ?? DateTimeOffset.MinValue)
            .Take(_options.MaxTotal)
            .ToList();

        return new CachedNews(merged, dateTimeProvider.UtcNow);
    }

    private async Task<IReadOnlyList<NewsArticleResponse>> FetchFeedAsync(RssFeed feed, CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, feed.Url);
            request.Headers.TryAddWithoutValidation("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml");

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("RSS feed {Feed} returned status {StatusCode}.", feed.Name, (int)response.StatusCode);
                return [];
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            // XmlResolver null evita XXE / entidades externas. Ignore (en vez de Prohibit) tolera
            // un <!DOCTYPE> presente en el feed sin procesarlo, para no descartar feeds válidos.
            using var reader = XmlReader.Create(stream, new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Ignore,
                XmlResolver = null,
                Async = true,
                MaxCharactersFromEntities = 1024,
            });

            var document = await XDocument.LoadAsync(reader, LoadOptions.None, cancellationToken);
            return ParseFeed(document, feed.Name);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return [];
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "RSS feed {Feed} failed to load.", feed.Name);
            return [];
        }
    }

    private IReadOnlyList<NewsArticleResponse> ParseFeed(XDocument document, string source)
    {
        var root = document.Root;
        if (root is null)
        {
            return [];
        }

        // RSS 2.0: rss/channel/item. Atom: feed/entry.
        var items = root.Descendants("item").ToList();
        var isAtom = items.Count == 0;
        if (isAtom)
        {
            items = root.Descendants(Atom + "entry").ToList();
        }

        var articles = new List<NewsArticleResponse>();
        foreach (var item in items.Take(_options.MaxItemsPerFeed))
        {
            var article = isAtom ? ParseAtomEntry(item, source) : ParseRssItem(item, source);
            if (article is not null)
            {
                articles.Add(article);
            }
        }

        return articles;
    }

    private static NewsArticleResponse? ParseRssItem(XElement item, string source)
    {
        var title = CleanText(item.Element("title")?.Value);
        var link = item.Element("link")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(link))
        {
            return null;
        }

        var published = ParseDate(item.Element("pubDate")?.Value ?? item.Element(Atom + "updated")?.Value);
        var descriptionHtml = item.Element("description")?.Value ?? item.Element(Content + "encoded")?.Value;
        var image = ExtractImage(item, descriptionHtml);
        var summary = CleanText(StripHtml(descriptionHtml));

        return new NewsArticleResponse(title!, link!, source, image, Truncate(summary, 280), published);
    }

    private static NewsArticleResponse? ParseAtomEntry(XElement entry, string source)
    {
        var title = CleanText(entry.Element(Atom + "title")?.Value);
        var link = entry.Elements(Atom + "link")
            .FirstOrDefault(element => (string?)element.Attribute("rel") is null or "alternate")?
            .Attribute("href")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(link))
        {
            return null;
        }

        var published = ParseDate(entry.Element(Atom + "published")?.Value ?? entry.Element(Atom + "updated")?.Value);
        var summaryHtml = entry.Element(Atom + "summary")?.Value ?? entry.Element(Atom + "content")?.Value;
        var image = ExtractImage(entry, summaryHtml);
        var summary = CleanText(StripHtml(summaryHtml));

        return new NewsArticleResponse(title!, link!, source, image, Truncate(summary, 280), published);
    }

    private static string? ExtractImage(XElement item, string? descriptionHtml)
    {
        var mediaContent = item.Elements(Media + "content")
            .FirstOrDefault(element =>
            {
                var type = (string?)element.Attribute("type");
                var medium = (string?)element.Attribute("medium");
                return medium == "image" || (type?.StartsWith("image", StringComparison.OrdinalIgnoreCase) ?? false);
            })?.Attribute("url")?.Value;
        if (!string.IsNullOrWhiteSpace(mediaContent))
        {
            return mediaContent;
        }

        var thumbnail = item.Element(Media + "thumbnail")?.Attribute("url")?.Value;
        if (!string.IsNullOrWhiteSpace(thumbnail))
        {
            return thumbnail;
        }

        var enclosure = item.Elements("enclosure")
            .FirstOrDefault(element => ((string?)element.Attribute("type"))?.StartsWith("image", StringComparison.OrdinalIgnoreCase) ?? false)?
            .Attribute("url")?.Value;
        if (!string.IsNullOrWhiteSpace(enclosure))
        {
            return enclosure;
        }

        if (!string.IsNullOrWhiteSpace(descriptionHtml))
        {
            var match = ImgSrcRegex().Match(descriptionHtml);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
        }

        return null;
    }

    private static DateTimeOffset? ParseDate(string? value)
    {
        return DateTimeOffset.TryParse(value, out var parsed) ? parsed : null;
    }

    private static string? StripHtml(string? html)
    {
        return string.IsNullOrWhiteSpace(html) ? null : HtmlTagRegex().Replace(html, " ");
    }

    private static string? CleanText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return WhitespaceRegex().Replace(value, " ").Trim();
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Length <= max ? value : value[..max].TrimEnd() + "…";
    }

    [GeneratedRegex("<img[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase)]
    private static partial Regex ImgSrcRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    private sealed record CachedNews(IReadOnlyList<NewsArticleResponse> Articles, DateTimeOffset FetchedAt);
}
