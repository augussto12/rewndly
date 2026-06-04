using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public sealed class MovieGenre : Entity
{
    public Guid MovieId { get; set; }

    public Guid GenreId { get; set; }

    public Movie? Movie { get; set; }

    public Genre? Genre { get; set; }
}
