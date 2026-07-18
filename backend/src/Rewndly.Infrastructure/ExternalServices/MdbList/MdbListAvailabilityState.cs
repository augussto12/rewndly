namespace Rewndly.Infrastructure.ExternalServices.MdbList;

public enum MdbListOutageReason
{
    AuthFailure = 1,
    RateLimited = 2,
}

public sealed record MdbListAvailabilityTransition(
    bool Disabled,
    MdbListOutageReason? Reason,
    DateTimeOffset? DisabledUntil);

public sealed class MdbListAvailabilityState
{
    private readonly object _gate = new();
    private readonly Queue<MdbListAvailabilityTransition> _pendingTransitions = new();
    private DateTimeOffset? _disabledUntil;
    private MdbListOutageReason? _reason;

    public bool IsAvailable(DateTimeOffset now)
    {
        lock (_gate)
        {
            return _disabledUntil is null || _disabledUntil <= now;
        }
    }

    public (DateTimeOffset? DisabledUntil, MdbListOutageReason? Reason) Snapshot(DateTimeOffset now)
    {
        lock (_gate)
        {
            return _disabledUntil is { } disabledUntil && disabledUntil > now
                ? (disabledUntil, _reason)
                : (null, null);
        }
    }

    public void ReportOutage(MdbListOutageReason reason, DateTimeOffset now, TimeSpan cooldown)
    {
        lock (_gate)
        {
            var wasAvailable = _disabledUntil is null || _disabledUntil <= now;
            var reasonChanged = _reason != reason;
            _disabledUntil = now.Add(cooldown);
            _reason = reason;

            if (wasAvailable || reasonChanged)
            {
                _pendingTransitions.Enqueue(new MdbListAvailabilityTransition(true, reason, _disabledUntil));
            }
        }
    }

    public void ReportSuccess()
    {
        lock (_gate)
        {
            if (_reason is null)
            {
                return;
            }

            _disabledUntil = null;
            _reason = null;
            _pendingTransitions.Enqueue(new MdbListAvailabilityTransition(false, null, null));
        }
    }

    public bool TryDequeueTransition(out MdbListAvailabilityTransition transition)
    {
        lock (_gate)
        {
            if (_pendingTransitions.Count > 0)
            {
                transition = _pendingTransitions.Dequeue();
                return true;
            }

            transition = null!;
            return false;
        }
    }
}
