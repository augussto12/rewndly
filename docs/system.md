# Ampliación del documento: roles, navegación pública, panel administrador y skills

# Decisiones finales de Fase 0

Estas decisiones quedan cerradas y son obligatorias para todo el proyecto.

## Nombre público y nombre técnico

El nombre público definitivo del producto será:

```txt
Rewndly
```

El dominio público objetivo será:

```txt
rewndly.com
```

El nombre técnico interno se mantiene por ahora para repositorio, carpetas, namespaces, servicios y base de datos:

```txt
Rewndly
```

No renombrar todavía proyectos .NET, namespaces, servicios Docker ni base de datos. Cualquier migración de `Rewndly` a `Rewndly` debe ser gradual y explícita para no romper builds, migraciones, seeds ni deploy.

## Primary Keys

Todas las Primary Keys del sistema deben ser UUID.

No usar:

```txt
SERIAL
BIGSERIAL
INT autoincremental
```

Usar UUID para:

```txt
users
movies
series
reviews
lists
list_items
friendships
activity_events
system_events
admin_audit_logs
refresh_tokens
email_verification_tokens
password_reset_tokens
notifications
reports
```

Motivos:

```txt
Evitar enumeración de IDs
Mejorar seguridad en APIs públicas
Facilitar sincronización futura con mobile
Facilitar migraciones futuras
```

## Relación personal vs reseñas

`user_media_items` representa la relación personal del usuario con una película o serie:

```txt
WantToWatch
Watching
Watched
Dropped
Favorite
Rating
WatchedAt
StartedAt
```

`reviews` representa reseñas independientes relacionadas a un usuario y a una película o serie:

```txt
user_id
media_type
movie_id nullable
series_id nullable
rating_snapshot
title
body
contains_spoilers
visibility
is_deleted
created_at
updated_at
```

No guardar reseñas como texto dentro de `user_media_items`.

## Eventos, auditoría, notificaciones y reportes

Separación obligatoria:

```txt
activity_events = feed social visible por usuarios
system_events = métricas/telemetría interna
admin_audit_logs = auditoría de acciones administrativas sensibles
notifications = avisos al usuario
reports = moderación futura
```

`activity_events` contiene actividad social como:

```txt
Colucho vio Dune.
Colucho puntuó Interstellar.
Colucho agregó Breaking Bad a favoritos.
Colucho creó una lista pública.
```

`system_events` contiene telemetría interna como:

```txt
UserRegistered
UserLoggedIn
PasswordResetRequested
MovieSearchPerformed
RefreshTokenReused
AdminUserDisabled
```

`notifications` queda contemplado desde el diseño para casos futuros:

```txt
Solicitud de amistad recibida
Solicitud de amistad aceptada
Nueva reseña de un amigo
Nueva temporada disponible
Acción administrativa relevante
```

`reports` queda contemplado desde el diseño para moderación futura:

```txt
Reportar reseña
Reportar usuario
Reportar lista
Reportar contenido inapropiado
```

No mezclar actividad social, telemetría, auditoría administrativa, notificaciones y reportes.

## 1. Tipos de acceso

El sistema tendrá tres niveles de uso:

```txt
Visitante público
Usuario registrado
Administrador
```

---

# 2. Visitante público

El visitante público podrá usar la app sin registrarse.

Puede:

```txt
Ver home
Ver tendencias
Buscar películas
Buscar series
Ver detalle de película
Ver detalle de serie
Ver perfiles públicos
Ver reseñas públicas
Ver listas públicas
```

No puede:

```txt
Puntuar
Guardar en listas
Comentar
Crear reseñas
Agregar amigos
Ver estadísticas personales completas
Modificar datos
```

Cuando intente hacer una acción personal, el sistema mostrará:

```txt
"Para guardar esta película necesitás iniciar sesión."
```

o:

```txt
"Registrate para empezar a armar tu lista."
```

Esto mejora la experiencia porque no obligás a registrarse antes de que el usuario vea valor.

