using MovieSys.Domain.Common;

namespace MovieSys.Domain.Media;

public sealed class MovieGenre : Entity
{
    public Guid MovieId { get; set; }

    public Guid GenreId { get; set; }

    public Movie? Movie { get; set; }

    public Genre? Genre { get; set; }
}
