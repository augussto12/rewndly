using Rewndly.Domain.Common;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Friends;

public sealed class FriendshipRequest : Entity
{
    public Guid RequesterId { get; set; }

    public Guid ReceiverId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? Requester { get; set; }

    public User? Receiver { get; set; }
}
