# Rewndly VPS Trial Deploy

This guide prepares a controlled VPS trial deploy. It is not a final production approval.

Do not paste real secrets into chat and do not commit `.env.production`.

Current status: Fase 10 is approved as preparation only. Rewndly is ready for a controlled trial deploy, but the real remote VPS deploy is paused until explicit approval. Fase 10B and final production remain pending.

Public product name:

```txt
Rewndly
```

Public domain:

```txt
rewndly.com
```

Technical internal name kept for now:

```txt
MovieSys
```

## Deployment Strategy

```txt
Public project name: Rewndly
Internal compose/service name on VPS: moviesys
Suggested directory: /opt/rewndly
Compose file with bundled reverse proxy: docker-compose.vps.yml
Compose file for existing Nginx Proxy Manager: docker-compose.npm.yml
PostgreSQL strategy: new dedicated PostgreSQL container and database
Database name: moviesys_db
Database user: moviesys_user
Database exposure: Docker internal network only
Reverse proxy: Nginx Proxy Manager when already installed, otherwise bundled Nginx container
Frontend: static React build served by Nginx container
Backend: ASP.NET Core container on internal port 8080
```

Recommended DNS:

```txt
Frontend and API behind same origin: https://rewndly.com
API paths proxied under: /api/*
Health path proxied under: /health
```

Same-origin proxying allows `SameSite=Lax` cookies and strict CORS to the frontend domain.

## Required Files

```txt
docker-compose.vps.yml
docker-compose.npm.yml
.env.production
README.deploy.md
nginx/moviesys.conf
frontend/nginx.frontend.npm.conf
scripts/deploy.sh
scripts/deploy-npm.sh
scripts/run-migrations.sh
scripts/seed-admin.sh
scripts/backup-db.sh
scripts/restore-db.sh
```

## Required Variables

Create `.env.production` on the VPS from `.env.production.example`.

Required:

```txt
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=
Jwt__Secret=
Jwt__Issuer=
Jwt__Audience=
Cors__AllowedOrigins__0=
Cookie__Domain=
TMDB_ACCESS_TOKEN=
MOVIESYS_ADMIN_USERNAME=
MOVIESYS_ADMIN_EMAIL=
MOVIESYS_ADMIN_INITIAL_PASSWORD=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Optional:

```txt
Tmdb__AccessToken=
Tmdb__ApiKey=
Mail__Provider=
Mail__ApiKey=
Cookie__SameSite=Lax
```

## First Deploy

On the VPS:

```bash
sudo mkdir -p /opt/rewndly
sudo chown "$USER":"$USER" /opt/rewndly
cd /opt/rewndly
```

Copy the repository files into `/opt/rewndly`, then:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production` on the server. Use strong real values. Do not use `Admin123!`.

If DNS is ready for Rewndly, edit `nginx/moviesys.conf` and replace `server_name _;` with:

```nginx
server_name rewndly.com;
```

Deploy:

```bash
chmod +x scripts/*.sh
scripts/deploy.sh
```

## Deploy With Nginx Proxy Manager

Use this path when NPM is already installed and manages Cloudflare, certificates and public HTTPS.

The recommended project directory remains:

```bash
/opt/rewndly
```

The NPM compose variant:

```txt
docker-compose.npm.yml
```

Network and exposure strategy:

```txt
PostgreSQL: internal Docker network only
API: internal Docker network only, port 8080 not published
Frontend: published only on 127.0.0.1:18080 by default
NPM target: http://127.0.0.1:18080
Public domain: https://rewndly.com
API public path: https://rewndly.com/api/*
```

This keeps the browser same-origin and lets the frontend Nginx container proxy `/api/*` to the API container privately.

Set these values in `.env.production`:

```txt
FRONTEND_HTTP_BIND=127.0.0.1
FRONTEND_HTTP_PORT=18080
VITE_API_BASE_URL=
Cors__AllowedOrigins__0=https://rewndly.com
Cookie__SameSite=Lax
```

Deploy:

```bash
chmod +x scripts/*.sh
scripts/deploy-npm.sh
```

Equivalent explicit command:

```bash
COMPOSE_FILE=docker-compose.npm.yml scripts/deploy-npm.sh
```

In Nginx Proxy Manager create a Proxy Host:

