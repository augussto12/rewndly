using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Domain.Media;

namespace Rewndly.Infrastructure.ExternalServices.Wikidata;

public sealed class WikidataClient(
    HttpClient httpClient,
    WikidataAvailabilityState availabilityState,
    IDateTimeProvider dateTimeProvider,
    IOptions<WikidataOptions> options,
    ILogger<WikidataClient> logger)
{
    private readonly WikidataOptions _options = options.Value;

    public async Task<WikidataFetchResult> FetchAsync(WikidataEntityType entityType, int tmdbId, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || tmdbId <= 0)
        {
            return WikidataFetchResult.Skip();
        }

        if (!availabilityState.IsAvailable(dateTimeProvider.UtcNow))
        {
            return WikidataFetchResult.Skip();
        }

        var sparql = BuildSparql(entityType, tmdbId);
        var document = await ExecuteSparqlAsync(sparql, cancellationToken);
        if (document is null)
        {
            return WikidataFetchResult.Skip();
        }

        using (document)
        {
            if (!document.RootElement.TryGetProperty("results", out var results)
                || !results.TryGetProperty("bindings", out var bindings)
                || bindings.ValueKind != JsonValueKind.Array
                || bindings.GetArrayLength() == 0)
            {
                // La entidad no existe en Wikidata (o no tiene el ID de TMDB cargado).
                return WikidataFetchResult.NoData();
            }

            var qid = ExtractQid(bindings);
            if (qid is null)
            {
                return WikidataFetchResult.NoData();
            }

            var awards = ParseAwards(bindings);

            WikidataBio? bio = null;
            if (entityType == WikidataEntityType.Person)
            {
                bio = await FetchBioAsync(qid, cancellationToken);
            }

            return WikidataFetchResult.Success(new WikidataEnrichment(qid, awards, bio));
        }
    }

    private string BuildSparql(WikidataEntityType entityType, int tmdbId)
    {
        var tmdbProperty = entityType switch
        {
            WikidataEntityType.Movie => "P4947",
            WikidataEntityType.Series => "P4983",
            _ => "P4985",
        };

        // P1686 = "por qué obra" (personas); P1346 = "ganador" (películas: premio individual del elenco).
        var detailQualifier = entityType == WikidataEntityType.Person ? "P1686" : "P1346";

        return $$"""
            SELECT ?entity ?status ?awardLabel ?year ?detailLabel WHERE {
              ?entity wdt:{{tmdbProperty}} "{{tmdbId}}".
              OPTIONAL {
                { ?entity p:P166 ?st. ?st ps:P166 ?award. BIND("won" AS ?status) }
                UNION
                { ?entity p:P1411 ?st. ?st ps:P1411 ?award. BIND("nominated" AS ?status) }
                OPTIONAL { ?st pq:P585 ?date. }
                OPTIONAL { ?st pq:{{detailQualifier}} ?detail. }
                BIND(YEAR(?date) AS ?year)
              }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            LIMIT 300
            """;
    }

    private async Task<JsonDocument?> ExecuteSparqlAsync(string query, CancellationToken cancellationToken)
    {
        var url = $"{_options.SparqlUrl}?format=json&query={Uri.EscapeDataString(query)}";
        return await SendJsonAsync(url, "SPARQL", cancellationToken, backoffOnFailure: true);
    }

    private async Task<WikidataBio?> FetchBioAsync(string qid, CancellationToken cancellationToken)
    {
        try
        {
            var title = await ResolveSpanishWikipediaTitleAsync(qid, cancellationToken);
            if (string.IsNullOrWhiteSpace(title))
            {
                return null;
            }

            var summaryUrl = $"{_options.WikipediaSummaryUrl}/{Uri.EscapeDataString(title)}";
            using var summary = await SendJsonAsync(summaryUrl, "Wikipedia summary", cancellationToken);
            if (summary is null)
            {
                return null;
            }

            var root = summary.RootElement;
            var extract = ReadString(root, "extract");
            if (string.IsNullOrWhiteSpace(extract))
            {
                return null;
            }

            var sourceUrl = root.TryGetProperty("content_urls", out var contentUrls)
                && contentUrls.TryGetProperty("desktop", out var desktop)
                && desktop.TryGetProperty("page", out var page)
                && page.ValueKind == JsonValueKind.String
                ? page.GetString()
                : $"https://es.wikipedia.org/wiki/{Uri.EscapeDataString(title)}";

            var thumbnail = root.TryGetProperty("thumbnail", out var thumb) && thumb.TryGetProperty("source", out var source) && source.ValueKind == JsonValueKind.String
                ? source.GetString()
                : null;

            return new WikidataBio(extract!.Trim(), ReadString(root, "title") ?? title, sourceUrl!, thumbnail);
        }
        catch (Exception exception)
        {
            logger.LogDebug(exception, "Wikidata bio pipeline failed for {Qid}.", qid);
            return null;
        }
    }

    private async Task<string?> ResolveSpanishWikipediaTitleAsync(string qid, CancellationToken cancellationToken)
    {
        var url = $"{_options.WikidataRestUrl}/entities/items/{qid}/sitelinks/eswiki";
        using var document = await SendJsonAsync(url, "Wikidata sitelink", cancellationToken, allowNotFound: true);
        return document is not null ? ReadString(document.RootElement, "title") : null;
    }

    private async Task<JsonDocument?> SendJsonAsync(string url, string label, CancellationToken cancellationToken, bool allowNotFound = false, bool backoffOnFailure = false)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("Accept", "application/json");

            using var response = await httpClient.SendAsync(request, cancellationToken);

            if (allowNotFound && response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            if (response.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.Forbidden)
            {
                var cooldown = TimeSpan.FromMinutes(Math.Clamp(_options.RateLimitCooldownMinutes, 1, 120));
                availabilityState.Suspend(dateTimeProvider.UtcNow.Add(cooldown));
                logger.LogWarning("Wikimedia {Label} returned {StatusCode}; suspending Wikidata lookups for {Minutes} min.", label, (int)response.StatusCode, cooldown.TotalMinutes);
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Wikimedia {Label} returned status {StatusCode}.", label, (int)response.StatusCode);
                // Un 5xx en el camino crítico (SPARQL) suele ser degradación global de Wikidata:
                // aplicamos un backoff corto para no bloquear ~20s en cada request siguiente.
                if (backoffOnFailure && (int)response.StatusCode >= 500)
                {
                    ApplyTransientBackoff();
                }

                return null;
            }

            return await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return null;
        }
        catch (Exception exception)
        {
            // Incluye timeout de HttpClient (TaskCanceledException con el token del request sin cancelar).
            logger.LogWarning(exception, "Wikimedia {Label} request failed.", label);
            if (backoffOnFailure)
            {
                ApplyTransientBackoff();
            }

            return null;
        }
    }

    private void ApplyTransientBackoff()
    {
        var cooldown = TimeSpan.FromMinutes(Math.Clamp(_options.TransientCooldownMinutes, 1, 30));
        availabilityState.Suspend(dateTimeProvider.UtcNow.Add(cooldown));
    }

    private static string? ExtractQid(JsonElement bindings)
    {
        foreach (var binding in bindings.EnumerateArray())
        {
            if (binding.TryGetProperty("entity", out var entity) && entity.TryGetProperty("value", out var value) && value.ValueKind == JsonValueKind.String)
            {
                var uri = value.GetString();
                var index = uri?.LastIndexOf('/') ?? -1;
                if (index >= 0 && index < uri!.Length - 1)
                {
                    var qid = uri[(index + 1)..];
                    if (qid.StartsWith('Q'))
                    {
                        return qid;
                    }
                }
            }
        }

        return null;
    }

    private IReadOnlyList<WikidataAward> ParseAwards(JsonElement bindings)
    {
        var awards = new List<WikidataAward>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var binding in bindings.EnumerateArray())
        {
            var status = ReadBindingValue(binding, "status");
            var award = SanitizeLabel(ReadBindingValue(binding, "awardLabel"));
            if (string.IsNullOrWhiteSpace(status) || string.IsNullOrWhiteSpace(award))
            {
                continue;
            }

            var year = int.TryParse(ReadBindingValue(binding, "year"), out var parsedYear) && parsedYear > 1900 ? parsedYear : (int?)null;
            var detail = SanitizeLabel(ReadBindingValue(binding, "detailLabel"));

            var key = $"{status}|{award}|{year}|{detail}";
            if (!seen.Add(key))
            {
                continue;
            }

            awards.Add(new WikidataAward(status!, award!, year, string.IsNullOrWhiteSpace(detail) ? null : detail));
        }

        // Si un mismo premio (categoría/año/detalle) figura como "won" y "nominated" —duplicación
        // conocida de Wikidata—, nos quedamos solo con el "won".
        var wonKeys = awards
            .Where(a => a.Status == "won")
            .Select(a => $"{a.Award}|{a.Year}|{a.Detail}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return awards
            .Where(a => a.Status == "won" || !wonKeys.Contains($"{a.Award}|{a.Year}|{a.Detail}"))
            .OrderByDescending(a => a.Status == "won")
            .ThenByDescending(a => a.Year ?? 0)
            .ThenBy(a => a.Award, StringComparer.OrdinalIgnoreCase)
            .Take(Math.Clamp(_options.MaxAwards, 1, 200))
            .ToList();
    }

    private static string? ReadBindingValue(JsonElement binding, string key)
    {
        return binding.TryGetProperty(key, out var property) && property.TryGetProperty("value", out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static string? SanitizeLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return null;
        }

        // Algunos labels ES de premios vienen con el prefijo "Anexo:" de Wikipedia.
        var trimmed = label.Trim();
        if (trimmed.StartsWith("Anexo:", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed["Anexo:".Length..].Trim();
        }

        return trimmed.Length == 0 ? null : trimmed;
    }

    private static string? ReadString(JsonElement element, string name)
    {
        return element.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }
}

public sealed record WikidataAward(string Status, string Award, int? Year, string? Detail);

public sealed record WikidataBio(string Extract, string SourceTitle, string SourceUrl, string? ThumbnailUrl);

public sealed record WikidataEnrichment(string? WikidataId, IReadOnlyList<WikidataAward> Awards, WikidataBio? Bio);

public sealed record WikidataFetchResult(bool ShouldCache, WikidataEnrichment? Data)
{
    public static WikidataFetchResult Success(WikidataEnrichment data) => new(true, data);

    public static WikidataFetchResult NoData() => new(true, new WikidataEnrichment(null, [], null));

    public static WikidataFetchResult Skip() => new(false, null);
}
