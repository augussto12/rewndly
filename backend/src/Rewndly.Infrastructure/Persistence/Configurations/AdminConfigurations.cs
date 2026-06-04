using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Admin;

namespace Rewndly.Infrastructure.Persistence.Configurations;

public sealed class AdminAuditLogConfiguration : IEntityTypeConfiguration<AdminAuditLog>
{
    public void Configure(EntityTypeBuilder<AdminAuditLog> builder)
    {
        builder.ToTable("admin_audit_logs");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(log => log.Action).HasConversion<string>().HasMaxLength(80).IsRequired();
        builder.Property(log => log.TargetType).HasMaxLength(80).IsRequired();
        builder.Property(log => log.Reason).HasMaxLength(1000);
        builder.Property(log => log.IpAddress).HasMaxLength(64);
        builder.Property(log => log.UserAgent).HasMaxLength(512);
        builder.Property(log => log.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");

        builder.HasIndex(log => log.AdminUserId);
        builder.HasIndex(log => log.CreatedAt);
        builder.HasIndex(log => log.Action);
        builder.HasIndex(log => new { log.TargetType, log.TargetId });

        builder
            .HasOne(log => log.AdminUser)
            .WithMany()
            .HasForeignKey(log => log.AdminUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
