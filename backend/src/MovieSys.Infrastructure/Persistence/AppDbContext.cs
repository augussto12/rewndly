using Microsoft.EntityFrameworkCore;
using MovieSys.Domain.Admin;
using MovieSys.Domain.Events;
using MovieSys.Domain.Friends;
using MovieSys.Domain.Library;
using MovieSys.Domain.Media;
using MovieSys.Domain.Reviews;
using MovieSys.Domain.Users;
using ListEntity = MovieSys.Domain.Lists.List;
using ListItemEntity = MovieSys.Domain.Lists.ListItem;

namespace MovieSys.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<UserPrivacySettings> UserPrivacySettings => Set<UserPrivacySettings>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    public DbSet<Movie> Movies => Set<Movie>();

    public DbSet<Series> Series => Set<Series>();

    public DbSet<Genre> Genres => Set<Genre>();

    public DbSet<MovieGenre> MovieGenres => Set<MovieGenre>();

    public DbSet<SeriesGenre> SeriesGenres => Set<SeriesGenre>();

    public DbSet<UserMediaItem> UserMediaItems => Set<UserMediaItem>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<ListEntity> Lists => Set<ListEntity>();

    public DbSet<ListItemEntity> ListItems => Set<ListItemEntity>();

    public DbSet<Friendship> Friendships => Set<Friendship>();

    public DbSet<FriendshipRequest> FriendshipRequests => Set<FriendshipRequest>();

    public DbSet<ActivityEvent> ActivityEvents => Set<ActivityEvent>();

    public DbSet<SystemEvent> SystemEvents => Set<SystemEvent>();

    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyAuditTimestamps();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is not Domain.Common.IAuditableEntity auditable)
            {
                continue;
            }

            if (entry.State == EntityState.Added)
            {
                auditable.CreatedAt = now;
                auditable.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                auditable.UpdatedAt = now;
            }
        }
    }
}
