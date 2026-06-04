using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieSys.Domain.Library;
using MovieSys.Domain.Reviews;
using ListEntity = MovieSys.Domain.Lists.List;
using ListItemEntity = MovieSys.Domain.Lists.ListItem;

namespace MovieSys.Infrastructure.Persistence.Configurations;

public sealed class UserMediaItemConfiguration : IEntityTypeConfiguration<UserMediaItem>
{
    public void Configure(EntityTypeBuilder<UserMediaItem> builder)
    {
        builder.ToTable("user_media_items", table =>
        {
            table.HasCheckConstraint(
                "ck_user_media_items_one_media",
                "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");

            table.HasCheckConstraint(
                "ck_user_media_items_rating_range",
                "(rating IS NULL OR (rating >= 1 AND rating <= 10))");
        });

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();

        builder.Property(item => item.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(item => item.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(item => item.WatchedAt).HasPrecision(3);
        builder.Property(item => item.StartedAt).HasPrecision(3);

        builder.HasIndex(item => item.UserId);
        builder.HasIndex(item => item.Status);
        builder.HasIndex(item => item.MovieId);
        builder.HasIndex(item => item.SeriesId);
        builder.HasIndex(item => new { item.UserId, item.MovieId }).IsUnique().HasFilter("movie_id IS NOT NULL");
        builder.HasIndex(item => new { item.UserId, item.SeriesId }).IsUnique().HasFilter("series_id IS NOT NULL");

        builder
            .HasOne(item => item.User)
            .WithMany()
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(item => item.Movie)
            .WithMany()
            .HasForeignKey(item => item.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(item => item.Series)
            .WithMany()
            .HasForeignKey(item => item.SeriesId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("reviews", table =>
        {
            table.HasCheckConstraint(
                "ck_reviews_one_media",
                "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");

            table.HasCheckConstraint(
                "ck_reviews_rating_snapshot_range",
                "(rating_snapshot IS NULL OR (rating_snapshot >= 1 AND rating_snapshot <= 10))");
        });

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();
        builder.ConfigureSoftDeleteFields();

        builder.HasQueryFilter(review => !review.IsDeleted);

        builder.Property(review => review.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(review => review.Title).HasMaxLength(180).IsRequired();
        builder.Property(review => review.Body).HasMaxLength(8000).IsRequired();
        builder.Property(review => review.Visibility).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(review => review.UserId);
        builder.HasIndex(review => review.MovieId);
        builder.HasIndex(review => review.SeriesId);
        builder.HasIndex(review => review.CreatedAt);
        builder.HasIndex(review => review.Visibility);
        builder.HasIndex(review => review.IsDeleted);

        builder
            .HasOne(review => review.User)
            .WithMany()
            .HasForeignKey(review => review.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(review => review.Movie)
            .WithMany()
            .HasForeignKey(review => review.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(review => review.Series)
            .WithMany()
            .HasForeignKey(review => review.SeriesId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ListConfiguration : IEntityTypeConfiguration<ListEntity>
{
    public void Configure(EntityTypeBuilder<ListEntity> builder)
    {
        builder.ToTable("lists");

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();
        builder.ConfigureSoftDeleteFields();

        builder.HasQueryFilter(list => !list.IsDeleted);

        builder.Property(list => list.Title).HasMaxLength(160).IsRequired();
        builder.Property(list => list.Description).HasMaxLength(1000);
        builder.Property(list => list.Visibility).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(list => list.UserId);
        builder.HasIndex(list => list.Visibility);
        builder.HasIndex(list => list.IsDeleted);

        builder
            .HasOne(list => list.User)
            .WithMany()
            .HasForeignKey(list => list.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ListItemConfiguration : IEntityTypeConfiguration<ListItemEntity>
{
    public void Configure(EntityTypeBuilder<ListItemEntity> builder)
    {
        builder.ToTable("list_items", table =>
        {
            table.HasCheckConstraint(
                "ck_list_items_one_media",
                "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
        });

        builder.ConfigureUuidPrimaryKey();

        builder.Property(item => item.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(item => item.Note).HasMaxLength(1000);
        builder.Property(item => item.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");

        builder.HasIndex(item => item.ListId);
        builder.HasIndex(item => item.MovieId);
        builder.HasIndex(item => item.SeriesId);
        builder.HasIndex(item => new { item.ListId, item.MovieId }).IsUnique().HasFilter("movie_id IS NOT NULL");
        builder.HasIndex(item => new { item.ListId, item.SeriesId }).IsUnique().HasFilter("series_id IS NOT NULL");

        builder
            .HasOne(item => item.List)
            .WithMany()
            .HasForeignKey(item => item.ListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(item => item.Movie)
            .WithMany()
            .HasForeignKey(item => item.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(item => item.Series)
            .WithMany()
            .HasForeignKey(item => item.SeriesId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
