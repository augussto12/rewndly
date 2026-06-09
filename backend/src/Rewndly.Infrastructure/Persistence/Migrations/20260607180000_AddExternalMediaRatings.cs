using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260607180000_AddExternalMediaRatings")]
    public partial class AddExternalMediaRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "external_media_ratings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    source = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    value = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    votes = table.Column<int>(type: "integer", nullable: true),
                    scale = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    fetched_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_external_media_ratings", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_external_media_ratings_media_type_tmdb_id_expires_at",
                table: "external_media_ratings",
                columns: new[] { "media_type", "tmdb_id", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "ix_external_media_ratings_media_type_tmdb_id_source",
                table: "external_media_ratings",
                columns: new[] { "media_type", "tmdb_id", "source" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "external_media_ratings");
        }
    }
}
