using Rewndly.Domain.Common;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Events;

public sealed class SystemEvent : Entity
{
    public Guid? UserId { get; set; }

    public SystemEventType EventType { get; set; }

    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    public string? MetadataJson { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? User { get; set; }
}