---

# 3. Usuario registrado

El usuario registrado podrá:

```txt
Guardar películas y series
Puntuar
Comentar
Crear reseñas
Editar su perfil
Crear listas
Marcar como vista / viendo / quiero ver / abandonada
Agregar favoritos
Ver estadísticas personales
Agregar amigos
Ver actividad de amigos
Configurar privacidad básica
```

---

# 4. Administrador

El administrador tendrá acceso a un panel privado.

Ruta sugerida:

```txt
/admin
```

Debe estar protegida por rol:

```txt
Role = Admin
```

En ASP.NET Core conviene implementar autorización por roles y policies. Microsoft documenta que los roles pueden usarse directamente o mediante políticas como `RequireAdminRole`, y para este proyecto conviene combinar ambas cosas: rol simple para acceso general y policies para acciones sensibles.

---

# 5. Dashboard administrativo

El panel admin tendrá métricas como:

```txt
Usuarios registrados totales
Usuarios nuevos por día / semana / mes
Usuarios activos
Películas guardadas
Series guardadas
Reseñas creadas
Puntuaciones registradas
Listas creadas
Acciones totales del sistema
Búsquedas realizadas
Contenidos más guardados
Contenidos mejor puntuados
Contenidos más buscados
Errores recientes
Fallos de login
Consumo estimado de TMDB
```

---

# 6. Gestión de usuarios

El administrador podrá:

```txt
Ver usuarios
Buscar usuarios
Filtrar usuarios activos/inactivos
Ver detalle de usuario
Deshabilitar usuario
Rehabilitar usuario
Cambiar rol si corresponde
Ver actividad básica
Ver fecha de registro
Ver último acceso
```

Importante:

La eliminación de usuarios será con **soft delete**.

Tabla Users:

```txt
IsDeleted
DeletedAt
DeletedByAdminId
DeleteReason
IsDisabled
DisabledAt
DisabledByAdminId
DisableReason
```

Diferencia recomendada:

```txt
Soft delete = usuario eliminado lógicamente
Disabled = usuario bloqueado/deshabilitado pero conservado
```

---

# 7. Auditoría administrativa

Toda acción sensible del administrador debe registrarse.

Tabla:

```txt
AdminAuditLogs
```

Campos:

```txt
Id
AdminUserId
Action
TargetType
TargetId
Reason
IpAddress
UserAgent
CreatedAt
```

Ejemplos de acciones:

```txt
UserDisabled
UserEnabled
UserSoftDeleted
RoleChanged
ReviewRemoved
SystemSettingUpdated
```

Esto es clave para seguridad y trazabilidad.

---

# 8. Métricas de acciones

Agregar una tabla/evento de actividad del sistema:

```txt
SystemEvents
```

Campos:

```txt
Id
UserId nullable
EventType
EntityType
EntityId
MetadataJson
IpAddress
UserAgent
CreatedAt
```

Eventos posibles:

```txt
UserRegistered
UserLoggedIn
MovieSearched
SeriesSearched
MovieViewed
SeriesViewed
MovieAddedToWatchlist
SeriesAddedToWatchlist
MovieRated
SeriesRated
ReviewCreated
FriendRequestSent
FriendRequestAccepted
```

Esto permite construir métricas sin ensuciar las tablas principales.

---

# 9. Seguridad por roles

Roles iniciales:

```txt
User
Admin
```

Futuro opcional:

```txt
Moderator
SuperAdmin
```

Regla:

```txt
Todo usuario registrado tiene rol User.
Solo cuentas específicas tienen rol Admin.
```

Endpoints admin:

```txt
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/users/{id}
PATCH  /api/admin/users/{id}/disable
PATCH  /api/admin/users/{id}/enable
DELETE /api/admin/users/{id}
GET    /api/admin/audit-logs
GET    /api/admin/system-events
```

---

# 10. Control de acceso

Reglas obligatorias:

