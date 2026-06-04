using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Friends;

namespace Rewndly.Infrastructure.Persistence.Configurations;

public sealed class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.ToTable("friendships", table =>
        {
            table.HasCheckConstraint("ck_friendships_not_self", "requester_id <> receiver_id");
        });

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();

        builder.Property(friendship => friendship.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(friendship => friendship.RequesterId);
        builder.HasIndex(friendship => friendship.ReceiverId);
        builder.HasIndex(friendship => new { friendship.RequesterId, friendship.ReceiverId }).IsUnique();

        builder
            .HasOne(friendship => friendship.Requester)
            .WithMany()
            .HasForeignKey(friendship => friendship.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(friendship => friendship.Receiver)
            .WithMany()
            .HasForeignKey(friendship => friendship.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class FriendshipRequestConfiguration : IEntityTypeConfiguration<FriendshipRequest>
{
    public void Configure(EntityTypeBuilder<FriendshipRequest> builder)
    {
        builder.ToTable("friendship_requests", table =>
        {
            table.HasCheckConstraint("ck_friendship_requests_not_self", "requester_id <> receiver_id");
        });

        builder.ConfigureUuidPrimaryKey();

        builder.Property(request => request.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");

        builder.HasIndex(request => request.RequesterId);
        builder.HasIndex(request => request.ReceiverId);
        builder.HasIndex(request => new { request.RequesterId, request.ReceiverId }).IsUnique();

        builder
            .HasOne(request => request.Requester)
            .WithMany()
            .HasForeignKey(request => request.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(request => request.Receiver)
            .WithMany()
            .HasForeignKey(request => request.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
