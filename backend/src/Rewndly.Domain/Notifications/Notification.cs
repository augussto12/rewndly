using Rewndly.Domain.Common;

namespace Rewndly.Domain.Notifications;

public sealed class Notification : Entity
{
    public Guid UserId { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Body { get; set; }

    public string? MetadataJson { get; set; }

    public DateTimeOffset? ReadAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
