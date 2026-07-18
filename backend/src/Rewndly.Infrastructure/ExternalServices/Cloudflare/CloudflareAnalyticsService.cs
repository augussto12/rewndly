using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Application.Modules.Admin;
using Rewndly.Domain.Analytics;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure.ExternalServices.Cloudflare;

public sealed class CloudflareAnalyticsService(
    AppDbContext dbContext,
    CloudflareAnalyticsClient client,
    IMemoryCache cache,
    IDateTimeProvider dateTimeProvider,
    IOptions<CloudflareOptions> options,
    ILogger<CloudflareAnalyticsService> logger)
{
    private const int MaxWindowDays = 90;
    private const int TopCountryCount = 8;
    private readonly CloudflareOptions _options = options.Value;

    public async Task<AdminCloudflareResponse> GetAnalyticsAsync(int days, CancellationToken cancellationToken)
    {
        var windowDays = Math.Clamp(days, 7, MaxWindowDays);
        var today = DateOnly.FromDateTime(dateTimeProvider.UtcNow.UtcDateTime);
        var from = today.AddDays(-(windowDays - 1));

        if (!_options.Enabled)
        {
            return Disabled(from, today);
        }

        var cacheKey = $"cloudflare-analytics:{windowDays}:{today:yyyy-MM-dd}";
        if (cache.TryGetValue<AdminCloudflareResponse>(cacheKey, out var cached) && cached is not null)
        {
            return cached;
        }

        var response = await BuildAsync(from, today, cancellationToken);
        cache.Set(cacheKey, response, TimeSpan.FromMinutes(Math.Clamp(_options.CacheMinutes, 1, 120)));
        return response;
    }

    private async Task<AdminCloudflareResponse> BuildAsync(DateOnly from, DateOnly today, CancellationToken cancellationToken)
    {
        var zoneTask = client.GetZoneTrafficAsync(from, today, cancellationToken);
        var rumTask = client.GetRumTrafficAsync(from, today, cancellationToken);
        await Task.WhenAll(zoneTask, rumTask);

        var zoneDays = zoneTask.Result;
        var rumDays = rumTask.Result;
        var live = zoneDays is not null || rumDays is not null;
        var now = dateTimeProvider.UtcNow;

        if (live)
        {
            await PersistSnapshotsAsync(zoneDays, rumDays, now, cancellationToken);
        }

        // Combinamos lo live con el histórico propio (para días fuera de la retención del plan free).
        var byDate = new SortedDictionary<DateOnly, PointAccumulator>();
        var stored = await dbContext.CloudflareDailySnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.Date >= from && snapshot.Date <= today)
            .ToListAsync(cancellationToken);

        foreach (var snapshot in stored)
        {
            byDate[snapshot.Date] = new PointAccumulator
            {
                Requests = snapshot.Requests,
                PageViews = snapshot.PageViews,
                Uniques = snapshot.Uniques,
                HumanVisits = snapshot.HumanVisits,
            };
        }

        var countryTotals = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        if (zoneDays is not null)
        {
            foreach (var day in zoneDays)
            {
                var point = byDate.TryGetValue(day.Date, out var existing) ? existing : byDate[day.Date] = new PointAccumulator();
                point.Requests = day.Requests;
                point.PageViews = day.PageViews;
                point.Uniques = day.Uniques;

                foreach (var country in day.Countries)
                {
                    countryTotals[country.Country] = countryTotals.GetValueOrDefault(country.Country) + country.Requests;
                }
            }
        }

        if (rumDays is not null)
        {
            foreach (var day in rumDays)
            {
                var point = byDate.TryGetValue(day.Date, out var existing) ? existing : byDate[day.Date] = new PointAccumulator();
                point.HumanVisits = day.Visits;
            }
        }

        // Rellenamos todos los días de la ventana (los que faltan van en cero) para que el
        // eje X del gráfico sea un calendario continuo, igual que la serie de actividad.
        var points = new List<AdminCloudflarePointResponse>();
        for (var date = from; date <= today; date = date.AddDays(1))
        {
            points.Add(byDate.TryGetValue(date, out var accumulator)
                ? new AdminCloudflarePointResponse(date, accumulator.Requests, accumulator.PageViews, accumulator.Uniques, accumulator.HumanVisits)
                : new AdminCloudflarePointResponse(date, 0, 0, 0, _options.HasRumAnalytics ? 0 : null));
        }

        var sevenDaysAgo = today.AddDays(-6);
        var topCountries = countryTotals
            .OrderByDescending(entry => entry.Value)
            .Take(TopCountryCount)
            .Select(entry => new AdminCloudflareCountryResponse(entry.Key, entry.Value))
            .ToList();

        return new AdminCloudflareResponse(
            Enabled: true,
            ZoneConfigured: _options.HasZoneAnalytics,
            RumConfigured: _options.HasRumAnalytics,
            Live: live,
            From: from,
            To: today,
            HumanVisitsToday: points.FirstOrDefault(point => point.Date == today)?.HumanVisits,
            HumanVisitsLast7Days: _options.HasRumAnalytics
                ? points.Where(point => point.Date >= sevenDaysAgo).Sum(point => point.HumanVisits ?? 0)
                : null,
            TotalRequests: points.Sum(point => point.Requests),
            TotalPageViews: points.Sum(point => point.PageViews),
            // Los uniques de Cloudflare NO son aditivos entre días (un visitante recurrente
            // cuenta una vez por día), así que reportamos el pico diario, no la suma.
            TotalUniques: points.Count == 0 ? 0 : points.Max(point => point.Uniques),
            Points: points,
            TopCountries: topCountries,
            FetchedAt: live || stored.Count > 0 ? now : null);
    }

    private async Task PersistSnapshotsAsync(
        IReadOnlyList<CloudflareZoneDay>? zoneDays,
        IReadOnlyList<CloudflareRumDay>? rumDays,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        try
        {
            var dates = new HashSet<DateOnly>();
            if (zoneDays is not null)
            {
                foreach (var day in zoneDays)
                {
                    dates.Add(day.Date);
                }
            }

            if (rumDays is not null)
            {
                foreach (var day in rumDays)
                {
                    dates.Add(day.Date);
                }
            }

            if (dates.Count == 0)
            {
                return;
            }

            var existing = await dbContext.CloudflareDailySnapshots
                .Where(snapshot => dates.Contains(snapshot.Date))
                .ToDictionaryAsync(snapshot => snapshot.Date, cancellationToken);

            var zoneByDate = zoneDays?.ToDictionary(day => day.Date);
            var rumByDate = rumDays?.ToDictionary(day => day.Date);

            foreach (var date in dates)
            {
                if (!existing.TryGetValue(date, out var snapshot))
                {
                    snapshot = new CloudflareDailySnapshot { Date = date };
                    dbContext.CloudflareDailySnapshots.Add(snapshot);
                }

                if (zoneByDate is not null && zoneByDate.TryGetValue(date, out var zone))
                {
                    snapshot.Requests = zone.Requests;
                    snapshot.PageViews = zone.PageViews;
                    snapshot.Uniques = zone.Uniques;
                    snapshot.Bytes = zone.Bytes;
                    snapshot.Threats = zone.Threats;
                }

                if (rumByDate is not null && rumByDate.TryGetValue(date, out var rum))
                {
                    snapshot.HumanVisits = rum.Visits;
                    snapshot.HumanPageViews = rum.PageViews;
                }

                snapshot.FetchedAt = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to persist Cloudflare daily snapshots.");
        }
    }

    private AdminCloudflareResponse Disabled(DateOnly from, DateOnly today)
    {
        return new AdminCloudflareResponse(
            Enabled: false,
            ZoneConfigured: _options.HasZoneAnalytics,
            RumConfigured: _options.HasRumAnalytics,
            Live: false,
            From: from,
            To: today,
            HumanVisitsToday: null,
            HumanVisitsLast7Days: null,
            TotalRequests: 0,
            TotalPageViews: 0,
            TotalUniques: 0,
            Points: [],
            TopCountries: [],
            FetchedAt: null);
    }

    private sealed class PointAccumulator
    {
        public long Requests { get; set; }

        public long PageViews { get; set; }

        public long Uniques { get; set; }

        public long? HumanVisits { get; set; }
    }
}
