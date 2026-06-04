using Rewndly.Domain.Common;
using Rewndly.Domain.Media;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Library;

public sealed class UserMediaItem : Entity, IAuditableEntity
{
    public Guid UserId { get; set; }

    public MediaType MediaType { get; set; }

    public Guid? MovieId { get; set; }

    public Guid? SeriesId { get; set; }

    public WatchStatus Status { get; set; } = WatchStatus.WantToWatch;

    public bool IsFavorite { get; set; }

    public int? Rating { get; set; }

    public DateTimeOffset? WatchedAt { get; set; }

    public DateTimeOffset? StartedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? User { get; set; }

    public Movie? Movie { get; set; }

    public Series? Series { get; set; }
}
