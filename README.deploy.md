# Rewndly VPS Trial Deploy With Nginx Proxy Manager

This runbook prepares a controlled trial deploy. It does not approve final production.

`MovieSys` remains the internal technical name for services, images, database names and .NET namespaces.

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
Database: moviesys_db
User: moviesys_user
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
