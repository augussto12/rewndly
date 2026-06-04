using Rewndly.Domain.Common;

namespace Rewndly.Domain.Media;

public sealed class SeriesGenre : Entity
{
    public Guid SeriesId { get; set; }

    public Guid GenreId { get; set; }

    public Series? Series { get; set; }

    public Genre? Genre { get; set; }
}
