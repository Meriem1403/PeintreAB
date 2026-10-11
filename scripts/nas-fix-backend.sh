#!/bin/bash
# Gestionnaire de tâches Synology — reconstruit le backend (fix helmet).

set -euo pipefail

ROOT="${PEINTREAB_ROOT:-/volume1/docker/apps/PeintreAB}"
cd "$ROOT"

COMPOSE_FILE="docker-compose.yml"
if [ -f docker-compose.nas.yml ] && ! docker ps --format '{{.Names}}' | grep -q '^peintreab-mail$'; then
  COMPOSE_FILE="docker-compose.nas.yml"
fi

echo "[nas-fix-backend] dossier=$ROOT compose=$COMPOSE_FILE"

git fetch origin
git pull origin main

if [ -f backend/.env.nas ]; then
  cp backend/.env.nas backend/.env
  echo "[nas-fix-backend] backend/.env ← .env.nas"
fi

# Supprime l’ancien conteneur + volumes anonymes (vieux node_modules sans helmet)
docker compose -f "$COMPOSE_FILE" stop backend || true
docker compose -f "$COMPOSE_FILE" rm -f -v backend || true

docker compose -f "$COMPOSE_FILE" build --no-cache backend
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --renew-anon-volumes backend

echo "[nas-fix-backend] OK — attendre ~1 min puis vérifier le journal (plus d’erreur helmet)."