```txt
Deny by default
Validar permisos en backend
Nunca confiar en el frontend
No mostrar botones admin si no corresponde
Pero aunque se oculten botones, el backend debe bloquear igual
```

OWASP marca el control de acceso roto como uno de los riesgos más críticos: ocurre cuando un usuario puede actuar fuera de los permisos que le corresponden, accediendo, modificando o destruyendo información que no debería.

---

# 11. Seguridad de sesión

Recomendación final:

```txt
Access token corto
Refresh token en cookie HttpOnly
Refresh token hasheado en DB
Rotación de refresh token
Revocación en logout
Detección de reutilización de refresh token
```

No usar:

```txt
localStorage para tokens sensibles
sessionStorage para tokens sensibles
```

OWASP recomienda no guardar tokens de autenticación, sesiones o refresh tokens en `localStorage` o `sessionStorage`, porque cualquier JavaScript ejecutado en el origen podría leerlos ante una vulnerabilidad XSS. También recomienda atributos como `HttpOnly`, `Secure` y `SameSite` para cookies de sesión.

---

# 12. Protección de datos

Medidas:

```txt
Passwords hasheadas
Refresh tokens hasheados
Secrets fuera del repositorio
Variables de entorno
HTTPS obligatorio en producción
CORS estricto
Rate limiting
Validación de entrada
Sanitización de textos visibles
Logs sin datos sensibles
Backups protegidos
```

En ASP.NET Core, si se usan cookies, tokens protegidos o claves de protección de datos, hay que cuidar el key ring de Data Protection. Microsoft recomienda proteger el almacenamiento de esas claves con permisos adecuados y limitar su acceso solo a la aplicación.

---

# 13. Panel administrador visual

El panel admin debe tener una estética relacionada con la app, pero más clara y funcional.

Secciones:

```txt
Dashboard
Usuarios
Actividad
Contenido popular
Reseñas
Errores
Auditoría
Configuración
```

Componentes:

```txt
MetricCard
LineChart
BarChart
UserTable
ActivityTable
AuditLogTable
StatusBadge
AdminActionModal
ConfirmDialog
DateRangeFilter
```

---

# 14. Skill visual

Crear una “skill visual” o guía visual propia para evitar estética genérica.

Debe definir:

```txt
Identidad visual
Paleta de colores
Tipografías
Espaciado
Bordes
Sombras
Animaciones
Estados hover/focus
Cards
Posters
Backdrops
Skeletons
Empty states
Responsive
Mobile-first
Accesibilidad visual
```

Principios:

```txt
Cinematográfico
Oscuro
Elegante
No dashboard genérico
No plantilla IA
Posters protagonistas
Fondos con blur controlado
Microinteracciones suaves
Tipografía con personalidad
```

---

# 15. Skill de seguridad

Crear una “skill de seguridad” o checklist obligatorio.

Debe revisar:

```txt
Auth
Roles
Policies
Refresh tokens
Cookies
CORS
Rate limiting
Validaciones
SQL injection
XSS
CSRF
Logs
Auditoría
Soft delete
Permisos admin
Variables de entorno
Errores controlados
Backups
Dependencias
```

Regla:

Antes de cerrar cada fase, se ejecuta checklist de seguridad.

---

# 16. Cambios en las fases

## Fase 0 — Validación extendida

Agregar:

```txt
Definir roles
Definir permisos públicos
Definir permisos de usuario
Definir permisos admin
Definir métricas
Definir auditoría
Definir skill visual
Definir skill seguridad
```

---

## Fase 1 — Base técnica

Agregar:

```txt
Modelo de roles
Seed de usuario admin inicial
Políticas de autorización
Middleware de auditoría
Modelo base para soft delete
```

---

## Fase 2 — Auth y roles

Agregar:

```txt
Registro público
Login
Refresh token
Logout
Rol User automático
Rol Admin controlado
Protección de endpoints admin
Protección de acciones privadas
```

---

