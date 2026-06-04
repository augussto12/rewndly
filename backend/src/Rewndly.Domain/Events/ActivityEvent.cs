using Rewndly.Domain.Common;
using Rewndly.Domain.Media;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Events;

public sealed class ActivityEvent : Entity
{
    public Guid UserId { get; set; }

    public ActivityEventType EventType { get; set; }

    public MediaType? MediaType { get; set; }

    public Guid? MovieId { get; set; }

    public Guid? SeriesId { get; set; }

    public string? MetadataJson { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? User { get; set; }

    public Movie? Movie { get; set; }

    public Series? Series { get; set; }
}
