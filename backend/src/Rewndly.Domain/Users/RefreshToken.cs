using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class RefreshToken : Entity
{
    public Guid UserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public Guid? ReplacedByTokenId { get; set; }

    public string? CreatedByIp { get; set; }

    public string? RevokedByIp { get; set; }

    public string? UserAgent { get; set; }

    public User? User { get; set; }

    public RefreshToken? ReplacedByToken { get; set; }
}
