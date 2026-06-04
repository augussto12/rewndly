# Estructura de código recomendada

## 0. Decisiones finales de Fase 0

Estas decisiones son obligatorias:

```txt
Nombre público: Rewndly
Dominio público: rewndly.com
Nombre técnico interno: MovieSys
Todas las Primary Keys: UUID
Reviews independientes de user_media_items
activity_events separado de system_events
notifications contemplado como módulo futuro
reports contemplado como módulo futuro
```

Responsabilidades separadas:

```txt
activity_events = feed social visible por usuarios
system_events = métricas/telemetría interna
admin_audit_logs = auditoría de acciones administrativas sensibles
notifications = avisos al usuario
reports = moderación futura
```

## 1. Backend

El backend se desarrollará como un **monolito modular** usando ASP.NET Core.

No se usará una estructura de microservicios al inicio, porque agregaría complejidad innecesaria. El sistema tendrá una única API, una única base de datos PostgreSQL y módulos internos bien separados.

## 2. Objetivo de la estructura

La estructura debe permitir:

* Código ordenado.
* Separación clara por funcionalidades.
* Escalabilidad futura.
* Bajo acoplamiento.
* Fácil mantenimiento.
* Fácil testing.
* Posibilidad de separar módulos en el futuro si hiciera falta.

## 3. Estructura general backend

```txt
/src
  /MovieSys.Api
  /MovieSys.Application
  /MovieSys.Domain
  /MovieSys.Infrastructure
  /MovieSys.Shared
/tests
  /MovieSys.UnitTests
  /MovieSys.IntegrationTests
```

---

# 4. MovieSys.Api

Responsabilidad:

* Endpoints.
* Middlewares.
* Configuración inicial.
* Swagger.
* CORS.
* Auth.
* Rate limiting.
* Dependency injection.
* Health checks.

Ejemplo:

```txt
MovieSys.Api
  /Extensions
    CorsExtensions.cs
    AuthExtensions.cs
    SwaggerExtensions.cs
    RateLimitExtensions.cs

  /Middlewares
    ExceptionHandlingMiddleware.cs
    RequestLoggingMiddleware.cs

  Program.cs
  appsettings.json
```

---

# 5. MovieSys.Application

Responsabilidad:

* Casos de uso.
* Commands.
* Queries.
* Handlers.
* DTOs.
* Validaciones.
* Interfaces.

Estructura por módulo:

```txt
MovieSys.Application
  /Modules
    /Auth
      /Register
        RegisterCommand.cs
        RegisterHandler.cs
        RegisterValidator.cs
        RegisterResponse.cs

      /Login
        LoginCommand.cs
        LoginHandler.cs
        LoginValidator.cs
        LoginResponse.cs

    /Movies
      /SearchMovies
        SearchMoviesQuery.cs
        SearchMoviesHandler.cs
        SearchMoviesResponse.cs

      /GetMovieDetails
        GetMovieDetailsQuery.cs
        GetMovieDetailsHandler.cs

    /Series
    /Library
    /Reviews
    /Lists
    /Users
    /Friends
    /Admin
    /Stats

  /Common
    /Interfaces
    /Behaviors
    /Errors
    /Pagination
```

Regla:

Cada funcionalidad tiene su propia carpeta.

No crear archivos gigantes como:

```txt
MovieService.cs
UserService.cs
AdminService.cs
```

Preferir:

```txt
SearchMoviesHandler.cs
GetMovieDetailsHandler.cs
AddMovieToLibraryHandler.cs
RateMovieHandler.cs
```

---

# 6. MovieSys.Domain

Responsabilidad:

* Entidades.
* Enums.
* Value Objects.
* Reglas de dominio.
* Eventos de dominio.

Ejemplo:

```txt
MovieSys.Domain
  /Users
    User.cs
    UserRole.cs
    RefreshToken.cs

  /Media
    Movie.cs
    Series.cs
    Genre.cs
    MediaType.cs

  /Library
    UserMediaItem.cs
    WatchStatus.cs

  /Reviews
    Review.cs

  /Lists
    List.cs
    ListItem.cs

  /Friends
    Friendship.cs
    FriendshipStatus.cs

  /Admin
    AdminAuditLog.cs

  /Events
    ActivityEvent.cs
    SystemEvent.cs

  /Notifications
    Notification.cs

  /Reports
    Report.cs
```

Regla:

El dominio no debe depender de infraestructura, base de datos, TMDB ni ASP.NET.

Regla de identidad:

Todas las entidades persistidas deben usar UUID como Primary Key. No usar `SERIAL`, `BIGSERIAL` ni `INT autoincremental`.

---

# 7. MovieSys.Infrastructure

Responsabilidad:

* Entity Framework Core.
* PostgreSQL.
* Repositorios si se usan.
* Clientes externos.
* TMDB client.
* Email sender.
* Cache.
* Implementaciones de interfaces.

Ejemplo:

```txt
MovieSys.Infrastructure
  /Persistence
    AppDbContext.cs
    /Configurations
      UserConfiguration.cs
      MovieConfiguration.cs
      ReviewConfiguration.cs
    /Migrations

  /ExternalServices
    /Tmdb
      TmdbClient.cs
      TmdbOptions.cs
      TmdbMovieDto.cs
      TmdbSeriesDto.cs

  /Authentication
    JwtTokenGenerator.cs
    RefreshTokenService.cs
    PasswordService.cs

  /Caching
    CacheService.cs

  /Logging
```

---

# 8. MovieSys.Shared

Responsabilidad:

* Clases compartidas simples.
* Result pattern.
* Constantes.
* Helpers muy generales.

