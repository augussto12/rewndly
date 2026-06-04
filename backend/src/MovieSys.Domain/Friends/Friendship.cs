using MovieSys.Domain.Common;
using MovieSys.Domain.Users;

namespace MovieSys.Domain.Friends;

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
