using Rewndly.Domain.Common;

namespace Rewndly.Domain.Users;

public sealed class User : Entity, IAuditableEntity, ISoftDeletableEntity
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public UserRole Role { get; set; } = UserRole.User;

    public bool MustChangePassword { get; set; }

    public DateTimeOffset? EmailVerifiedAt { get; set; }

    public bool IsDisabled { get; set; }

    public DateTimeOffset? DisabledAt { get; set; }

    public Guid? DisabledByAdminId { get; set; }

    public string? DisableReason { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public Guid? DeletedByAdminId { get; set; }

    public string? DeleteReason { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }

    public UserPrivacySettings? PrivacySettings { get; set; }

    public User? DisabledByAdmin { get; set; }

    public User? DeletedByAdmin { get; set; }
}
