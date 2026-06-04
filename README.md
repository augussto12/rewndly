# Rewndly

Rewndly is a cinematic movie and series system with public browsing, registered-user actions, an audited admin dashboard and a future React Native/Expo client.

`Rewndly` is now both the public product name and the technical name for the repository, .NET projects, namespaces, services and database names.

## Stack

- Backend: ASP.NET Core 9, modular monolith, Vertical Slice-ready structure.
- Database: PostgreSQL in Docker Compose.
- Data access: Entity Framework Core with UUID primary keys.
- Observability base: Serilog and health checks.
- API base: Swagger, CORS, global error handling and rate limiting.
- Frontend: React, Vite, TypeScript, TailwindCSS and TanStack Query.
- Public media provider: TMDB through the backend only.

## Local Setup

1. Copy `.env.example` to `.env` for local overrides when needed.
2. Start PostgreSQL:

```bash
docker compose up -d postgres
```

3. Restore local .NET tools:

```bash
cd backend
dotnet tool restore
```

4. Apply migrations:

```bash
dotnet tool run dotnet-ef database update --project src/Rewndly.Infrastructure --startup-project src/Rewndly.Api --context AppDbContext
```

5. Optional development admin seed:

```bash
docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev < database/seeds/seed_dev_admin.sql
```

6. Run the backend:

```bash
cd backend
dotnet restore
dotnet run --project src/Rewndly.Api
```

7. Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend HTTP: `http://localhost:5231`
- Backend Swagger: `http://localhost:5231/swagger`
- Health check: `http://localhost:5231/health`
- System status: `http://localhost:5231/api/system/status`

## Phase 0 Decisions

- Public name: `Rewndly`.
- Public domain: `rewndly.com`.
- Technical project name: `Rewndly`.
- All primary keys must be UUID.
- Reviews are independent from `user_media_items`.
- `activity_events`, `system_events` and `admin_audit_logs` have separate responsibilities.
- `notifications` and `reports` are planned modules.
- Sensitive tokens must not be stored in `localStorage` or `sessionStorage`.
- TMDB API keys must never be exposed to the frontend.

## TMDB

Public browsing uses TMDB from the backend only. Configure credentials as environment secrets:

```bash
Tmdb__AccessToken=your_tmdb_read_access_token
Tmdb__ApiKey=your_tmdb_api_key
Tmdb__BaseUrl=https://api.themoviedb.org/3
Tmdb__ImageBaseUrl=https://image.tmdb.org/t/p
```

`Tmdb__AccessToken` is preferred because it is sent as a Bearer header. `Tmdb__ApiKey` remains as a v3 fallback. If both are empty, public media endpoints return a controlled `503` response instead of exposing internal details.

When requesting/configuring TMDB credentials, use the public product/domain:

```txt
Product: Rewndly
Domain: rewndly.com
```

## Tests

```bash
cd backend
dotnet test Rewndly.sln

cd ../frontend
npm run build
```

## Auth Smoke Checklist

With PostgreSQL running and migrations applied:

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/logout-all
```

Development email/password reset endpoints return dev tokens only in Development.

## Admin Smoke Checklist

1. Apply `backend/database/seeds/seed_dev_admin.sql`.
2. Login with `Colucho` and the development password.
3. Open `/admin`.
4. Verify dashboard, users, reviews, lists, system events, activity events and audit logs.
5. Confirm dangerous actions create `admin_audit_logs` and `system_events`.

## Deployment Preparation

- Production compose example: `docker-compose.prod.example.yml`
- Production env example: `.env.production.example`
- Controlled VPS trial compose: `docker-compose.vps.yml`
- Nginx Proxy Manager trial compose: `docker-compose.npm.yml`
- NPM deploy runbook: `README.deploy.md`
- VPS deploy guide: `docs/deploy-vps.md`
- Official project status: `docs/project-status.md`
- Nginx reverse proxy config: `nginx/rewndly.conf`
- Operational scripts: `scripts/deploy.sh`, `scripts/run-migrations.sh`, `scripts/seed-admin.sh`, `scripts/backup-db.sh`, `scripts/restore-db.sh`

Do not deploy with development secrets or the development admin password.

Current deploy state: Fase 10 is approved as preparation only. Rewndly is ready for a controlled trial deploy, but it has not been deployed remotely. Fase 10B and final production remain pending.

For a VPS that already runs Nginx Proxy Manager, use `/opt/rewndly`, keep `.env.production` on the server only, and proxy `rewndly.com` to `127.0.0.1:18080`. The NPM flow serves the frontend through its container and proxies `/api/*` internally to the ASP.NET Core API, so the API and PostgreSQL are not exposed publicly.

### Database Users and Least Privilege

Controlled VPS deploys separate database credentials:

```txt
rewndly_owner = migration/bootstrap user, used by Rewndly.DbMigrator
rewndly_app   = runtime API user, used by Rewndly.Api and Rewndly.AdminSeeder
```

`MigrationConnectionStrings__DefaultConnection` must use `rewndly_owner`. `ConnectionStrings__DefaultConnection` must use `rewndly_app`. The API must never run with the owner/bootstrap credentials.

The Docker init script `backend/database/init/02_create_app_user_and_grants.sh` creates the runtime user and grants only runtime permissions. PostgreSQL remains internal to Docker in the VPS compose files.

## Known Operational Pending Items

- Docker Desktop must be running locally before PostgreSQL validation.
- TMDB public browsing requires `Tmdb__AccessToken` or `Tmdb__ApiKey`.
- Mailgun/real email delivery is not wired yet.
- Notifications, reports, mobile, WebSockets and comments are intentionally out of scope.

## Phase 9 QA

Use [docs/qa-phase9.md](docs/qa-phase9.md) to validate the current Rewndly technical backend for Rewndly against Docker PostgreSQL, local PostgreSQL or a remote/VPS PostgreSQL database.
