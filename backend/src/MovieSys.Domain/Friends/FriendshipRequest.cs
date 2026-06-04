using MovieSys.Domain.Common;
using MovieSys.Domain.Users;

namespace MovieSys.Domain.Friends;

public sealed class FriendshipRequest : Entity
{
    public Guid RequesterId { get; set; }

    public Guid ReceiverId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? Requester { get; set; }

    public User? Receiver { get; set; }
}
