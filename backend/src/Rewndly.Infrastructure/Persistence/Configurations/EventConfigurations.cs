using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Events;

namespace Rewndly.Infrastructure.Persistence.Configurations;

public sealed class ActivityEventConfiguration : IEntityTypeConfiguration<ActivityEvent>
{
    public void Configure(EntityTypeBuilder<ActivityEvent> builder)
    {
        builder.ToTable("activity_events", table =>
        {
            table.HasCheckConstraint(
                "ck_activity_events_optional_media",
                "((movie_id IS NULL AND series_id IS NULL AND media_type IS NULL) OR (movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
        });

        builder.ConfigureUuidPrimaryKey();

        builder.Property(activityEvent => activityEvent.EventType).HasConversion<string>().HasMaxLength(60).IsRequired();
        builder.Property(activityEvent => activityEvent.MediaType).HasConversion<string>().HasMaxLength(20);
        builder.Property(activityEvent => activityEvent.MetadataJson).HasColumnType("jsonb");
        builder.Property(activityEvent => activityEvent.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");

        builder.HasIndex(activityEvent => activityEvent.UserId);
        builder.HasIndex(activityEvent => activityEvent.CreatedAt);
        builder.HasIndex(activityEvent => activityEvent.EventType);
        builder.HasIndex(activityEvent => activityEvent.MovieId);
        builder.HasIndex(activityEvent => activityEvent.SeriesId);

        builder
            .HasOne(activityEvent => activityEvent.User)
            .WithMany()
            .HasForeignKey(activityEvent => activityEvent.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(activityEvent => activityEvent.Movie)
            .WithMany()
            .HasForeignKey(activityEvent => activityEvent.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(activityEvent => activityEvent.Series)
            .WithMany()
            .HasForeignKey(activityEvent => activityEvent.SeriesId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class SystemEventConfiguration : IEntityTypeConfiguration<SystemEvent>
{
    public void Configure(EntityTypeBuilder<SystemEvent> builder)
    {
        builder.ToTable("system_events");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(systemEvent => systemEvent.EventType).HasConversion<string>().HasMaxLength(80).IsRequired();
        builder.Property(systemEvent => systemEvent.EntityType).HasMaxLength(80);
        builder.Property(systemEvent => systemEvent.MetadataJson).HasColumnType("jsonb");
        builder.Property(systemEvent => systemEvent.IpAddress).HasMaxLength(64);
        builder.Property(systemEvent => systemEvent.UserAgent).HasMaxLength(512);
        builder.Property(systemEvent => systemEvent.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");

        builder.HasIndex(systemEvent => systemEvent.UserId);
        builder.HasIndex(systemEvent => systemEvent.EventType);
        builder.HasIndex(systemEvent => systemEvent.CreatedAt);
        builder.HasIndex(systemEvent => new { systemEvent.EntityType, systemEvent.EntityId });

        builder
            .HasOne(systemEvent => systemEvent.User)
            .WithMany()
            .HasForeignKey(systemEvent => systemEvent.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
