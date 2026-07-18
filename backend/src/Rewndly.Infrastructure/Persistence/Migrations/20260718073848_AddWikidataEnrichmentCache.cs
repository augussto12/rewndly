using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWikidataEnrichmentCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wikidata_enrichment_cache",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    entity_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    wikidata_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    awards_json = table.Column<string>(type: "jsonb", nullable: true),
                    bio_extract = table.Column<string>(type: "text", nullable: true),
                    bio_source_title = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    bio_source_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    bio_thumbnail_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    fetched_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wikidata_enrichment_cache", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wikidata_enrichment_cache_entity_type_tmdb_id",
                table: "wikidata_enrichment_cache",
                columns: new[] { "entity_type", "tmdb_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wikidata_enrichment_cache");
        }
    }
}
