namespace Rewndly.Infrastructure.ExternalServices.Wikidata;

/// <summary>
/// Circuit breaker compartido para Wikimedia. Al recibir 429/403 suspendemos las llamadas
/// por un cooldown para respetar el rate limit y evitar un ban.
/// </summary>
public sealed class WikidataAvailabilityState
{
    private readonly object _gate = new();
    private DateTimeOffset? _disabledUntil;

    public bool IsAvailable(DateTimeOffset now)
    {
        lock (_gate)
        {
            return _disabledUntil is null || _disabledUntil <= now;
        }
    }

    public DateTimeOffset? DisabledUntil
    {
        get
        {
            lock (_gate)
            {
                return _disabledUntil;
            }
        }
    }

    public void Suspend(DateTimeOffset until)
    {
        lock (_gate)
        {
            // No acortamos un cooldown más largo ya vigente (ej. un 429 de 15 min no debe
            // pisarse por un backoff transitorio de 2 min).
            if (_disabledUntil is null || until > _disabledUntil)
            {
                _disabledUntil = until;
            }
        }
    }
}
