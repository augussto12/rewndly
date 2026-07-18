using System.Text.Json;
using Rewndly.Domain.Events;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public static class MdbListSystemEventRecorder
{
    public static async Task RecordPendingTransitionsAsync(
        AppDbContext dbContext,
        MdbListAvailabilityState availabilityState,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var recorded = false;
        while (availabilityState.TryDequeueTransition(out var transition))
        {
            dbContext.SystemEvents.Add(new SystemEvent
            {
                EventType = transition.Disabled
                    ? SystemEventType.ExternalProviderDisabled
                    : SystemEventType.ExternalProviderRecovered,
                EntityType = "MdbList",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    reason = transition.Reason?.ToString(),
                    disabledUntil = transition.DisabledUntil,
                }),
                CreatedAt = now,
            });
            recorded = true;
        }

        if (recorded)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
