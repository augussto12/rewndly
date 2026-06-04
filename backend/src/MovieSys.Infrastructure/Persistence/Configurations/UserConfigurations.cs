using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieSys.Domain.Users;

namespace MovieSys.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", table =>
        {
            table.HasCheckConstraint("ck_users_email_not_empty", "length(email) > 0");
            table.HasCheckConstraint("ck_users_username_not_empty", "length(username) > 0");
        });

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();
        builder.ConfigureSoftDeleteFields();

        builder.HasQueryFilter(user => !user.IsDeleted);

        builder.Property(user => user.Username).HasMaxLength(40).IsRequired();
        builder.Property(user => user.Email).HasMaxLength(256).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
        builder.Property(user => user.DisplayName).HasMaxLength(80).IsRequired();
        builder.Property(user => user.AvatarUrl).HasMaxLength(2048);
        builder.Property(user => user.Bio).HasMaxLength(500);
        builder.Property(user => user.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(user => user.DisableReason).HasMaxLength(500);
        builder.Property(user => user.DeleteReason).HasMaxLength(500);
        builder.Property(user => user.EmailVerifiedAt).HasPrecision(3);
        builder.Property(user => user.DisabledAt).HasPrecision(3);
        builder.Property(user => user.LastLoginAt).HasPrecision(3);

        builder.HasIndex(user => user.Email).IsUnique();
        builder.HasIndex(user => user.Username).IsUnique();
        builder.HasIndex(user => user.Role);
        builder.HasIndex(user => user.IsDeleted);
        builder.HasIndex(user => user.IsDisabled);

        builder
            .HasOne(user => user.DisabledByAdmin)
            .WithMany()
            .HasForeignKey(user => user.DisabledByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(user => user.DeletedByAdmin)
            .WithMany()
            .HasForeignKey(user => user.DeletedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class UserPrivacySettingsConfiguration : IEntityTypeConfiguration<UserPrivacySettings>
{
    public void Configure(EntityTypeBuilder<UserPrivacySettings> builder)
    {
        builder.ToTable("user_privacy_settings");

        builder.ConfigureUuidPrimaryKey();
        builder.ConfigureAuditFields();

        builder
            .Property(settings => settings.ProfileVisibility)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder
            .HasOne(settings => settings.User)
            .WithOne(user => user.PrivacySettings)
            .HasForeignKey<UserPrivacySettings>(settings => settings.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(settings => settings.UserId).IsUnique();
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(token => token.TokenHash).HasMaxLength(512).IsRequired();
        builder.Property(token => token.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");
        builder.Property(token => token.ExpiresAt).HasPrecision(3).IsRequired();
        builder.Property(token => token.RevokedAt).HasPrecision(3);
        builder.Property(token => token.CreatedByIp).HasMaxLength(64);
        builder.Property(token => token.RevokedByIp).HasMaxLength(64);
        builder.Property(token => token.UserAgent).HasMaxLength(512);

        builder.HasIndex(token => token.UserId);
        builder.HasIndex(token => token.TokenHash).IsUnique();
        builder.HasIndex(token => token.ExpiresAt);
        builder.HasIndex(token => token.RevokedAt);

        builder
            .HasOne(token => token.User)
            .WithMany()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(token => token.ReplacedByToken)
            .WithMany()
            .HasForeignKey(token => token.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.ToTable("email_verification_tokens");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(token => token.TokenHash).HasMaxLength(512).IsRequired();
        builder.Property(token => token.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");
        builder.Property(token => token.ExpiresAt).HasPrecision(3).IsRequired();
        builder.Property(token => token.UsedAt).HasPrecision(3);
        builder.Property(token => token.CreatedByIp).HasMaxLength(64);

        builder.HasIndex(token => token.UserId);
        builder.HasIndex(token => token.TokenHash).IsUnique();
        builder.HasIndex(token => token.ExpiresAt);

        builder
            .HasOne(token => token.User)
            .WithMany()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("password_reset_tokens");

        builder.ConfigureUuidPrimaryKey();

        builder.Property(token => token.TokenHash).HasMaxLength(512).IsRequired();
        builder.Property(token => token.CreatedAt).HasPrecision(3).HasDefaultValueSql("now()");
        builder.Property(token => token.ExpiresAt).HasPrecision(3).IsRequired();
        builder.Property(token => token.UsedAt).HasPrecision(3);
        builder.Property(token => token.RequestedByIp).HasMaxLength(64);
        builder.Property(token => token.UsedByIp).HasMaxLength(64);

        builder.HasIndex(token => token.UserId);
        builder.HasIndex(token => token.TokenHash).IsUnique();
        builder.HasIndex(token => token.ExpiresAt);

        builder
            .HasOne(token => token.User)
            .WithMany()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
