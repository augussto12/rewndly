using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieSys.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "genres",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_genres", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "movies",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    original_title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    overview = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    poster_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    backdrop_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    release_date = table.Column<DateOnly>(type: "date", nullable: true),
                    runtime_minutes = table.Column<int>(type: "integer", nullable: true),
                    original_language = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: true),
                    popularity = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: true),
                    vote_average = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    last_synced_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_movies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "series",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tmdb_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    original_name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    overview = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    poster_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    backdrop_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    first_air_date = table.Column<DateOnly>(type: "date", nullable: true),
                    last_air_date = table.Column<DateOnly>(type: "date", nullable: true),
                    number_of_seasons = table.Column<int>(type: "integer", nullable: true),
                    number_of_episodes = table.Column<int>(type: "integer", nullable: true),
                    original_language = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: true),
                    popularity = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: true),
                    vote_average = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    last_synced_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_series", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    username = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    display_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    bio = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    email_verified_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    is_disabled = table.Column<bool>(type: "boolean", nullable: false),
                    disabled_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    disabled_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    disable_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    deleted_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    last_login_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.CheckConstraint("ck_users_email_not_empty", "length(email) > 0");
                    table.CheckConstraint("ck_users_username_not_empty", "length(username) > 0");
                    table.ForeignKey(
                        name: "fk_users_users_deleted_by_admin_id",
                        column: x => x.deleted_by_admin_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_users_users_disabled_by_admin_id",
                        column: x => x.disabled_by_admin_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "movie_genres",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    movie_id = table.Column<Guid>(type: "uuid", nullable: false),
                    genre_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_movie_genres", x => x.id);
                    table.ForeignKey(
                        name: "fk_movie_genres_genres_genre_id",
                        column: x => x.genre_id,
                        principalTable: "genres",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_movie_genres_movies_movie_id",
                        column: x => x.movie_id,
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "series_genres",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    genre_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_series_genres", x => x.id);
                    table.ForeignKey(
                        name: "fk_series_genres_genres_genre_id",
                        column: x => x.genre_id,
                        principalTable: "genres",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_series_genres_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "activity_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    movie_id = table.Column<Guid>(type: "uuid", nullable: true),
                    series_id = table.Column<Guid>(type: "uuid", nullable: true),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_activity_events", x => x.id);
                    table.CheckConstraint("ck_activity_events_optional_media", "((movie_id IS NULL AND series_id IS NULL AND media_type IS NULL) OR (movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
                    table.ForeignKey(
                        name: "fk_activity_events_movies_movie_id",
                        column: x => x.movie_id,
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_activity_events_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_activity_events_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "admin_audit_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    admin_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    target_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_admin_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_admin_audit_logs_users_admin_user_id",
                        column: x => x.admin_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "email_verification_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_by_ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email_verification_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_email_verification_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "friendships",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    requester_id = table.Column<Guid>(type: "uuid", nullable: false),
                    receiver_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_friendships", x => x.id);
                    table.CheckConstraint("ck_friendships_not_self", "requester_id <> receiver_id");
                    table.ForeignKey(
                        name: "fk_friendships_users_receiver_id",
                        column: x => x.receiver_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_friendships_users_requester_id",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lists",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lists", x => x.id);
                    table.ForeignKey(
                        name: "fk_lists_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    requested_by_ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    used_by_ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_password_reset_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_password_reset_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    replaced_by_token_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    revoked_by_ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_refresh_tokens_refresh_tokens_replaced_by_token_id",
                        column: x => x.replaced_by_token_id,
                        principalTable: "refresh_tokens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    movie_id = table.Column<Guid>(type: "uuid", nullable: true),
                    series_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rating_snapshot = table.Column<int>(type: "integer", nullable: true),
                    title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    body = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    contains_spoilers = table.Column<bool>(type: "boolean", nullable: false),
                    visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reviews", x => x.id);
                    table.CheckConstraint("ck_reviews_one_media", "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
                    table.CheckConstraint("ck_reviews_rating_snapshot_range", "(rating_snapshot IS NULL OR (rating_snapshot >= 1 AND rating_snapshot <= 10))");
                    table.ForeignKey(
                        name: "fk_reviews_movies_movie_id",
                        column: x => x.movie_id,
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_reviews_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_reviews_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "system_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    event_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_system_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_system_events_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_media_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    movie_id = table.Column<Guid>(type: "uuid", nullable: true),
                    series_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_favorite = table.Column<bool>(type: "boolean", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: true),
                    watched_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_media_items", x => x.id);
                    table.CheckConstraint("ck_user_media_items_one_media", "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
                    table.CheckConstraint("ck_user_media_items_rating_range", "(rating IS NULL OR (rating >= 1 AND rating <= 10))");
                    table.ForeignKey(
                        name: "fk_user_media_items_movies_movie_id",
                        column: x => x.movie_id,
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_media_items_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_media_items_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_privacy_settings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    profile_visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    show_activity = table.Column<bool>(type: "boolean", nullable: false),
                    show_stats = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_privacy_settings", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_privacy_settings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "list_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    list_id = table.Column<Guid>(type: "uuid", nullable: false),
                    media_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    movie_id = table.Column<Guid>(type: "uuid", nullable: true),
                    series_id = table.Column<Guid>(type: "uuid", nullable: true),
                    position = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_list_items", x => x.id);
                    table.CheckConstraint("ck_list_items_one_media", "((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))");
                    table.ForeignKey(
                        name: "fk_list_items_lists_list_id",
                        column: x => x.list_id,
                        principalTable: "lists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_list_items_movies_movie_id",
                        column: x => x.movie_id,
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_list_items_series_series_id",
                        column: x => x.series_id,
                        principalTable: "series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_activity_events_created_at",
                table: "activity_events",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_activity_events_event_type",
                table: "activity_events",
                column: "event_type");

            migrationBuilder.CreateIndex(
                name: "ix_activity_events_movie_id",
                table: "activity_events",
                column: "movie_id");

            migrationBuilder.CreateIndex(
                name: "ix_activity_events_series_id",
                table: "activity_events",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "ix_activity_events_user_id",
                table: "activity_events",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_admin_audit_logs_action",
                table: "admin_audit_logs",
                column: "action");

            migrationBuilder.CreateIndex(
                name: "ix_admin_audit_logs_admin_user_id",
                table: "admin_audit_logs",
                column: "admin_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_admin_audit_logs_created_at",
                table: "admin_audit_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_admin_audit_logs_target_type_target_id",
                table: "admin_audit_logs",
                columns: new[] { "target_type", "target_id" });

            migrationBuilder.CreateIndex(
                name: "ix_email_verification_tokens_expires_at",
                table: "email_verification_tokens",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_email_verification_tokens_token_hash",
                table: "email_verification_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_email_verification_tokens_user_id",
                table: "email_verification_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_friendships_receiver_id",
                table: "friendships",
                column: "receiver_id");

            migrationBuilder.CreateIndex(
                name: "ix_friendships_requester_id",
                table: "friendships",
                column: "requester_id");

            migrationBuilder.CreateIndex(
                name: "ix_friendships_requester_id_receiver_id",
                table: "friendships",
                columns: new[] { "requester_id", "receiver_id" },
                unique: true);

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX ux_friendships_unordered_pair
                ON friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
                """);

            migrationBuilder.CreateIndex(
                name: "ix_genres_tmdb_id_media_type",
                table: "genres",
                columns: new[] { "tmdb_id", "media_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_list_items_list_id",
                table: "list_items",
                column: "list_id");

            migrationBuilder.CreateIndex(
                name: "ix_list_items_list_id_movie_id",
                table: "list_items",
                columns: new[] { "list_id", "movie_id" },
                unique: true,
                filter: "movie_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_list_items_list_id_series_id",
                table: "list_items",
                columns: new[] { "list_id", "series_id" },
                unique: true,
                filter: "series_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_list_items_movie_id",
                table: "list_items",
                column: "movie_id");

            migrationBuilder.CreateIndex(
                name: "ix_list_items_series_id",
                table: "list_items",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "ix_lists_is_deleted",
                table: "lists",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_lists_user_id",
                table: "lists",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_lists_visibility",
                table: "lists",
                column: "visibility");

            migrationBuilder.CreateIndex(
                name: "ix_movie_genres_genre_id",
                table: "movie_genres",
                column: "genre_id");

            migrationBuilder.CreateIndex(
                name: "ix_movie_genres_movie_id_genre_id",
                table: "movie_genres",
                columns: new[] { "movie_id", "genre_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_movies_release_date",
                table: "movies",
                column: "release_date");

            migrationBuilder.CreateIndex(
                name: "ix_movies_title",
                table: "movies",
                column: "title");

            migrationBuilder.CreateIndex(
                name: "ix_movies_tmdb_id",
                table: "movies",
                column: "tmdb_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_password_reset_tokens_expires_at",
                table: "password_reset_tokens",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_password_reset_tokens_token_hash",
                table: "password_reset_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_password_reset_tokens_user_id",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_expires_at",
                table: "refresh_tokens",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_replaced_by_token_id",
                table: "refresh_tokens",
                column: "replaced_by_token_id");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_revoked_at",
                table: "refresh_tokens",
                column: "revoked_at");

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_token_hash",
                table: "refresh_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_user_id",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_created_at",
                table: "reviews",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_is_deleted",
                table: "reviews",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_movie_id",
                table: "reviews",
                column: "movie_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_series_id",
                table: "reviews",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_user_id",
                table: "reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_reviews_visibility",
                table: "reviews",
                column: "visibility");

            migrationBuilder.CreateIndex(
                name: "ix_series_first_air_date",
                table: "series",
                column: "first_air_date");

            migrationBuilder.CreateIndex(
                name: "ix_series_name",
                table: "series",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_series_tmdb_id",
                table: "series",
                column: "tmdb_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_series_genres_genre_id",
                table: "series_genres",
                column: "genre_id");

            migrationBuilder.CreateIndex(
                name: "ix_series_genres_series_id_genre_id",
                table: "series_genres",
                columns: new[] { "series_id", "genre_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_system_events_created_at",
                table: "system_events",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_system_events_entity_type_entity_id",
                table: "system_events",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_system_events_event_type",
                table: "system_events",
                column: "event_type");

            migrationBuilder.CreateIndex(
                name: "ix_system_events_user_id",
                table: "system_events",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_movie_id",
                table: "user_media_items",
                column: "movie_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_series_id",
                table: "user_media_items",
                column: "series_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_status",
                table: "user_media_items",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_user_id",
                table: "user_media_items",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_user_id_movie_id",
                table: "user_media_items",
                columns: new[] { "user_id", "movie_id" },
                unique: true,
                filter: "movie_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_user_media_items_user_id_series_id",
                table: "user_media_items",
                columns: new[] { "user_id", "series_id" },
                unique: true,
                filter: "series_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_user_privacy_settings_user_id",
                table: "user_privacy_settings",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_deleted_by_admin_id",
                table: "users",
                column: "deleted_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_disabled_by_admin_id",
                table: "users",
                column: "disabled_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_is_deleted",
                table: "users",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_users_is_disabled",
                table: "users",
                column: "is_disabled");

            migrationBuilder.CreateIndex(
                name: "ix_users_role",
                table: "users",
                column: "role");

            migrationBuilder.CreateIndex(
                name: "ix_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activity_events");

            migrationBuilder.Sql("DROP INDEX IF EXISTS ux_friendships_unordered_pair;");

            migrationBuilder.DropTable(
                name: "admin_audit_logs");

            migrationBuilder.DropTable(
                name: "email_verification_tokens");

            migrationBuilder.DropTable(
                name: "friendships");

            migrationBuilder.DropTable(
                name: "list_items");

            migrationBuilder.DropTable(
                name: "movie_genres");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "series_genres");

            migrationBuilder.DropTable(
                name: "system_events");

            migrationBuilder.DropTable(
                name: "user_media_items");

            migrationBuilder.DropTable(
                name: "user_privacy_settings");

            migrationBuilder.DropTable(
                name: "lists");

            migrationBuilder.DropTable(
                name: "genres");

            migrationBuilder.DropTable(
                name: "movies");

            migrationBuilder.DropTable(
                name: "series");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
