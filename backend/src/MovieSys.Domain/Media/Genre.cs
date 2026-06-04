using MovieSys.Domain.Common;

namespace MovieSys.Domain.Media;

public sealed class Genre : Entity
{
    public int TmdbId { get; set; }

    public string Name { get; set; } = string.Empty;

    public MediaType MediaType { get; set; }
}