## Fase 3 — Navegación pública

Agregar:

```txt
Home pública
Búsqueda pública
Detalle público
Perfiles públicos básicos
Call to action para registrarse
```

---

## Fase 4 — Acciones de usuario

Agregar:

```txt
Guardar contenido
Puntuar
Crear reseña
Crear actividad
Registrar métricas
```

---

## Fase 5 — Admin

Agregar:

```txt
Dashboard admin
Tabla de usuarios
Soft delete
Deshabilitar usuario
Ver métricas
Ver eventos del sistema
Ver auditoría
```

---

# 17. Decisión final actualizada

El sistema queda definido como:

```txt
Aplicación pública navegable
Registro requerido solo para acciones personales
Rol User
Rol Admin
Panel administrativo
Métricas internas
Soft delete
Auditoría
Skill visual
Skill seguridad
```

Esta estructura es mucho más sólida y más cercana a un producto real.


# Estructura física del proyecto y base de datos

## 1. Estructura principal del repositorio

El proyecto tendrá dos carpetas principales:

```txt
/Rewndly
  /backend
  /frontend
  docker-compose.yml
  README.md
```

## 2. Backend

```txt
/backend
  /src
    /Rewndly.Api
    /Rewndly.Application
    /Rewndly.Domain
    /Rewndly.Infrastructure

  /tests
    /Rewndly.UnitTests
    /Rewndly.IntegrationTests

  /database
    /init
      init.sql

    /migrations
      001_initial_schema.sql
      002_add_admin_tables.sql

    /seeds
      seed_dev.sql
      seed_mock_movies.sql

  Dockerfile
```

## 3. Frontend

```txt
/frontend
  /src
    /app
    /features
    /components
    /pages
    /layouts
    /hooks
    /services
    /styles
    /assets

  package.json
  vite.config.ts
  Dockerfile
```

## 4. Base de datos

La base será **PostgreSQL**.

Todas las tablas usarán UUID como Primary Key. No se usarán `SERIAL`, `BIGSERIAL` ni enteros autoincrementales como identificadores públicos o primarios.

El backend será el único que se conecta a la base de datos.

```txt
Frontend → Backend → PostgreSQL
```

El frontend nunca debe conectarse directo a PostgreSQL.

---

# 5. Estrategia de base de datos

Se manejarán:

```txt
init.sql
migraciones
seeds opcionales
datos mock
backups
```

## 5.1 init.sql

Sirve para crear la estructura inicial en desarrollo o levantar el entorno por primera vez.

Ejemplo:

```txt
/database/init/init.sql
```

Puede incluir:

