using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260607021000_AllowDecimalUserRatings")]
    public partial class AllowDecimalUserRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "rating",
                table: "user_media_items",
                type: "numeric(3,1)",
                precision: 3,
                scale: 1,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "rating_snapshot",
                table: "reviews",
                type: "numeric(3,1)",
                precision: 3,
                scale: 1,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "rating",
                table: "user_media_items",
                type: "integer",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(3,1)",
                oldPrecision: 3,
                oldScale: 1,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "rating_snapshot",
                table: "reviews",
                type: "integer",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(3,1)",
                oldPrecision: 3,
                oldScale: 1,
                oldNullable: true);
        }
    }
}
