using Rewndly.Domain.Common;
using Rewndly.Domain.Media;

namespace Rewndly.Domain.Lists;

public sealed class ListItem : Entity
{
    public Guid ListId { get; set; }

    public MediaType MediaType { get; set; }

    public Guid? MovieId { get; set; }

    public Guid? SeriesId { get; set; }

    public int Position { get; set; }

    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public List? List { get; set; }

    public Movie? Movie { get; set; }

    public Series? Series { get; set; }
}
