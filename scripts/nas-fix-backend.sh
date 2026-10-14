#!/bin/bash
# Gestionnaire de tâches Synology — met à jour le code + backend + frontend.

set -euo pipefail

ROOT="${PEINTREAB_ROOT:-/volume1/docker/apps/PeintreAB}"
cd "$ROOT"

COMPOSE_FILE="docker-compose.yml"
if [ -f docker-compose.nas.yml ] && ! docker ps --format '{{.Names}}' | grep -q '^peintreab-mail$'; then
  COMPOSE_FILE="docker-compose.nas.yml"
fi

echo "[nas-fix] dossier=$ROOT compose=$COMPOSE_FILE"

git fetch origin
git pull origin main

if [ -f backend/.env.nas ]; then
  cp backend/.env.nas backend/.env
  echo "[nas-fix] backend/.env ← .env.nas"
fi

# Force rechargement du code monté
touch backend/src/server.js vite.config.js || true

docker compose -f "$COMPOSE_FILE" stop backend frontend || true
docker compose -f "$COMPOSE_FILE" rm -f -v backend || true

docker compose -f "$COMPOSE_FILE" build --no-cache backend
docker compose -f "$COMPOSE_FILE" up -d --force-recreate --renew-anon-volumes backend
docker compose -f "$COMPOSE_FILE" up -d --force-recreate frontend

sleep 12
docker compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || true

echo "[nas-fix] Vérifie https://www.alexandre-bindl.fr/api/health → doit contenir cors:open-v3"
echo "[nas-fix] Login : meriemzahzouh@gmail.com / admin123"
