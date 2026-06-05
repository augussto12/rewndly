using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class TmdbAuthRequest : Entity
{
    public Guid UserId { get; set; }

    public string RequestTokenHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public User? User { get; set; }
}
