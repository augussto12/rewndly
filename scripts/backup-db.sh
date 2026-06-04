#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.vps.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
export ENV_FILE

mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/rewndly_$(date +%Y%m%d_%H%M%S).dump"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_file"

chmod 600 "$backup_file"
echo "Backup written to $backup_file"
