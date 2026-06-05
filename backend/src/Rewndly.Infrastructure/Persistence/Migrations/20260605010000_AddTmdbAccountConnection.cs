using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTmdbAccountConnection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tmdb_account_connections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tmdb_account_id = table.Column<int>(type: "integer", nullable: false),
                    username = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    display_name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    protected_session_id = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    connected_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    last_synced_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tmdb_account_connections", x => x.id);
                    table.ForeignKey(
                        name: "fk_tmdb_account_connections_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tmdb_auth_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_token_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tmdb_auth_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_tmdb_auth_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_account_connections_revoked_at",
                table: "tmdb_account_connections",
                column: "revoked_at");

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_account_connections_tmdb_account_id",
                table: "tmdb_account_connections",
                column: "tmdb_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_account_connections_user_id",
                table: "tmdb_account_connections",
                column: "user_id",
                unique: true,
                filter: "revoked_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_auth_requests_expires_at",
                table: "tmdb_auth_requests",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_auth_requests_request_token_hash",
                table: "tmdb_auth_requests",
                column: "request_token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_auth_requests_used_at",
                table: "tmdb_auth_requests",
                column: "used_at");

            migrationBuilder.CreateIndex(
                name: "ix_tmdb_auth_requests_user_id",
                table: "tmdb_auth_requests",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tmdb_account_connections");

            migrationBuilder.DropTable(
                name: "tmdb_auth_requests");
        }
    }
}
