namespace MovieSys.Domain.Common;

public interface ISoftDeletableEntity
{
    bool IsDeleted { get; set; }

    DateTimeOffset? DeletedAt { get; set; }
}