Ejemplo:

```txt
MovieSys.Shared
  Result.cs
  Error.cs
  DateTimeProvider.cs
```

No abusar de Shared.

Si algo pertenece a un módulo, debe quedar en ese módulo.

---

# 9. Organización por módulos

Módulos principales:

```txt
Auth
Users
Movies
Series
Library
Reviews
Lists
Friends
Feed
Stats
Admin
ActivityEvents
SystemEvents
Notifications
Reports
```

`Notifications` y `Reports` quedan contemplados para evolución futura. No es necesario implementarlos en la primera fase funcional, pero la arquitectura no debe impedir agregarlos.

Cada módulo debe tener:

```txt
Commands
Queries
Handlers
Validators
Responses
Endpoints
```

Dependiendo del estilo elegido, los endpoints pueden estar en `Api` o dentro de cada módulo en `Application`.

Recomendación:

Para mantener Vertical Slice más cómodo:

```txt
Application/Modules/Auth/Register
Api/Endpoints/AuthEndpoints.cs
```

o usar Minimal APIs agrupadas por módulo:

```txt
Api/Endpoints/Auth/RegisterEndpoint.cs
```

---

# 10. Frontend

El frontend se organizará por features y componentes reutilizables.

No se organizará solo por tipo de archivo, porque eso escala mal.

## Estructura general

```txt
/src
  /app
  /features
  /components
  /layouts
  /pages
  /hooks
  /services
  /lib
  /styles
  /assets
```

---

# 11. app

Responsabilidad:

* Configuración global.
* Router.
* Providers.
* Query client.
* Auth provider.
* Theme provider.

```txt
/app
  App.tsx
  router.tsx
  queryClient.ts
  providers.tsx
```

---

# 12. features

Cada funcionalidad importante tendrá su propia carpeta.

```txt
/features
  /auth
    /components
      LoginForm.tsx
      RegisterForm.tsx
    /hooks
      useLogin.ts
      useRegister.ts
    /services
      authApi.ts
    /types
      auth.types.ts

  /movies
    /components
      MovieCard.tsx
      MovieGrid.tsx
      MovieDetailsHeader.tsx
    /hooks
      useSearchMovies.ts
      useMovieDetails.ts
    /services
      moviesApi.ts
    /types
      movie.types.ts

  /series
  /library
  /reviews
  /lists
  /friends
  /admin
  /notifications
  /stats
```

Regla:

Todo lo específico de una feature vive dentro de esa feature.

---

# 13. components

Componentes reutilizables de toda la app.

```txt
/components
  /ui
    /Button
      Button.tsx
      Button.types.ts
      index.ts

    /Input
      Input.tsx
      Input.types.ts
      index.ts

    /Modal
      Modal.tsx
      index.ts

  /media
    /PosterCard
      PosterCard.tsx
      PosterCard.types.ts
      index.ts

    /RatingControl
      RatingControl.tsx
      index.ts

  /feedback
    /Toast
    /EmptyState
    /LoadingSkeleton
```

Regla:

Cada componente importante tendrá su propia carpeta.

Ejemplo:

```txt
Button/
  Button.tsx
  Button.types.ts
  Button.test.tsx
  index.ts
```

---

# 14. pages

Páginas principales:

```txt
/pages
  HomePage.tsx
  LoginPage.tsx
  RegisterPage.tsx
  MovieDetailsPage.tsx
  SeriesDetailsPage.tsx
  ProfilePage.tsx
  LibraryPage.tsx
  AdminDashboardPage.tsx
```

Las páginas no deben tener demasiada lógica.

La lógica va en:

```txt
features
hooks
services
```

---

# 15. services

Cliente HTTP y configuración de API.

```txt
/services
  httpClient.ts
  apiErrorHandler.ts
```

Cada feature puede tener su propio archivo:

```txt
features/movies/services/moviesApi.ts
features/auth/services/authApi.ts
```

---

# 16. Estándares de frontend

Reglas:

* Componentes chicos.
* Una responsabilidad por componente.
* No mezclar llamadas HTTP dentro de componentes visuales.
* Usar hooks para lógica.
* Usar TanStack Query para server state.
* Usar Zustand solo si hace falta estado global.
* No usar localStorage para tokens sensibles.
* Manejar loading, empty y error states en cada pantalla.
* Diseño responsive desde el inicio.

---

# 17. Convención de nombres

Backend:

```txt
RegisterCommand
RegisterHandler
RegisterValidator
GetMovieDetailsQuery
AddMovieToLibraryCommand
DisableUserCommand
```

Frontend:

```txt
MovieCard.tsx
useMovieDetails.ts
moviesApi.ts
movie.types.ts
```

Base de datos:

```txt
users
movies
series
user_media_items
refresh_tokens
admin_audit_logs
system_events
```

---

# 18. Regla general del proyecto

Antes de agregar una funcionalidad nueva, definir:

```txt
Módulo
Entidad afectada
Endpoint
Command o Query
Validator
Handler
DTO
Permisos
Errores posibles
Tests mínimos
Impacto visual
```

---

# 19. Decisión final

La estructura recomendada será:

```txt
Backend: Modular Monolith + Vertical Slice
Frontend: Feature-based + componentes por carpeta
DB: PostgreSQL
Mobile futuro: React Native consumiendo la misma API
```

La marca pública visible debe usar `Rewndly`. `MovieSys` queda como nombre técnico interno para proyectos .NET, namespaces, servicios y base de datos hasta que se apruebe una migración gradual.

Esta estructura mantiene el proyecto ordenado desde el inicio, pero sin hacerlo innecesariamente complejo.
