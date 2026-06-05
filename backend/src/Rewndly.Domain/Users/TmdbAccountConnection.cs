using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class TmdbAccountConnection : Entity, IAuditableEntity
{
    public Guid UserId { get; set; }

    public int TmdbAccountId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public string? AvatarUrl { get; set; }

    public string ProtectedSessionId { get; set; } = string.Empty;

    public DateTimeOffset ConnectedAt { get; set; }

    public DateTimeOffset? LastSyncedAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? User { get; set; }
}
