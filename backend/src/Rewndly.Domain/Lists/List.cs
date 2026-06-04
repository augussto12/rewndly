using Rewndly.Domain.Common;
using Rewndly.Domain.Users;

namespace Rewndly.Domain.Lists;

public sealed class List : Entity, IAuditableEntity, ISoftDeletableEntity
{
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ListVisibility Visibility { get; set; } = ListVisibility.Public;

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? User { get; set; }
}
