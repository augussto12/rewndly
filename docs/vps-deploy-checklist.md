# Rewndly VPS deploy checklist

Estado objetivo: deploy de prueba controlado. No declarar produccion final hasta completar smoke tests, backups, HTTPS, logs y revision final de seguridad.

Este runbook asume que Nginx Proxy Manager ya existe en la VPS y que Rewndly se va a levantar con `docker-compose.npm.yml`.

## 1. Requisitos VPS

- Ubuntu/Debian actualizado.
- Docker Engine y Docker Compose plugin instalados.
- Git instalado.
- Nginx Proxy Manager funcionando.
- Puertos publicos `80` y `443` abiertos hacia NPM.
- Puerto interno/local para Rewndly: `18080`.
- Dominio objetivo: `rewndly.com`.
- Carpeta recomendada:

```bash
/opt/rewndly
```

## 2. Clonar repo

```bash
sudo mkdir -p /opt/rewndly
sudo chown "$USER:$USER" /opt/rewndly
cd /opt/rewndly
git clone https://github.com/augussto12/rewndly.git .
```

Actualizar luego:

```bash
cd /opt/rewndly
git pull origin main
```

## 3. Crear `.env.production`

No commitear este archivo. Debe existir solo en la VPS.

```bash
cd /opt/rewndly
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Variables obligatorias sin valores reales:

```env
ASPNETCORE_ENVIRONMENT=Production

POSTGRES_DB=rewndly_db
POSTGRES_OWNER_USER=rewndly_owner
POSTGRES_OWNER_PASSWORD=
REWNDLY_APP_DB_USER=rewndly_app
REWNDLY_APP_DB_PASSWORD=

MigrationConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=rewndly_db;Username=rewndly_owner;Password=
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=rewndly_db;Username=rewndly_app;Password=

Jwt__Issuer=Rewndly
Jwt__Audience=Rewndly.Web
Jwt__Secret=
Jwt__AccessTokenMinutes=15
Jwt__RefreshTokenDays=14

Cors__AllowedOrigins__0=https://rewndly.com
Cookie__Domain=rewndly.com
Cookie__SameSite=Lax

VITE_API_BASE_URL=
FRONTEND_HTTP_BIND=127.0.0.1
FRONTEND_HTTP_PORT=18080

TMDB_ACCESS_TOKEN=
TMDB_API_KEY=
Tmdb__AccessToken=
Tmdb__ApiKey=
Tmdb__BaseUrl=https://api.themoviedb.org/3
Tmdb__ImageBaseUrl=https://image.tmdb.org/t/p
Tmdb__PosterSize=w500
Tmdb__BackdropSize=w1280
Tmdb__TimeoutSeconds=10

REWNDLY_ADMIN_USERNAME=
REWNDLY_ADMIN_EMAIL=
REWNDLY_ADMIN_INITIAL_PASSWORD=

