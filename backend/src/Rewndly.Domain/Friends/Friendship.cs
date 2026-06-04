using Rewndly.Domain.Common;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Friends;

public sealed class Friendship : Entity, IAuditableEntity
{
    public Guid RequesterId { get; set; }

    public Guid ReceiverId { get; set; }

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? Requester { get; set; }

    public User? Receiver { get; set; }
}