```txt
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 5.2 Migraciones

Los cambios reales del sistema deben hacerse con migraciones.

Si se usa Entity Framework Core:

```txt
dotnet ef migrations add InitialCreate
dotnet ef database update
```

También se puede mantener una carpeta SQL de referencia:

```txt
/database/migrations
```

## 5.3 Seeds

Los seeds serán opcionales.

Sirven para crear:

```txt
Usuario admin inicial
Usuarios mock
Películas mock
Series mock
Reseñas mock
Actividad mock
```

Ejemplo:

```txt
/database/seeds/seed_dev.sql
```

No deben ejecutarse automáticamente en producción salvo decisión explícita.

---

# 6. Tablas principales iniciales

## users

```txt
id PK
username UNIQUE
email UNIQUE
password_hash
display_name
avatar_url
bio
role
is_disabled
disabled_at
disabled_by_admin_id FK users.id nullable
disable_reason
is_deleted
deleted_at
deleted_by_admin_id FK users.id nullable
delete_reason
created_at
updated_at
last_login_at
```

Índices:

```txt
idx_users_email
idx_users_username
idx_users_role
idx_users_is_deleted
```

---

## refresh_tokens

```txt
id PK
user_id FK users.id
token_hash
created_at
expires_at
revoked_at
replaced_by_token_id FK refresh_tokens.id nullable
created_by_ip
revoked_by_ip
user_agent
```

Índices:

```txt
idx_refresh_tokens_user_id
idx_refresh_tokens_token_hash
idx_refresh_tokens_expires_at
```

---

## movies

```txt
id PK
tmdb_id UNIQUE
title
original_title
overview
poster_path
backdrop_path
release_date
runtime_minutes
original_language
popularity
vote_average
last_synced_at
created_at
updated_at
```

Índices:

```txt
idx_movies_tmdb_id
idx_movies_title
idx_movies_release_date
```

---

## series

```txt
id PK
tmdb_id UNIQUE
name
original_name
overview
poster_path
backdrop_path
first_air_date
last_air_date
number_of_seasons
number_of_episodes
original_language
popularity
vote_average
last_synced_at
created_at
updated_at
```

Índices:

```txt
idx_series_tmdb_id
idx_series_name
```

---

## genres

```txt
id PK
tmdb_id
name
media_type
```

Índice único:

```txt
unique_genre_tmdb_media_type
```

---

## movie_genres

```txt
movie_id FK movies.id
genre_id FK genres.id
```

PK compuesta:

```txt
movie_id + genre_id
```

---

## series_genres

```txt
series_id FK series.id
genre_id FK genres.id
```

PK compuesta:

```txt
series_id + genre_id
```

---

## user_media_items

```txt
id PK
user_id FK users.id
media_type
movie_id FK movies.id nullable
series_id FK series.id nullable
status
is_favorite
rating
watched_at
started_at
created_at
updated_at
```

Restricciones:

```txt
Debe tener movie_id o series_id, pero no ambos.
Un usuario no puede tener duplicado el mismo contenido.
rating entre 1 y 10.
```

Índices:

```txt
idx_user_media_items_user_id
idx_user_media_items_status
idx_user_media_items_movie_id
idx_user_media_items_series_id
```

---

## reviews

```txt
id PK
user_id FK users.id
media_type
movie_id FK movies.id nullable
series_id FK series.id nullable
rating_snapshot
title
body
contains_spoilers
visibility
is_deleted
deleted_at
created_at
updated_at
```

Restricciones:

```txt
Debe tener movie_id o series_id, pero no ambos.
rating_snapshot entre 1 y 10.
visibility debe ser Public, FriendsOnly o Private.
```

Índices:

```txt
idx_reviews_user_id
idx_reviews_movie_id
idx_reviews_series_id
idx_reviews_created_at
idx_reviews_visibility
idx_reviews_is_deleted
```

---

## lists

```txt
id PK
user_id FK users.id
title
description
visibility
is_deleted
deleted_at
created_at
updated_at
```

Índices:

```txt
idx_lists_user_id
idx_lists_visibility
idx_lists_is_deleted
```

---

## list_items

```txt
id PK
list_id FK lists.id
media_type
movie_id FK movies.id nullable
series_id FK series.id nullable
position
note
created_at
```

Restricciones:

```txt
Debe tener movie_id o series_id, pero no ambos.
Un contenido no debe repetirse dentro de la misma lista.
```

Índices:

```txt
idx_list_items_list_id
idx_list_items_movie_id
idx_list_items_series_id
```

---

## friendships

```txt
id PK
requester_id FK users.id
receiver_id FK users.id
status
created_at
updated_at
```

Índices:

```txt
idx_friendships_requester_id
idx_friendships_receiver_id
unique_friendship_pair
```

---

## activity_events

Actividad social visible por usuarios y feeds. No usar para métricas internas.

```txt
id PK
user_id FK users.id
event_type
media_type
movie_id FK movies.id nullable
series_id FK series.id nullable
metadata_json
created_at
```

Índices:

```txt
idx_activity_events_user_id
idx_activity_events_created_at
idx_activity_events_event_type
```

---

## admin_audit_logs

```txt
id PK
admin_user_id FK users.id
action
target_type
target_id
reason
ip_address
user_agent
created_at
```

Índices:

```txt
idx_admin_audit_logs_admin_user_id
idx_admin_audit_logs_created_at
idx_admin_audit_logs_action
```

---

## system_events

Telemetría interna y métricas del sistema. No usar como feed social.

```txt
id PK
user_id FK users.id nullable
event_type
entity_type
entity_id
metadata_json
ip_address
user_agent
created_at
```

Índices:

```txt
idx_system_events_user_id
idx_system_events_event_type
idx_system_events_created_at
```

---

## notifications

Tabla futura contemplada desde el diseño. No es obligatoria en la primera fase funcional.

```txt
id PK
user_id FK users.id
type
title
body
metadata_json
read_at
created_at
```

---

## reports

Tabla futura contemplada desde el diseño para moderación.

```txt
id PK
reporter_user_id FK users.id
target_type
target_id
reason
details
status
reviewed_by_admin_id FK users.id nullable
reviewed_at
created_at
```

---

# 7. VPS y despliegue futuro

El usuario cuenta con una VPS en Hostinger. El producto público será Rewndly y el dominio objetivo será `rewndly.com`.

Por decisión técnica actual, `Rewndly` se mantiene como nombre interno de repositorio, servicios, namespaces y base de datos hasta una migración gradual aprobada.

Para producción se evaluarán dos opciones:

## Opción A — Nueva base de datos

Crear una base separada:

```txt
rewndly_db
```

Ventaja:

```txt
Más ordenado
Más seguro
Más fácil de respaldar
Más fácil de migrar
```

Recomendación inicial:

```txt
Crear una base nueva para este proyecto.
```

## Opción B — Nuevo esquema dentro de una base existente

Crear un schema:

```txt
rewndly
```

Ventaja:

```txt
Puede ser útil si ya existe una DB centralizada.
```

Desventaja:

```txt
Menos aislado
Backups menos claros
Mayor riesgo de mezclar proyectos
```

## Decisión recomendada

Usar una **base de datos nueva** dentro de PostgreSQL en la VPS.

```txt
rewndly_db
```

Con usuarios separados:

```txt
rewndly_owner
rewndly_app
```

Regla:

```txt
rewndly_owner = usuario de migraciones/bootstrap
rewndly_app = usuario runtime usado por la API
```

`rewndly_owner` puede aplicar migraciones y cambios estructurales dentro de la base del proyecto.

`rewndly_app` debe tener permisos limitados:

```txt
CONNECT sobre la DB
USAGE sobre schema public
SELECT, INSERT, UPDATE, DELETE sobre tablas necesarias
USAGE/SELECT sobre sequences si existen
Sin SUPERUSER
Sin CREATEDB
Sin CREATEROLE
Sin CREATE/ALTER/DROP estructural
```

La API nunca debe correr con credenciales owner/bootstrap en VPS o produccion.

---

# 8. Docker Compose local

En desarrollo se usará Docker Compose para PostgreSQL.

```txt
services:
  postgres:
    image: postgres
    environment:
      POSTGRES_DB: rewndly_dev
      POSTGRES_USER: rewndly
      POSTGRES_PASSWORD: rewndly_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init:/docker-entrypoint-initdb.d
```

---

# 9. Regla importante

Las credenciales reales de la VPS nunca deben ir en el repositorio.

Se usarán:

```txt
.env
variables de entorno
secrets del servidor
```

Archivos a ignorar:

```txt
.env
.env.local
appsettings.Production.json con secrets reales
```

---

# 10. Orden recomendado

Primero:

```txt
Desarrollo local con Docker Compose
PostgreSQL local
Migraciones EF Core
Seeds dev opcionales
```

Después:

```txt
Preparar VPS
Crear base rewndly_db
Crear usuario owner rewndly_owner
Crear usuario runtime limitado rewndly_app
Configurar variables de entorno
Ejecutar migraciones
Configurar backups
```

La VPS se configura más adelante, cuando el MVP ya tenga sentido.

