using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Media;

namespace Rewndly.Infrastructure.Persistence.Configurations;

public sealed class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.ToTable("movies");

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();

        builder.Property(movie => movie.Title).HasMaxLength(300).IsRequired();
        builder.Property(movie => movie.OriginalTitle).HasMaxLength(300);
        builder.Property(movie => movie.Overview).HasMaxLength(4000);
        builder.Property(movie => movie.PosterPath).HasMaxLength(500);
        builder.Property(movie => movie.BackdropPath).HasMaxLength(500);
        builder.Property(movie => movie.OriginalLanguage).HasMaxLength(12);
        builder.Property(movie => movie.Popularity).HasPrecision(18, 6);
        builder.Property(movie => movie.VoteAverage).HasPrecision(4, 2);
        builder.Property(movie => movie.LastSyncedAt).HasPrecision(3);

        builder.HasIndex(movie => movie.TmdbId).IsUnique();
        builder.HasIndex(movie => movie.Title);
        builder.HasIndex(movie => movie.ReleaseDate);
    }
}

public sealed class SeriesConfiguration : IEntityTypeConfiguration<Series>
{
    public void Configure(EntityTypeBuilder<Series> builder)
    {
        builder.ToTable("series");

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();

        builder.Property(series => series.Name).HasMaxLength(300).IsRequired();
        builder.Property(series => series.OriginalName).HasMaxLength(300);
        builder.Property(series => series.Overview).HasMaxLength(4000);
        builder.Property(series => series.PosterPath).HasMaxLength(500);
        builder.Property(series => series.BackdropPath).HasMaxLength(500);
        builder.Property(series => series.OriginalLanguage).HasMaxLength(12);
        builder.Property(series => series.Popularity).HasPrecision(18, 6);
        builder.Property(series => series.VoteAverage).HasPrecision(4, 2);
        builder.Property(series => series.LastSyncedAt).HasPrecision(3);

        builder.HasIndex(series => series.TmdbId).IsUnique();
        builder.HasIndex(series => series.Name);
        builder.HasIndex(series => series.FirstAirDate);
    }
}

public sealed class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("genres");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(genre => genre.Name).HasMaxLength(120).IsRequired();
        builder.Property(genre => genre.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(genre => new { genre.TmdbId, genre.MediaType }).IsUnique();
    }
}

public sealed class ExternalMediaRatingConfiguration : IEntityTypeConfiguration<ExternalMediaRating>
{
    public void Configure(EntityTypeBuilder<ExternalMediaRating> builder)
    {
        builder.ToTable("external_media_ratings");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(rating => rating.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(rating => rating.Source).HasMaxLength(40).IsRequired();
        builder.Property(rating => rating.Value).HasPrecision(6, 2);
        builder.Property(rating => rating.Scale).HasPrecision(6, 2);
        builder.Property(rating => rating.FetchedAt).HasPrecision(3).IsRequired();
        builder.Property(rating => rating.ExpiresAt).HasPrecision(3).IsRequired();

        builder.HasIndex(rating => new { rating.MediaType, rating.TmdbId, rating.Source }).IsUnique();
        builder.HasIndex(rating => new { rating.MediaType, rating.TmdbId, rating.ExpiresAt });
    }
}

public sealed class ExternalMediaRankingItemConfiguration : IEntityTypeConfiguration<ExternalMediaRankingItem>
{
    public void Configure(EntityTypeBuilder<ExternalMediaRankingItem> builder)
    {
        builder.ToTable("external_media_ranking_items");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(item => item.MediaType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(item => item.RankingKey).HasMaxLength(40).IsRequired();
        builder.Property(item => item.Title).HasMaxLength(300).IsRequired();
        builder.Property(item => item.Overview).HasMaxLength(4000);
        builder.Property(item => item.PosterUrl).HasMaxLength(500);
        builder.Property(item => item.BackdropUrl).HasMaxLength(500);
        builder.Property(item => item.VoteAverage).HasPrecision(4, 2);
        builder.Property(item => item.RankingScore).HasPrecision(8, 2);
        builder.Property(item => item.FetchedAt).HasPrecision(3).IsRequired();
        builder.Property(item => item.ExpiresAt).HasPrecision(3).IsRequired();

        builder.HasIndex(item => new { item.MediaType, item.RankingKey, item.Rank }).IsUnique();
        builder.HasIndex(item => new { item.MediaType, item.RankingKey, item.TmdbId }).IsUnique();
        builder.HasIndex(item => new { item.MediaType, item.RankingKey, item.ExpiresAt });
    }
}

public sealed class MovieGenreConfiguration : IEntityTypeConfiguration<MovieGenre>
{
    public void Configure(EntityTypeBuilder<MovieGenre> builder)
    {
        builder.ToTable("movie_genres");

        builder.ConfigureUuidPrimaryKey();

        builder.HasIndex(movieGenre => new { movieGenre.MovieId, movieGenre.GenreId }).IsUnique();

        builder
            .HasOne(movieGenre => movieGenre.Movie)
            .WithMany()
            .HasForeignKey(movieGenre => movieGenre.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(movieGenre => movieGenre.Genre)
            .WithMany()
            .HasForeignKey(movieGenre => movieGenre.GenreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class SeriesGenreConfiguration : IEntityTypeConfiguration<SeriesGenre>
{
    public void Configure(EntityTypeBuilder<SeriesGenre> builder)
    {
        builder.ToTable("series_genres");

        builder.ConfigureUuidPrimaryKey();

        builder.HasIndex(seriesGenre => new { seriesGenre.SeriesId, seriesGenre.GenreId }).IsUnique();

        builder
            .HasOne(seriesGenre => seriesGenre.Series)
            .WithMany()
            .HasForeignKey(seriesGenre => seriesGenre.SeriesId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(seriesGenre => seriesGenre.Genre)
            .WithMany()
            .HasForeignKey(seriesGenre => seriesGenre.GenreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
