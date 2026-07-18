using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCloudflareDailySnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cloudflare_daily_snapshots",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    requests = table.Column<long>(type: "bigint", nullable: false),
                    page_views = table.Column<long>(type: "bigint", nullable: false),
                    uniques = table.Column<long>(type: "bigint", nullable: false),
                    bytes = table.Column<long>(type: "bigint", nullable: false),
                    threats = table.Column<long>(type: "bigint", nullable: false),
                    human_visits = table.Column<long>(type: "bigint", nullable: true),
                    human_page_views = table.Column<long>(type: "bigint", nullable: true),
                    fetched_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cloudflare_daily_snapshots", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_cloudflare_daily_snapshots_date",
                table: "cloudflare_daily_snapshots",
                column: "date",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cloudflare_daily_snapshots");
        }
    }
}
