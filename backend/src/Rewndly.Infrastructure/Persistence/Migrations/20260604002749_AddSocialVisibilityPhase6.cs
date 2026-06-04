using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialVisibilityPhase6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "friendship_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    requester_id = table.Column<Guid>(type: "uuid", nullable: false),
                    receiver_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_friendship_requests", x => x.id);
                    table.CheckConstraint("ck_friendship_requests_not_self", "requester_id <> receiver_id");
                    table.ForeignKey(
                        name: "fk_friendship_requests_users_receiver_id",
                        column: x => x.receiver_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_friendship_requests_users_requester_id",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_friendship_requests_receiver_id",
                table: "friendship_requests",
                column: "receiver_id");

            migrationBuilder.CreateIndex(
                name: "ix_friendship_requests_requester_id",
                table: "friendship_requests",
                column: "requester_id");

            migrationBuilder.CreateIndex(
                name: "ix_friendship_requests_requester_id_receiver_id",
                table: "friendship_requests",
                columns: new[] { "requester_id", "receiver_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "friendship_requests");
        }
    }
}
