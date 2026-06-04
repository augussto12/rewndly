#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.npm.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
export ENV_FILE

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Create it from .env.production.example on the VPS." >&2
  exit 1
fi

mkdir -p backups

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile ops run --rm migrator
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile ops run --rm seed-admin
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api frontend

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
