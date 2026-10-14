#!/bin/bash
# Script NAS / Gestionnaire de tâches Synology.
# Écrit dans update.log (comme ton ancienne tâche).
#
# Contenu à coller dans la tâche Synology (utilisateur root) :
#   cd /volume1/docker/apps/PeintreAB && bash update-deploy.sh >> update.log 2>&1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
LOG="$ROOT/update.log"

{
  echo ""
  echo "==== $(date) ===="
  echo "Dossier: $ROOT"

  if ! command -v git >/dev/null 2>&1; then
    echo "ERREUR: git introuvable — installe Git Server / ajoute git au PATH"
    exit 1
  fi

  COMPOSE_FILE="docker-compose.yml"
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^peintreab-mail$'; then
    COMPOSE_FILE="docker-compose.yml"
  elif [ -f docker-compose.nas.yml ]; then
    COMPOSE_FILE="docker-compose.nas.yml"
  fi
  echo "Compose: $COMPOSE_FILE"

  echo "git fetch + reset hard origin/main…"
  git fetch origin
  git checkout main
  git reset --hard origin/main

  COMMIT="$(git rev-parse --short HEAD)"
  echo "Commit actuel :"
  echo "$COMMIT $(git log -1 --format=%s)"

  if [ -f backend/.env.nas ]; then
    cp backend/.env.nas backend/.env
    echo "backend/.env ← .env.nas"
  fi

  if ! grep -q 'open-v4' backend/src/server.js; then
    echo "ERREUR: server.js sans open-v4 après git reset — mauvais dépôt ?"
    exit 1
  fi
  echo "OK: server.js contient open-v4"

  mkdir -p public
  printf '{"commit":"%s","deployedAt":"%s"}\n' "$(git rev-parse HEAD)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > public/build-info.json

  if docker compose version >/dev/null 2>&1; then
    DC() { docker compose -f "$COMPOSE_FILE" "$@"; }
  elif command -v docker-compose >/dev/null 2>&1; then
    DC() { docker-compose -f "$COMPOSE_FILE" "$@"; }
  else
    echo "ERREUR: docker compose introuvable"
    exit 1
  fi

  echo "Rebuild backend + recreate…"
  DC stop backend frontend || true
  DC rm -f -v backend || true
  DC build --no-cache backend
  DC up -d --force-recreate --renew-anon-volumes backend
  DC up -d --force-recreate frontend

  sleep 15
  DC exec -T backend npm run migrate || true

  if DC exec -T backend sh -c "grep -q open-v4 /app/src/server.js"; then
    echo "CONTAINER_SRC=open-v4 OK"
  else
    echo "ATTENTION: le conteneur ne voit pas open-v4 (volume src incorrect)"
  fi

  DC restart backend || true
  sleep 5

  echo "OK update terminé"
  DC ps
  echo "TEST: https://www.alexandre-bindl.fr/api/health doit contenir \"cors\":\"open-v4\""
  echo "Login: meriemzahzouh@gmail.com / admin123"
} 2>&1 | tee -a "$LOG"
