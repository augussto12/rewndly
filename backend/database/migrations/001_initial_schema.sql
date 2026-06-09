CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL,
    CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id)
);

START TRANSACTION;
CREATE TABLE genres (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tmdb_id integer NOT NULL,
    name character varying(120) NOT NULL,
    media_type character varying(20) NOT NULL,
    CONSTRAINT pk_genres PRIMARY KEY (id)
);

CREATE TABLE external_media_ratings (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    media_type character varying(20) NOT NULL,
    tmdb_id integer NOT NULL,
    source character varying(40) NOT NULL,
    value numeric(6,2),
    votes integer,
    scale numeric(6,2),
    fetched_at timestamp(3) with time zone NOT NULL,
    expires_at timestamp(3) with time zone NOT NULL,
    CONSTRAINT pk_external_media_ratings PRIMARY KEY (id)
);

CREATE TABLE movies (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tmdb_id integer NOT NULL,
    title character varying(300) NOT NULL,
    original_title character varying(300),
    overview character varying(4000),
    poster_path character varying(500),
    backdrop_path character varying(500),
    release_date date,
    runtime_minutes integer,
    original_language character varying(12),
    popularity numeric(18,6),
    vote_average numeric(4,2),
    last_synced_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_movies PRIMARY KEY (id)
);

CREATE TABLE series (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tmdb_id integer NOT NULL,
    name character varying(300) NOT NULL,
    original_name character varying(300),
    overview character varying(4000),
    poster_path character varying(500),
    backdrop_path character varying(500),
    first_air_date date,
    last_air_date date,
    number_of_seasons integer,
    number_of_episodes integer,
    original_language character varying(12),
    popularity numeric(18,6),
    vote_average numeric(4,2),
    last_synced_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_series PRIMARY KEY (id)
);

