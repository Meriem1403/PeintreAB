#!/bin/bash
# À lancer sur le NAS (Gestionnaire de tâches Synology).
# Corrige le crash « Cannot find package helmet ».

set -euo pipefail

ROOT="${PEINTREAB_ROOT:-/volume1/docker/peintreab}"
cd "$ROOT"

COMPOSE_FILE="docker-compose.yml"
if ! docker ps --format '{{.Names}}' | grep -q '^peintreab-mail$'; then
  if [ -f docker-compose.nas.yml ]; then
    COMPOSE_FILE="docker-compose.nas.yml"
  fi
fi

echo "[nas-fix-backend] dossier=$ROOT compose=$COMPOSE_FILE"

git fetch origin
git pull origin main

docker compose -f "$COMPOSE_FILE" build --no-cache backend
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --renew-anon-volumes backend

echo "[nas-fix-backend] OK — journal peintreab-backend doit être vert, sans erreur helmet."
