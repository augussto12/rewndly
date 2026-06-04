using MovieSys.Domain.Common;

namespace MovieSys.Domain.Reports;

public sealed class Report : Entity
{
    public Guid ReporterUserId { get; set; }

    public string TargetType { get; set; } = string.Empty;

    public Guid TargetId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string? Details { get; set; }

    public string Status { get; set; } = "Open";

    public Guid? ReviewedByAdminId { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
