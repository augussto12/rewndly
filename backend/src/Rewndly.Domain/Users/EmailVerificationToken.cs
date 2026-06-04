using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class EmailVerificationToken : Entity
{
    public Guid UserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public string? CreatedByIp { get; set; }

    public User? User { get; set; }
}
