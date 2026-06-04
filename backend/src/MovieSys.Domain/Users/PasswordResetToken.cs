using MovieSys.Domain.Common;

namespace MovieSys.Domain.Users;

public sealed class PasswordResetToken : Entity
{
    public Guid UserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public string? RequestedByIp { get; set; }

    public string? UsedByIp { get; set; }

    public User? User { get; set; }
}
