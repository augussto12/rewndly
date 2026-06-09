using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260608023000_AddExternalMediaRankings")]
    public partial class AddExternalMediaRankings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "external_media_ranking_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ranking_key = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    rank = table.Column<int>(type: "integer", nullable: false),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    overview = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    poster_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    backdrop_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    release_date = table.Column<DateOnly>(type: "date", nullable: true),
                    vote_average = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    ranking_score = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    fetched_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_external_media_ranking_items", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_external_media_ranking_items_media_type_ranking_key_expires",
                table: "external_media_ranking_items",
                columns: new[] { "media_type", "ranking_key", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "ix_external_media_ranking_items_media_type_ranking_key_rank",
                table: "external_media_ranking_items",
                columns: new[] { "media_type", "ranking_key", "rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_external_media_ranking_items_media_type_ranking_key_tmdb_id",
                table: "external_media_ranking_items",
                columns: new[] { "media_type", "ranking_key", "tmdb_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "external_media_ranking_items");
        }
    }
}