CREATE TABLE users (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    username character varying(40) NOT NULL,
    email character varying(256) NOT NULL,
    password_hash character varying(512) NOT NULL,
    display_name character varying(80) NOT NULL,
    avatar_url character varying(2048),
    bio character varying(500),
    role character varying(20) NOT NULL,
    must_change_password boolean NOT NULL,
    email_verified_at timestamp(3) with time zone,
    is_disabled boolean NOT NULL,
    disabled_at timestamp(3) with time zone,
    disabled_by_admin_id uuid,
    disable_reason character varying(500),
    is_deleted boolean NOT NULL DEFAULT FALSE,
    deleted_at timestamp(3) with time zone,
    deleted_by_admin_id uuid,
    delete_reason character varying(500),
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    last_login_at timestamp(3) with time zone,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT ck_users_email_not_empty CHECK (length(email) > 0),
    CONSTRAINT ck_users_username_not_empty CHECK (length(username) > 0),
    CONSTRAINT fk_users_users_deleted_by_admin_id FOREIGN KEY (deleted_by_admin_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_users_users_disabled_by_admin_id FOREIGN KEY (disabled_by_admin_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE movie_genres (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    movie_id uuid NOT NULL,
    genre_id uuid NOT NULL,
    CONSTRAINT pk_movie_genres PRIMARY KEY (id),
    CONSTRAINT fk_movie_genres_genres_genre_id FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE RESTRICT,
    CONSTRAINT fk_movie_genres_movies_movie_id FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
);

CREATE TABLE series_genres (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    series_id uuid NOT NULL,
    genre_id uuid NOT NULL,
    CONSTRAINT pk_series_genres PRIMARY KEY (id),
    CONSTRAINT fk_series_genres_genres_genre_id FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE RESTRICT,
    CONSTRAINT fk_series_genres_series_series_id FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE CASCADE
);

CREATE TABLE activity_events (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    event_type character varying(60) NOT NULL,
    media_type character varying(20),
    movie_id uuid,
    series_id uuid,
    metadata_json jsonb,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_activity_events PRIMARY KEY (id),
    CONSTRAINT ck_activity_events_optional_media CHECK (((movie_id IS NULL AND series_id IS NULL AND media_type IS NULL) OR (movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))),
    CONSTRAINT fk_activity_events_movies_movie_id FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE RESTRICT,
    CONSTRAINT fk_activity_events_series_series_id FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE RESTRICT,
    CONSTRAINT fk_activity_events_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE admin_audit_logs (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    admin_user_id uuid NOT NULL,
    action character varying(80) NOT NULL,
    target_type character varying(80) NOT NULL,
    target_id uuid,
    reason character varying(1000),
    ip_address character varying(64),
    user_agent character varying(512),
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_admin_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_admin_audit_logs_users_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE email_verification_tokens (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    token_hash character varying(512) NOT NULL,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    expires_at timestamp(3) with time zone NOT NULL,
    used_at timestamp(3) with time zone,
    created_by_ip character varying(64),
    CONSTRAINT pk_email_verification_tokens PRIMARY KEY (id),
    CONSTRAINT fk_email_verification_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE friendships (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    requester_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_friendships PRIMARY KEY (id),
    CONSTRAINT ck_friendships_not_self CHECK (requester_id <> receiver_id),
    CONSTRAINT fk_friendships_users_receiver_id FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_friendships_users_requester_id FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE lists (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    title character varying(160) NOT NULL,
    description character varying(1000),
    visibility character varying(20) NOT NULL,
    is_deleted boolean NOT NULL DEFAULT FALSE,
    deleted_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_lists PRIMARY KEY (id),
    CONSTRAINT fk_lists_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE password_reset_tokens (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    token_hash character varying(512) NOT NULL,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    expires_at timestamp(3) with time zone NOT NULL,
    used_at timestamp(3) with time zone,
    requested_by_ip character varying(64),
    used_by_ip character varying(64),
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE refresh_tokens (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    token_hash character varying(512) NOT NULL,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    expires_at timestamp(3) with time zone NOT NULL,
    revoked_at timestamp(3) with time zone,
    replaced_by_token_id uuid,
    created_by_ip character varying(64),
    revoked_by_ip character varying(64),
    user_agent character varying(512),
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT fk_refresh_tokens_refresh_tokens_replaced_by_token_id FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens (id) ON DELETE RESTRICT,
    CONSTRAINT fk_refresh_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE reviews (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    media_type character varying(20) NOT NULL,
    movie_id uuid,
    series_id uuid,
    rating_snapshot numeric(3,1),
    title character varying(180) NOT NULL,
    body character varying(8000) NOT NULL,
    contains_spoilers boolean NOT NULL,
    visibility character varying(20) NOT NULL,
    is_deleted boolean NOT NULL DEFAULT FALSE,
    deleted_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_reviews PRIMARY KEY (id),
    CONSTRAINT ck_reviews_one_media CHECK (((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))),
    CONSTRAINT ck_reviews_rating_snapshot_range CHECK ((rating_snapshot IS NULL OR (rating_snapshot >= 1 AND rating_snapshot <= 10))),
    CONSTRAINT fk_reviews_movies_movie_id FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_series_series_id FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE system_events (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid,
    event_type character varying(80) NOT NULL,
    entity_type character varying(80),
    entity_id uuid,
    metadata_json jsonb,
    ip_address character varying(64),
    user_agent character varying(512),
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_system_events PRIMARY KEY (id),
    CONSTRAINT fk_system_events_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE user_media_items (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    media_type character varying(20) NOT NULL,
    movie_id uuid,
    series_id uuid,
    status character varying(30) NOT NULL,
    is_favorite boolean NOT NULL,
    rating numeric(3,1),
    watched_at timestamp(3) with time zone,
    started_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_user_media_items PRIMARY KEY (id),
    CONSTRAINT ck_user_media_items_one_media CHECK (((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))),
    CONSTRAINT ck_user_media_items_rating_range CHECK ((rating IS NULL OR (rating >= 1 AND rating <= 10))),
    CONSTRAINT fk_user_media_items_movies_movie_id FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_media_items_series_series_id FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_media_items_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE user_privacy_settings (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL,
    profile_visibility character varying(20) NOT NULL,
    show_activity boolean NOT NULL,
    show_stats boolean NOT NULL,
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_user_privacy_settings PRIMARY KEY (id),
    CONSTRAINT fk_user_privacy_settings_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE list_items (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    list_id uuid NOT NULL,
    media_type character varying(20) NOT NULL,
    movie_id uuid,
    series_id uuid,
    position integer NOT NULL,
    note character varying(1000),
    created_at timestamp(3) with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT pk_list_items PRIMARY KEY (id),
    CONSTRAINT ck_list_items_one_media CHECK (((movie_id IS NOT NULL AND series_id IS NULL AND media_type = 'Movie') OR (movie_id IS NULL AND series_id IS NOT NULL AND media_type = 'Series'))),
    CONSTRAINT fk_list_items_lists_list_id FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE,
    CONSTRAINT fk_list_items_movies_movie_id FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE RESTRICT,
    CONSTRAINT fk_list_items_series_series_id FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE RESTRICT
);

CREATE INDEX ix_activity_events_created_at ON activity_events (created_at);

CREATE INDEX ix_activity_events_event_type ON activity_events (event_type);

CREATE INDEX ix_activity_events_movie_id ON activity_events (movie_id);

CREATE INDEX ix_activity_events_series_id ON activity_events (series_id);

CREATE INDEX ix_activity_events_user_id ON activity_events (user_id);

CREATE INDEX ix_admin_audit_logs_action ON admin_audit_logs (action);

CREATE INDEX ix_admin_audit_logs_admin_user_id ON admin_audit_logs (admin_user_id);

CREATE INDEX ix_admin_audit_logs_created_at ON admin_audit_logs (created_at);

CREATE INDEX ix_admin_audit_logs_target_type_target_id ON admin_audit_logs (target_type, target_id);

CREATE INDEX ix_email_verification_tokens_expires_at ON email_verification_tokens (expires_at);

CREATE UNIQUE INDEX ix_email_verification_tokens_token_hash ON email_verification_tokens (token_hash);

CREATE INDEX ix_email_verification_tokens_user_id ON email_verification_tokens (user_id);

CREATE INDEX ix_friendships_receiver_id ON friendships (receiver_id);

CREATE INDEX ix_friendships_requester_id ON friendships (requester_id);

CREATE UNIQUE INDEX ix_friendships_requester_id_receiver_id ON friendships (requester_id, receiver_id);

CREATE UNIQUE INDEX ux_friendships_unordered_pair
ON friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

CREATE UNIQUE INDEX ix_genres_tmdb_id_media_type ON genres (tmdb_id, media_type);

CREATE INDEX ix_external_media_ratings_media_type_tmdb_id_expires_at ON external_media_ratings (media_type, tmdb_id, expires_at);

CREATE UNIQUE INDEX ix_external_media_ratings_media_type_tmdb_id_source ON external_media_ratings (media_type, tmdb_id, source);

CREATE INDEX ix_list_items_list_id ON list_items (list_id);

CREATE UNIQUE INDEX ix_list_items_list_id_movie_id ON list_items (list_id, movie_id) WHERE movie_id IS NOT NULL;

CREATE UNIQUE INDEX ix_list_items_list_id_series_id ON list_items (list_id, series_id) WHERE series_id IS NOT NULL;

CREATE INDEX ix_list_items_movie_id ON list_items (movie_id);

CREATE INDEX ix_list_items_series_id ON list_items (series_id);

CREATE INDEX ix_lists_is_deleted ON lists (is_deleted);

CREATE INDEX ix_lists_user_id ON lists (user_id);

CREATE INDEX ix_lists_visibility ON lists (visibility);

CREATE INDEX ix_movie_genres_genre_id ON movie_genres (genre_id);

CREATE UNIQUE INDEX ix_movie_genres_movie_id_genre_id ON movie_genres (movie_id, genre_id);

CREATE INDEX ix_movies_release_date ON movies (release_date);

CREATE INDEX ix_movies_title ON movies (title);

CREATE UNIQUE INDEX ix_movies_tmdb_id ON movies (tmdb_id);

CREATE INDEX ix_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);

CREATE UNIQUE INDEX ix_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);

CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE INDEX ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);

CREATE INDEX ix_refresh_tokens_replaced_by_token_id ON refresh_tokens (replaced_by_token_id);

CREATE INDEX ix_refresh_tokens_revoked_at ON refresh_tokens (revoked_at);

CREATE UNIQUE INDEX ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX ix_reviews_created_at ON reviews (created_at);

CREATE INDEX ix_reviews_is_deleted ON reviews (is_deleted);

CREATE INDEX ix_reviews_movie_id ON reviews (movie_id);

CREATE INDEX ix_reviews_series_id ON reviews (series_id);

CREATE INDEX ix_reviews_user_id ON reviews (user_id);

CREATE INDEX ix_reviews_visibility ON reviews (visibility);

CREATE INDEX ix_series_first_air_date ON series (first_air_date);

CREATE INDEX ix_series_name ON series (name);

CREATE UNIQUE INDEX ix_series_tmdb_id ON series (tmdb_id);

CREATE INDEX ix_series_genres_genre_id ON series_genres (genre_id);

CREATE UNIQUE INDEX ix_series_genres_series_id_genre_id ON series_genres (series_id, genre_id);

CREATE INDEX ix_system_events_created_at ON system_events (created_at);

CREATE INDEX ix_system_events_entity_type_entity_id ON system_events (entity_type, entity_id);

CREATE INDEX ix_system_events_event_type ON system_events (event_type);

CREATE INDEX ix_system_events_user_id ON system_events (user_id);

CREATE INDEX ix_user_media_items_movie_id ON user_media_items (movie_id);

CREATE INDEX ix_user_media_items_series_id ON user_media_items (series_id);

CREATE INDEX ix_user_media_items_status ON user_media_items (status);

CREATE INDEX ix_user_media_items_user_id ON user_media_items (user_id);

CREATE UNIQUE INDEX ix_user_media_items_user_id_movie_id ON user_media_items (user_id, movie_id) WHERE movie_id IS NOT NULL;

CREATE UNIQUE INDEX ix_user_media_items_user_id_series_id ON user_media_items (user_id, series_id) WHERE series_id IS NOT NULL;

CREATE UNIQUE INDEX ix_user_privacy_settings_user_id ON user_privacy_settings (user_id);

CREATE INDEX ix_users_deleted_by_admin_id ON users (deleted_by_admin_id);

CREATE INDEX ix_users_disabled_by_admin_id ON users (disabled_by_admin_id);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_is_deleted ON users (is_deleted);

CREATE INDEX ix_users_is_disabled ON users (is_disabled);

CREATE INDEX ix_users_role ON users (role);

CREATE UNIQUE INDEX ix_users_username ON users (username);

INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
VALUES ('20260603211325_InitialCreate', '9.0.16');

COMMIT;

