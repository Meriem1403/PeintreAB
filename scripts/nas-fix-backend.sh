#!/bin/bash
# Gestionnaire de tâches Synology — reconstruit le backend (fix helmet / deps).

set -euo pipefail

ROOT="${PEINTREAB_ROOT:-/docker/apps/PeintreAB}"
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

# Applique le modèle NAS versionné → .env local (non versionné)
if [ -f backend/.env.nas ]; then
  cp backend/.env.nas backend/.env
  echo "[nas-fix-backend] backend/.env mis à jour depuis .env.nas"
fi

docker compose -f "$COMPOSE_FILE" build --no-cache backend
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --renew-anon-volumes backend

echo "[nas-fix-backend] OK — peintreab-backend doit être vert."