Mail__Provider=
Mail__ApiKey=
```

Reglas:

- Usar `TMDB_ACCESS_TOKEN` como Bearer token preferido.
- Dejar `TMDB_API_KEY` solo como fallback v3.
- No cargar ningun secreto en archivos versionados.
- No usar `Admin123!` en VPS.

## 4. Generar secretos fuertes

JWT secret:

```bash
openssl rand -base64 64
```

Passwords de DB:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Password inicial admin productivo:

```bash
openssl rand -base64 36
```

Copiar los valores solo dentro de `.env.production`.

## 5. TMDB

En `.env.production`, cargar el read access token:

```env
TMDB_ACCESS_TOKEN=<token-real-en-vps>
```

Fallback opcional:

```env
TMDB_API_KEY=<api-key-v3-real-en-vps>
```

El frontend nunca recibe estas credenciales. La API consume TMDB desde backend.

## 6. Admin productivo

Configurar:

```env
REWNDLY_ADMIN_USERNAME=<admin-username>
REWNDLY_ADMIN_EMAIL=<admin-email>
REWNDLY_ADMIN_INITIAL_PASSWORD=<password-fuerte-de-un-solo-uso>
```

El seeder:

- Crea el admin si no existe.
- No pisa un admin existente.
- Marca `must_change_password = true`.
- Rechaza `Admin123!` en Production.

## 7. Levantar contenedores

Con Nginx Proxy Manager existente, usar:

```bash
cd /opt/rewndly
chmod +x scripts/*.sh
bash scripts/deploy-npm.sh
docker compose -f docker-compose.npm.yml --env-file .env.production ps
```

Contenedores esperados:

- `rewndly_frontend`
- `rewndly_api`
- `rewndly_postgres`

Servicios ops bajo profile:

- `rewndly_migrator`
- `rewndly_seed_admin`

## 8. Migraciones

`scripts/deploy-npm.sh` ya ejecuta migraciones con usuario owner, no con usuario runtime.
Si necesitás correrlas manualmente:

```bash
cd /opt/rewndly
COMPOSE_FILE=docker-compose.npm.yml bash scripts/run-migrations.sh
```

Equivalente:

```bash
docker compose -f docker-compose.npm.yml --env-file .env.production --profile ops run --rm migrator
```

## 9. Seed admin

`scripts/deploy-npm.sh` ya ejecuta el seed admin despues de migraciones.
Si necesitás correrlo manualmente:

```bash
cd /opt/rewndly
COMPOSE_FILE=docker-compose.npm.yml bash scripts/seed-admin.sh
```

Equivalente:

```bash
docker compose -f docker-compose.npm.yml --env-file .env.production --profile ops run --rm seed-admin
```

## 10. Verificar usuario DB limitado

Confirmar usuario activo:

```bash
cd /opt/rewndly
docker compose -f docker-compose.npm.yml --env-file .env.production exec -T postgres \
  sh -c 'PGPASSWORD="$REWNDLY_APP_DB_PASSWORD" psql -h localhost -U "$REWNDLY_APP_DB_USER" -d "$POSTGRES_DB" -c "select current_user;"'
```

Debe devolver:

```txt
rewndly_app
```

Confirmar que no puede crear tablas:

```bash
cd /opt/rewndly
docker compose -f docker-compose.npm.yml --env-file .env.production exec -T postgres \
  sh -c 'PGPASSWORD="$REWNDLY_APP_DB_PASSWORD" psql -h localhost -U "$REWNDLY_APP_DB_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "create table should_fail(id int);"'
```

Resultado esperado:

```txt
permission denied for schema public
```

## 11. Nginx Proxy Manager

Como `/api` se resuelve dentro del nginx del contenedor frontend, NPM debe apuntar al frontend. El frontend reenvia `/api/*` al contenedor `api:8080`.

### Opcion recomendada: NPM container en la red Docker de Rewndly

Despues de levantar Rewndly, conectar el contenedor de NPM a la red publica:

```bash
docker network connect rewndly_public <nombre-contenedor-npm>
```

Si no sabes el nombre:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

Crear Proxy Host en NPM:

```txt
Domain Names: rewndly.com, www.rewndly.com
Scheme: http
Forward Hostname/IP: rewndly_frontend
Forward Port: 80
Cache Assets: off
Block Common Exploits: on
Websockets Support: off
```

SSL:

```txt
Request a new SSL Certificate
Use Let's Encrypt
Force SSL: on
HTTP/2 Support: on
HSTS: off inicialmente, on solo cuando HTTPS quede verificado
```

### Opcion alternativa: NPM accede al puerto local publicado

Si NPM corre en host o puede alcanzar el host:

```txt
Forward Hostname/IP: 127.0.0.1
Forward Port: 18080
```

Si NPM corre en contenedor y no puede resolver `127.0.0.1` del host, usar la opcion recomendada de red Docker. No exponer `18080` publicamente salvo necesidad explicita y firewall restringido.

## 12. DNS / Cloudflare

Crear registros:

```txt
A     rewndly.com      <IP_PUBLICA_VPS>
CNAME www              rewndly.com
```

Si usas Cloudflare:

- Modo SSL/TLS: Full o Full strict cuando Let's Encrypt este activo.
- Proxy naranja puede quedar on despues de verificar HTTPS directo.
- No activar reglas agresivas de cache sobre `/api/*`.

## 13. Smoke tests post deploy

Desde tu PC:

```bash
curl -i https://rewndly.com/health
curl -i https://rewndly.com/api/system/status
curl -i https://rewndly.com/api/public/home
curl -i "https://rewndly.com/api/movies/search?query=matrix"
curl -i "https://rewndly.com/api/series/search?query=breaking"
```

En navegador:

- Abrir `https://rewndly.com`.
- Ver home con posters y backdrops.
- Buscar `matrix`.
- Buscar `breaking`.
- Login admin inicial.
- Confirmar `must_change_password`.
- Entrar a `/admin`.

## 14. Logs

```bash
cd /opt/rewndly
docker compose -f docker-compose.npm.yml --env-file .env.production logs -f api
docker compose -f docker-compose.npm.yml --env-file .env.production logs -f frontend
docker compose -f docker-compose.npm.yml --env-file .env.production logs -f postgres
```

Estado:

```bash
docker compose -f docker-compose.npm.yml --env-file .env.production ps
docker inspect rewndly_api --format '{{json .State.Health}}'
docker inspect rewndly_frontend --format '{{json .State.Health}}'
```

## 15. Backup

Backup manual:

```bash
cd /opt/rewndly
COMPOSE_FILE=docker-compose.npm.yml bash scripts/backup-db.sh
ls -lh backups/
```

Permisos:

```bash
chmod 700 backups
chmod 600 backups/*.dump
```

Cron sugerido:

```bash
crontab -e
```

Ejemplo diario:

```cron
15 3 * * * cd /opt/rewndly && COMPOSE_FILE=docker-compose.npm.yml bash scripts/backup-db.sh >> /opt/rewndly/backups/backup.log 2>&1
```

## 16. Restore

```bash
cd /opt/rewndly
COMPOSE_FILE=docker-compose.npm.yml bash scripts/restore-db.sh backups/<archivo>.dump
```

Luego validar:

```bash
curl -i https://rewndly.com/api/system/status
```

## 17. Rollback basico

Ver commits:

```bash
cd /opt/rewndly
git log --oneline -5
```

Volver a un commit anterior:

```bash
git checkout <commit-anterior>
docker compose -f docker-compose.npm.yml --env-file .env.production build
docker compose -f docker-compose.npm.yml --env-file .env.production up -d frontend api
```

Si hubo migracion incompatible, restaurar backup:

```bash
COMPOSE_FILE=docker-compose.npm.yml bash scripts/restore-db.sh backups/<backup-previo>.dump
```

Volver a main despues:

```bash
git checkout main
git pull origin main
```

## 18. Checklist de seguridad final

- `.env.production` existe solo en VPS y tiene permisos `600`.
- No hay secretos reales en GitHub.
- `Jwt__Secret` es fuerte y unico.
- `TMDB_ACCESS_TOKEN` esta solo en backend/VPS.
- `REWNDLY_ADMIN_INITIAL_PASSWORD` no es `Admin123!`.
- Admin inicial queda con `must_change_password = true`.
- PostgreSQL no esta expuesto publicamente.
- API usa `rewndly_app`, no `rewndly_owner`.
- `rewndly_app` no puede `CREATE TABLE`.
- NPM fuerza HTTPS.
- CORS solo permite `https://rewndly.com`.
- Cookies usan `Secure` en acceso HTTPS.
- `/api/admin/*` requiere Admin.
- No se exponen password hashes ni refresh tokens.
- Logs no imprimen passwords, JWT, refresh tokens ni TMDB token.
- Backups existen y se probo al menos un restore en entorno controlado.
- Smoke tests pasan desde dominio.

## 19. Estado

Si todo lo anterior pasa, Rewndly queda listo como deploy de prueba controlado en VPS. Produccion final queda pendiente de monitoreo, backups automatizados validados, Mailgun real, rotacion de secretos y revision final.
