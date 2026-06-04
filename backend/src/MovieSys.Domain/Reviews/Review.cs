using MovieSys.Domain.Common;
using MovieSys.Domain.Media;
using MovieSys.Domain.Users;

namespace MovieSys.Domain.Reviews;

public sealed class Review : Entity, IAuditableEntity, ISoftDeletableEntity
{
    public Guid UserId { get; set; }

    public MediaType MediaType { get; set; }

    public Guid? MovieId { get; set; }

    public Guid? SeriesId { get; set; }

    public int? RatingSnapshot { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public bool ContainsSpoilers { get; set; }

    public ReviewVisibility Visibility { get; set; } = ReviewVisibility.Public;

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public User? User { get; set; }

    public Movie? Movie { get; set; }

    public Series? Series { get; set; }
}
