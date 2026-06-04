using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class UserPrivacySettings : Entity, IAuditableEntity
{
    public Guid UserId { get; set; }

    public ProfileVisibility ProfileVisibility { get; set; } = ProfileVisibility.Public;

    public bool ShowActivity { get; set; } = true;

    public bool ShowStats { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? User { get; set; }
}
