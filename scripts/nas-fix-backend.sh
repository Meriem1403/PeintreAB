#!/bin/bash
# Gestionnaire de tâches Synology — mise à jour forcée + log.

set -euo pipefail

LOG="/volume1/docker/apps/PeintreAB/nas-fix.log"
ROOT=""

for candidate in \
  /volume1/docker/apps/PeintreAB \
  /docker/apps/PeintreAB \
  "$(dirname "$0")/.."
do
  if [ -d "$candidate/.git" ] && [ -f "$candidate/docker-compose.yml" ]; then
    ROOT="$candidate"
    break
  fi
done

if [ -z "$ROOT" ]; then
  echo "ERREUR: dossier projet introuvable" | tee -a "$LOG"
  exit 1
fi

{
  echo "==== $(date) ===="
  echo "ROOT=$ROOT"
  cd "$ROOT"

  COMPOSE_FILE="docker-compose.yml"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^peintreab-mail$'; then
    COMPOSE_FILE="docker-compose.yml"
  elif [ -f docker-compose.nas.yml ]; then
    COMPOSE_FILE="docker-compose.nas.yml"
  fi
  echo "COMPOSE=$COMPOSE_FILE"

  git fetch origin
  git checkout main
  git pull origin main
  echo "COMMIT=$(git rev-parse --short HEAD) $(git log -1 --format=%s)"

  if [ -f backend/.env.nas ]; then
    cp backend/.env.nas backend/.env
    echo "ENV: .env.nas → .env"
  fi

  if ! grep -q 'open-v4' backend/src/server.js; then
    echo "ERREUR: backend/src/server.js sans open-v4 après git pull"
    exit 1
  fi
  echo "OK: server.js contient open-v4"

  docker compose -f "$COMPOSE_FILE" stop backend frontend || true
  docker compose -f "$COMPOSE_FILE" rm -f -v backend || true
  docker compose -f "$COMPOSE_FILE" build --no-cache backend
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate --renew-anon-volumes backend
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate frontend

  sleep 15
  docker compose -f "$COMPOSE_FILE" exec -T backend npm run migrate || true

  # Vérifie que le code monté dans le conteneur est à jour
  docker compose -f "$COMPOSE_FILE" exec -T backend sh -c "grep -q open-v4 /app/src/server.js && echo CONTAINER_SRC=open-v4 OK" \
    || echo "ATTENTION: le conteneur ne voit pas open-v4 (volume / chemin incorrect)"

  docker compose -f "$COMPOSE_FILE" restart backend
  sleep 8

  echo "FIN OK — tester https://www.alexandre-bindl.fr/api/health (doit afficher cors:open-v4)"
  echo "Login: meriemzahzouh@gmail.com / admin123"
} 2>&1 | tee -a "$LOG"
