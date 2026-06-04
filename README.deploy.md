# Rewndly VPS Trial Deploy With Nginx Proxy Manager

This runbook prepares a controlled trial deploy. It does not approve final production.

`Rewndly` is the technical name for services, images, database names and .NET namespaces.

## Target Layout

```txt
/opt/rewndly
  docker-compose.npm.yml
  .env.production
  scripts/
  nginx/
  frontend/
  backend/
  backups/
```

Use a dedicated PostgreSQL database:

```txt
Database: rewndly_db
Migration/bootstrap user: rewndly_owner
Runtime app user: rewndly_app
Exposure: Docker internal network only
```

## NPM Strategy

Nginx Proxy Manager owns public HTTP/HTTPS, certificates and Cloudflare-facing configuration.

Rewndly exposes only the frontend container on loopback:

```txt
http://127.0.0.1:18080
```

The frontend Nginx container serves the React app and proxies:

```txt
/api/* -> api:8080/api/*
/health -> api:8080/health
```

NPM Proxy Host:

```txt
Domain Names: rewndly.com
Scheme: http
Forward Hostname / IP: 127.0.0.1
Forward Port: 18080
Websockets Support: off
Block Common Exploits: on
Force SSL: on
HTTP/2 Support: on
```

## Database Users and Least Privilege

The PostgreSQL container initializes with the owner/bootstrap user:

```txt
POSTGRES_OWNER_USER=rewndly_owner
POSTGRES_OWNER_PASSWORD=...
```

The runtime user is created by `backend/database/init/02_create_app_user_and_grants.sh`:

```txt
REWNDLY_APP_DB_USER=rewndly_app
REWNDLY_APP_DB_PASSWORD=...
```

Connection strings:

```txt
MigrationConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=rewndly_db;Username=rewndly_owner;Password=...
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=rewndly_db;Username=rewndly_app;Password=...
```

Container usage:

```txt
Rewndly.DbMigrator -> MigrationConnectionStrings__DefaultConnection
Rewndly.Api        -> ConnectionStrings__DefaultConnection
Rewndly.AdminSeeder -> ConnectionStrings__DefaultConnection
```

Do not run the API with owner/bootstrap credentials.

If the PostgreSQL volume already exists, Docker init scripts will not re-run. For a fresh trial deploy, start with a new project volume. For an existing volume, run equivalent grants manually using the owner user.

Verify app user:

```bash
docker compose -f docker-compose.npm.yml --env-file .env.production exec -T postgres \
  sh -c 'PGPASSWORD="$REWNDLY_APP_DB_PASSWORD" psql -h localhost -U "$REWNDLY_APP_DB_USER" -d "$POSTGRES_DB" -c "select current_user;"'
```

Verify the app user cannot create schema objects:

```bash
docker compose -f docker-compose.npm.yml --env-file .env.production exec -T postgres \
  sh -c 'PGPASSWORD="$REWNDLY_APP_DB_PASSWORD" psql -h localhost -U "$REWNDLY_APP_DB_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "create table should_fail(id int);"'
```

Expected result:

```txt
ERROR: permission denied for schema public
```

## Commands

```bash
sudo mkdir -p /opt/rewndly
sudo chown "$USER":"$USER" /opt/rewndly
cd /opt/rewndly
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` on the VPS only. Do not commit it and do not paste it into chat.

Deploy:

```bash
chmod +x scripts/*.sh
scripts/deploy-npm.sh
```

Run migrations only:

```bash
COMPOSE_FILE=docker-compose.npm.yml scripts/run-migrations.sh
```

Run admin seed only:

```bash
COMPOSE_FILE=docker-compose.npm.yml scripts/seed-admin.sh
```

Backup:

```bash
COMPOSE_FILE=docker-compose.npm.yml scripts/backup-db.sh
```

## Smoke Tests

```bash
curl -i https://rewndly.com/health
curl -i https://rewndly.com/api/system/status
curl -i https://rewndly.com/api/public/home
```

Then test login, `/api/auth/me`, `/api/admin/dashboard`, movie search and the Rewndly frontend.

## Share Later

Safe to share:

```txt
docker ps names/status/ports
docker network ls names
docker compose ls
non-secret error messages
```

Do not share:

```txt
.env.production
JWT secrets
TMDB tokens
database passwords
admin initial password
Cloudflare or NPM credentials
```
