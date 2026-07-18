using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Analytics;

namespace Rewndly.Infrastructure.Persistence.Configurations;

public sealed class CloudflareDailySnapshotConfiguration : IEntityTypeConfiguration<CloudflareDailySnapshot>
{
    public void Configure(EntityTypeBuilder<CloudflareDailySnapshot> builder)
    {
        builder.ToTable("cloudflare_daily_snapshots");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(snapshot => snapshot.Date).IsRequired();
        builder.Property(snapshot => snapshot.FetchedAt).HasPrecision(3).IsRequired();

        builder.HasIndex(snapshot => snapshot.Date).IsUnique();
    }
}