```txt
Domain Names: rewndly.com
Scheme: http
Forward Hostname / IP: 127.0.0.1
Forward Port: 18080
Websockets Support: off
Block Common Exploits: on
Access List: public or a temporary allowlist for trial
SSL Certificate: managed by NPM
Force SSL: on
HTTP/2 Support: on
```

Optional `www` host:

```txt
www.rewndly.com -> rewndly.com redirect in NPM
```

Do not add a separate public NPM host for the API unless there is a future cross-origin requirement.

### Cloudflare Notes

Configure DNS outside this repository:

```txt
A record: rewndly.com -> VPS public IPv4
CNAME or A record: www -> rewndly.com or VPS public IPv4
Proxy: optional during trial
SSL/TLS: Full, or Full strict when NPM has a valid origin certificate
```

Wait for DNS propagation before requesting certificates in NPM.

### VPS Discovery Checklist

Run these on the VPS and keep secrets out of shared output:

```bash
pwd
ls -la
docker ps
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
docker network ls
docker compose ls
find /opt -maxdepth 3 -type f \( -name "docker-compose*.yml" -o -name ".env.production" \) 2>/dev/null
```

Useful non-sensitive info to paste later:

```txt
Docker/NPM container names
Docker network names
Whether /opt/rewndly exists
Whether port 18080 is free
High-level error messages without secrets
```

Never paste:

```txt
.env.production contents
JWT secrets
TMDB tokens
Database passwords
Admin initial password
Cloudflare tokens
NPM login/session cookies
```

## Controlled Migration

Migrations use the published migrator:

```bash
scripts/run-migrations.sh
```

Equivalent compose command:

```bash
docker compose -f docker-compose.vps.yml --env-file .env.production --profile ops run --rm migrator
```

The migrator executes:

```txt
dotnet /app/tools/dbmigrator/MovieSys.DbMigrator.dll
```

## Production-Safe Admin Seed

Do not use `backend/database/seeds/seed_dev_admin.sql`.

Use:

```bash
scripts/seed-admin.sh
```

The seeder:

```txt
Reads MOVIESYS_ADMIN_USERNAME, MOVIESYS_ADMIN_EMAIL and MOVIESYS_ADMIN_INITIAL_PASSWORD
Refuses Admin123!
Requires a 16+ character initial password
Does not overwrite existing users
Creates role Admin
Sets must_change_password=true
Creates private privacy settings
Writes a system_event bootstrap record without secrets
```

## Backups

Create a backup:

```bash
scripts/backup-db.sh
```

Restore a backup:

```bash
scripts/restore-db.sh backups/moviesys_YYYYMMDD_HHMMSS.dump
```

Store backup copies outside the VPS as part of the final production plan.

## Post-Deploy Smoke Tests

From the VPS or your workstation:

```bash
curl -i https://rewndly.com/health
curl -i https://rewndly.com/api/system/status
curl -i https://rewndly.com/api/public/home
```

Auth and admin smoke:

```txt
POST /api/auth/login
GET /api/auth/me
GET /api/admin/dashboard
```

If TMDB token is loaded:

```txt
GET /api/movies/search?query=matrix
GET /api/series/search?query=breaking
```

Frontend smoke:

```txt
Open home
Login Colucho
Enter admin
Search movie
Create normal user
```

## Security Checklist

```txt
HTTPS enabled before public access
CORS restricted to the frontend domain
Refresh cookie HttpOnly and Secure in Production
SameSite=Lax for same-origin proxy, None only for cross-site HTTPS
Strong JWT secret
Strong one-time admin password
must_change_password=true for bootstrap admin
Swagger unavailable publicly in Production
.env.production not committed
PostgreSQL not exposed publicly
DB uses a dedicated user with a dedicated database
Backups script tested
TMDB token only server-side
No real secrets in repository files
TMDB application/domain should use Rewndly and rewndly.com
```

## Known Pending Before Final Production

```txt
EF query-filter warnings with required relationships
Persistent/protected ASP.NET Data Protection keys
Real Mailgun or email provider
TMDB validation with real token
Automated backup schedule and off-server retention
Monitoring and alerting
Centralized logs
Secret rotation procedure
Final security review
```

## Rollback

Stop the trial deploy:

```bash
docker compose -f docker-compose.vps.yml --env-file .env.production down
```

Restore a previous DB backup if needed:

```bash
scripts/restore-db.sh backups/previous.dump
```
