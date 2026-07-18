using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Rewndly.Infrastructure.ExternalServices.Cloudflare;

public sealed class CloudflareAnalyticsClient(
    HttpClient httpClient,
    IOptions<CloudflareOptions> options,
    ILogger<CloudflareAnalyticsClient> logger)
{
    private readonly CloudflareOptions _options = options.Value;

    private const string ZoneQuery = """
        query ZoneTraffic($zoneTag: string!, $start: Time!, $end: Time!) {
          viewer {
            zones(filter: { zoneTag: $zoneTag }) {
              perDay: httpRequests1dGroups(limit: 366, orderBy: [date_ASC], filter: { datetime_geq: $start, datetime_lt: $end }) {
                dimensions { date }
                sum { requests pageViews bytes threats countryMap { clientCountryName requests } }
                uniq { uniques }
              }
            }
          }
        }
        """;

    private const string RumQuery = """
        query RumTraffic($accountTag: string!, $siteTag: string!, $start: Date!, $end: Date!) {
          viewer {
            accounts(filter: { accountTag: $accountTag }) {
              perDay: rumPageloadEventsAdaptiveGroups(limit: 366, orderBy: [date_ASC], filter: { date_geq: $start, date_leq: $end, siteTag: $siteTag }) {
                dimensions { date }
                count
                sum { visits }
              }
            }
          }
        }
        """;

    public async Task<IReadOnlyList<CloudflareZoneDay>?> GetZoneTrafficAsync(
        DateOnly from,
        DateOnly toInclusive,
        CancellationToken cancellationToken)
    {
        if (!_options.HasZoneAnalytics)
        {
            return null;
        }

        var variables = new Dictionary<string, object>
        {
            ["zoneTag"] = _options.ZoneId,
            ["start"] = ToRfc3339(from),
            ["end"] = ToRfc3339(toInclusive.AddDays(1)), // datetime_lt es exclusivo
        };

        var root = await ExecuteAsync(ZoneQuery, variables, cancellationToken);
        if (root is null)
        {
            return null;
        }

        var days = new List<CloudflareZoneDay>();
        foreach (var zone in EnumerateNodes(root.Value, "zones"))
        {
            foreach (var group in EnumerateArray(zone, "perDay"))
            {
                var date = ReadDate(group);
                if (date is null)
                {
                    continue;
                }

                var sum = GetProperty(group, "sum");
                var uniq = GetProperty(group, "uniq");
                var countries = new List<CloudflareCountryCount>();
                if (sum is { } sumElement && sumElement.TryGetProperty("countryMap", out var countryMap) && countryMap.ValueKind == JsonValueKind.Array)
                {
                    foreach (var country in countryMap.EnumerateArray())
                    {
                        var name = ReadString(country, "clientCountryName");
                        if (!string.IsNullOrWhiteSpace(name))
                        {
                            countries.Add(new CloudflareCountryCount(name!, ReadLong(country, "requests")));
                        }
                    }
                }

                days.Add(new CloudflareZoneDay(
                    date.Value,
                    ReadLong(sum, "requests"),
                    ReadLong(sum, "pageViews"),
                    ReadLong(uniq, "uniques"),
                    ReadLong(sum, "bytes"),
                    ReadLong(sum, "threats"),
                    countries));
            }
        }

        return days;
    }

    public async Task<IReadOnlyList<CloudflareRumDay>?> GetRumTrafficAsync(
        DateOnly from,
        DateOnly toInclusive,
        CancellationToken cancellationToken)
    {
        if (!_options.HasRumAnalytics)
        {
            return null;
        }

        var variables = new Dictionary<string, object>
        {
            ["accountTag"] = _options.AccountTag,
            ["siteTag"] = _options.SiteTag,
            ["start"] = from.ToString("yyyy-MM-dd"),
            ["end"] = toInclusive.ToString("yyyy-MM-dd"),
        };

        var root = await ExecuteAsync(RumQuery, variables, cancellationToken);
        if (root is null)
        {
            return null;
        }

        var days = new List<CloudflareRumDay>();
        foreach (var account in EnumerateNodes(root.Value, "accounts"))
        {
            foreach (var group in EnumerateArray(account, "perDay"))
            {
                var date = ReadDate(group);
                if (date is null)
                {
                    continue;
                }

                var sum = GetProperty(group, "sum");
                days.Add(new CloudflareRumDay(
                    date.Value,
                    ReadLong(group, "count"),
                    ReadLong(sum, "visits")));
            }
        }

        return days;
    }

    private async Task<JsonElement?> ExecuteAsync(
        string query,
        Dictionary<string, object> variables,
        CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _options.BaseUrl)
            {
                Content = JsonContent.Create(new { query, variables }),
            };
            request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {_options.ApiToken}");

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Cloudflare GraphQL returned status {StatusCode}.", (int)response.StatusCode);
                return null;
            }

            using var document = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: cancellationToken);
            if (document is null)
            {
                return null;
            }

            var rootElement = document.RootElement;
            if (rootElement.TryGetProperty("errors", out var errors)
                && errors.ValueKind == JsonValueKind.Array
                && errors.GetArrayLength() > 0)
            {
                logger.LogWarning("Cloudflare GraphQL returned errors: {Errors}", errors.ToString());
                return null;
            }

            if (!rootElement.TryGetProperty("data", out var data)
                || !data.TryGetProperty("viewer", out var viewer)
                || viewer.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            // Clonamos porque el JsonDocument se descarta al salir del using.
            return viewer.Clone();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return null;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Cloudflare GraphQL request failed.");
            return null;
        }
    }

    private static IEnumerable<JsonElement> EnumerateNodes(JsonElement viewer, string nodeName)
    {
        if (viewer.TryGetProperty(nodeName, out var node) && node.ValueKind == JsonValueKind.Array)
        {
            foreach (var element in node.EnumerateArray())
            {
                yield return element;
            }
        }
    }

    private static IEnumerable<JsonElement> EnumerateArray(JsonElement parent, string propertyName)
    {
        if (parent.TryGetProperty(propertyName, out var array) && array.ValueKind == JsonValueKind.Array)
        {
            foreach (var element in array.EnumerateArray())
            {
                yield return element;
            }
        }
    }

    private static JsonElement? GetProperty(JsonElement element, string propertyName)
    {
        return element.ValueKind == JsonValueKind.Object && element.TryGetProperty(propertyName, out var value)
            ? value
            : null;
    }

    private static DateOnly? ReadDate(JsonElement group)
    {
        if (group.TryGetProperty("dimensions", out var dimensions)
            && dimensions.TryGetProperty("date", out var date)
            && date.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(date.GetString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static long ReadLong(JsonElement? element, string propertyName)
    {
        if (element is { } value
            && value.ValueKind == JsonValueKind.Object
            && value.TryGetProperty(propertyName, out var property)
            && property.ValueKind == JsonValueKind.Number
            && property.TryGetInt64(out var number))
        {
            return number;
        }

        return 0;
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static string ToRfc3339(DateOnly date)
    {
        return date.ToString("yyyy-MM-dd") + "T00:00:00Z";
    }
}

public sealed record CloudflareCountryCount(string Country, long Requests);

public sealed record CloudflareZoneDay(
    DateOnly Date,
    long Requests,
    long PageViews,
    long Uniques,
    long Bytes,
    long Threats,
    IReadOnlyList<CloudflareCountryCount> Countries);

public sealed record CloudflareRumDay(
    DateOnly Date,
    long PageViews,
    long Visits);
