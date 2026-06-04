using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rewndly.Domain.Common;

namespace Rewndly.Infrastructure.Persistence.Configurations;

internal static class ConfigurationHelpers
{
    public static void ConfigureUuidPrimaryKey<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : Entity
    {
        builder.HasKey(entity => entity.Id);

        builder
            .Property(entity => entity.Id)
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("gen_random_uuid()");
    }

    public static void ConfigureAuditFields<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : class, IAuditableEntity
    {
        builder
            .Property(entity => entity.CreatedAt)
            .HasPrecision(3)
            .HasDefaultValueSql("now()");

        builder
            .Property(entity => entity.UpdatedAt)
            .HasPrecision(3)
            .HasDefaultValueSql("now()");
    }

    public static void ConfigureSoftDeleteFields<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : class, ISoftDeletableEntity
    {
        builder
            .Property(entity => entity.IsDeleted)
            .HasDefaultValue(false);

        builder
            .Property(entity => entity.DeletedAt)
            .HasPrecision(3);
    }
}
