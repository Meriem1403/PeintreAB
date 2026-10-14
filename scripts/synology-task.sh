#!/bin/sh
# À coller tel quel dans le Gestionnaire de tâches Synology (utilisateur root).
set -e

APP="/volume1/docker/apps/PeintreAB"
LOG="$APP/update.log"
DOCKER="/usr/local/bin/docker"
GIT="$DOCKER run --rm -v $APP:/repo alpine/git -C /repo"

{
  echo ""
  echo "==== $(date) ===="
  cd "$APP" || exit 1

  # Sauvegarde .env local (au cas où)
  mkdir -p "$APP/.local-backup"
  [ -f backend/.env ] && cp -a backend/.env "$APP/.local-backup/env.bak.$(date +%Y%m%d%H%M%S)"

  $GIT fetch origin main
  $GIT reset --hard origin/main

  # Utiliser le modèle NAS versionné (admins + https + CORS)
  if [ -f backend/.env.nas ]; then
    cp -a backend/.env.nas backend/.env
    echo "backend/.env ← .env.nas"
  elif [ -f "$APP/.local-backup/env.bak" ]; then
    cp -a "$APP/.local-backup/env.bak" backend/.env
    echo "backend/.env ← ancienne sauvegarde (pas de .env.nas)"
  fi

  # Port Postgres local NAS (conserve ton mapping 5434)
  sed -i 's/"5432:5432"/"5434:5432"/g' docker-compose.yml

  # Forcer HTTPS (le site est en https)
  if grep -q '^FRONTEND_URL=' backend/.env; then
    sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://www.alexandre-bindl.fr|' backend/.env
  else
    echo 'FRONTEND_URL=https://www.alexandre-bindl.fr' >> backend/.env
  fi

  # S’assurer des comptes admin de test
  grep -q '^ADMIN_EMAIL=' backend/.env || echo 'ADMIN_EMAIL=alexandre.bindl@gmail.com' >> backend/.env
  grep -q '^ADMIN_PASSWORD=' backend/.env || echo 'ADMIN_PASSWORD=admin123' >> backend/.env
  grep -q '^ADMIN_EMAIL_2=' backend/.env || echo 'ADMIN_EMAIL_2=meriemzahzouh@gmail.com' >> backend/.env
  grep -q '^ADMIN_PASSWORD_2=' backend/.env || echo 'ADMIN_PASSWORD_2=admin123' >> backend/.env

  if ! grep -q 'open-v4' backend/src/server.js; then
    echo "ERREUR: server.js sans open-v4 après git reset"
    exit 1
  fi
  echo "OK: server.js contient open-v4"

  # Rebuild réel du backend (sinon ancien CORS / ancien code)
  $DOCKER compose build --no-cache backend
  $DOCKER compose up -d --force-recreate --renew-anon-volumes backend
  $DOCKER compose up -d --force-recreate frontend

  sleep 15
  $DOCKER compose exec -T backend npm run migrate || true
  $DOCKER compose restart backend || true

  echo "Commit actuel :"
  $GIT log -1 --oneline
  echo "OK update terminé"
  $DOCKER compose ps
  echo "TEST health: doit contenir cors open-v4"
  echo "Login: meriemzahzouh@gmail.com / admin123"
} >> "$LOG" 2>&1
