# Rewndly Phase 9 QA Runbook

This runbook validates Rewndly with a real PostgreSQL database and optional TMDB credentials.

Do not paste real secrets into chat or commit them to git. Use environment variables or local `.env` files.

## Current Local Blockers

Docker Desktop is required for the default local path.

Phase 9 execution status on this machine:

```txt
Date: 2026-06-03
Docker PostgreSQL: blocked
Local PostgreSQL: unavailable
psql CLI: unavailable in PATH
TMDB credentials: unavailable in process environment
Migrations applied: pending real PostgreSQL
Admin seed applied: pending real PostgreSQL
Manual E2E smoke tests: pending real PostgreSQL/TMDB credentials
Integration tests: deferred until real PostgreSQL is available
```

Phase 9B execution status on this machine:

```txt
Date: 2026-06-04
Docker Desktop: available after starting Docker Desktop executable
PostgreSQL: available in Docker as rewndly_postgres
DB port used for QA: localhost:55432 -> container 5432
Reason for alternate port: localhost:5432 was already used by another Docker container
Migrations applied: 20260603211325_InitialCreate, 20260604002749_AddSocialVisibilityPhase6
Admin seed applied: Colucho / Admin / must_change_password=true
TMDB credentials: unavailable in process environment
TMDB endpoints: verified as controlled 503 without credentials
Manual/scripted smoke tests: passed for auth, user content, social visibility and admin
Integration tests: 2 tests created and passing against real PostgreSQL
Backend build/tests: passing in Docker SDK
Frontend build: passing
```

Operational note:

```txt
Windows App Control blocked local execution/loading of Rewndly.Infrastructure.dll with error 0x800711C7.
Backend build and tests were executed successfully inside mcr.microsoft.com/dotnet/sdk:9.0.
This is an environment policy issue, not a PostgreSQL schema issue.
```

Docker QA commands used:

```powershell
docker run -d --name rewndly_postgres `
  -e POSTGRES_DB=rewndly_dev `
  -e POSTGRES_USER=rewndly `
  -e POSTGRES_PASSWORD=rewndly_dev_password `
  -p 55432:5432 `
  -v rewndly_rewndly_postgres_data:/var/lib/postgresql/data `
  -v "${PWD}\backend\database\init:/docker-entrypoint-initdb.d:ro" `
  postgres:17

docker run --rm -v "${PWD}\backend:/work" -w /work `
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=55432;Database=rewndly_dev;Username=rewndly;Password=rewndly_dev_password" `
  mcr.microsoft.com/dotnet/sdk:9.0 `
  sh -c "dotnet tool restore && dotnet tool run dotnet-ef database update --project src/Rewndly.Infrastructure --startup-project src/Rewndly.Api --context AppDbContext"
```

Observed blocker:

```txt
unable to get image 'postgres:17': error during connect:
Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/images/postgres:17/json":
open //./pipe/dockerDesktopLinuxEngine: El sistema no puede encontrar el archivo especificado.
```

Also observed:

```txt
localhost:5432 is not accepting TCP connections
psql is not available in PATH
```

## Option A: Docker PostgreSQL

```powershell
docker compose up -d postgres
docker ps
```

Apply migrations:

```powershell
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project src/Rewndly.Infrastructure --startup-project src/Rewndly.Api --context AppDbContext
```

Apply development admin seed:

```powershell
Get-Content backend/database/seeds/seed_dev_admin.sql | docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev
```

If already inside `backend`, use:

```powershell
Get-Content database/seeds/seed_dev_admin.sql | docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev
```

Verify database objects:

```powershell
docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev -c "\dt"
docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev -c "\di"
docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev -c "select * from ""__EFMigrationsHistory"";"
docker exec -i rewndly_postgres psql -U rewndly -d rewndly_dev -c "select username, role, must_change_password from users where username = 'Colucho';"
```

## Option B: Local PostgreSQL Without Docker

Install PostgreSQL locally, create the database and user:

```sql
CREATE USER rewndly WITH PASSWORD 'rewndly_dev_password';
CREATE DATABASE rewndly_dev OWNER rewndly;
GRANT ALL PRIVILEGES ON DATABASE rewndly_dev TO rewndly;
```

