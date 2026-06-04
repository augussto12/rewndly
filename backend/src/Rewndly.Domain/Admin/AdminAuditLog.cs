using Rewndly.Domain.Common;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Admin;

public sealed class AdminAuditLog : Entity
{
    public Guid AdminUserId { get; set; }

    public AdminAuditAction Action { get; set; }

    public string TargetType { get; set; } = string.Empty;

    public Guid? TargetId { get; set; }

    public string? Reason { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? AdminUser { get; set; }
}
