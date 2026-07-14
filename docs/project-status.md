# Rewndly Project Status

Public product name:

```txt
Rewndly
```

Public domain:

```txt
rewndly.com
```

Technical project name:

```txt
Rewndly
```

Do not rename .NET projects, namespaces, services or database names until a gradual migration is explicitly approved.

Current official status:

```txt
Fase 0: aprobada
Fase 1: aprobada
Fase 2: aprobada
Fase 3: aprobada
Fase 4: aprobada
Fase 5: aprobada
Fase 6: aprobada
Fase 7: aprobada
Fase 8: aprobada
Fase 9: aprobada parcialmente por entorno
Fase 9B: aprobada con PostgreSQL real
Fase 10: aprobada como preparacion de deploy VPS
Fase 10B: aprobada como deploy de prueba controlado en VPS
Produccion final: pendiente
```

## Deploy State

Rewndly is deployed remotely as a controlled VPS trial behind Nginx Proxy Manager at `rewndly.com`.

Fase 10B smoke tests passed on June 16, 2026. Final production remains pending.

Prepared remote repository target:

```txt
https://github.com/augussto12/rewndly.git
```

Prepared controlled VPS path for future deploy:

```txt
/opt/rewndly
```

Prepared Nginx Proxy Manager target:

```txt
rewndly.com -> http://127.0.0.1:18080
```

Prepared database least-privilege model:

```txt
rewndly_owner = migration/bootstrap user
rewndly_app = runtime API user
Rewndly.DbMigrator uses MigrationConnectionStrings__DefaultConnection
Rewndly.Api uses ConnectionStrings__DefaultConnection
```

Fase 10B verified on the target database that `rewndly_app` cannot create schema objects.

Do not:

```txt
Ask for secrets in chat
Modify real production configuration
Declare the system production-ready
```

Allowed next focus areas:

```txt
Product decisions
Naming
Domain strategy
Visual design
Functional improvements
Planning for future phases
Post-deploy monitoring
Mobile app preparation
```

## Secrets Rule

Real credentials must only be loaded through:

```txt
.env.production on the server
Server environment variables
Secret manager / deployment secrets
Temporary credentials handled outside chat
```

Never write real secrets in repository files or chat.