Set connection string for the current shell:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=rewndly_dev;Username=rewndly;Password=rewndly_dev_password"
```

Apply migrations:

```powershell
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project src/Rewndly.Infrastructure --startup-project src/Rewndly.Api --context AppDbContext
```

Apply seed with local `psql`:

```powershell
psql "host=localhost port=5432 dbname=rewndly_dev user=rewndly password=rewndly_dev_password" -f backend/database/seeds/seed_dev_admin.sql
```

Verify with local `psql`:

```powershell
psql "host=localhost port=5432 dbname=rewndly_dev user=rewndly password=rewndly_dev_password" -c "\dt"
psql "host=localhost port=5432 dbname=rewndly_dev user=rewndly password=rewndly_dev_password" -c "select * from ""__EFMigrationsHistory"";"
psql "host=localhost port=5432 dbname=rewndly_dev user=rewndly password=rewndly_dev_password" -c "select username, role, must_change_password from users where username = 'Colucho';"
```

## Option C: Remote PostgreSQL or VPS

Use a separate QA database. Do not use production data for destructive QA.

Needed values:

```txt
DB host
DB port
DB name
DB username
SSL mode requirement
```

Do not send the password in chat. Set it locally:

```powershell
$env:REWNDLY_DB_PASSWORD="your-password"
$env:ConnectionStrings__DefaultConnection="Host=<host>;Port=<port>;Database=<db>;Username=<user>;Password=$env:REWNDLY_DB_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
```

Then run migrations:

```powershell
cd backend
dotnet tool restore
dotnet tool run dotnet-ef database update --project src/Rewndly.Infrastructure --startup-project src/Rewndly.Api --context AppDbContext
```

For seed, prefer a one-time production-safe admin seed flow using environment variables. Do not use `Admin123!` outside local development.

For remote QA only, a temporary seed may be applied to a disposable database. Rotate or remove credentials immediately after validation.

## TMDB QA

Set one credential:

```powershell
$env:Tmdb__AccessToken="your-read-access-token"
# or
$env:Tmdb__ApiKey="your-v3-api-key"
```

Smoke endpoints:

```powershell
Invoke-WebRequest http://localhost:5231/api/public/home
Invoke-WebRequest "http://localhost:5231/api/movies/search?query=matrix"
Invoke-WebRequest http://localhost:5231/api/movies/603
Invoke-WebRequest "http://localhost:5231/api/series/search?query=breaking"
```

If credentials are missing, the expected result is a controlled `503` response for TMDB-backed endpoints. The frontend must show an error/empty state without exposing credentials or backend internals.

## Critical Manual QA

Public:

```txt
home
movie search
movie detail
series search
series detail
public reviews
public lists
```

Auth:

```txt
register normal user
login normal user
refresh
/me
logout
login Colucho
```

User:

```txt
save movie
mark WantToWatch
mark Watched
rate
favorite
create/edit/delete review
create Public/FriendsOnly/Private list
add/remove list item
```

Social:

```txt
create user A
create user B
send friend request
accept friend request
view public profile
view friends-only profile as friend
block private profile as stranger
feed
```

Admin:

```txt
login Colucho
/admin dashboard
users list
user details
disable user
enable user
soft delete user
audit logs
system events
activity events
soft delete review
soft delete list
```

## Security Checks

```txt
No password_hash in responses
No refresh tokens in responses
Refresh cookie HttpOnly
Access token only in memory
Admin routes reject non-admin users
Users cannot mutate resources owned by others
Visibility rules hold for Public/FriendsOnly/Private
Login errors stay generic
```

## Visual Checks

```txt
Home keeps cinematic identity and poster-led hierarchy
Movie/series details remain readable on mobile
Login/register states are clear and not generic
Library, reviews, lists, feed and profile preserve violet accent and dark surfaces
Admin is denser and functional without exposing sensitive data
Loading, empty and error states are present
Mobile layouts avoid overlap and horizontal overflow
```

## Integration Test Plan

Create the integration test project only when a real PostgreSQL database is available.

Minimum scenarios:

```txt
Auth register/login/me
Refresh token rotation
Protected endpoint without token returns 401
Admin endpoint as User returns 403
Admin endpoint as Admin returns 200
Create library item
Create review
Create list
Friend request accept
Visibility private/friends/public
```

Recommended command once DB is available:

```powershell
cd backend
dotnet test Rewndly.sln
```
