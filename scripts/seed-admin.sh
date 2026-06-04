#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.vps.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
export ENV_FILE

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile ops run --rm seed-admin
