#!/bin/sh
# Gestionnaire de tâches Synology — coller TEL QUEL (utilisateur: root)
# Nettoie les conteneurs fantômes, met à jour le code, redémarre le site.

APP="/volume1/docker/apps/PeintreAB"
LOG="$APP/update.log"
DOCKER="/usr/local/bin/docker"
GIT="$DOCKER run --rm -v $APP:/repo alpine/git -C /repo"

{
  echo ""
  echo "==== $(date) ===="
  cd "$APP" || exit 1

  mkdir -p "$APP/.local-backup"
  [ -f backend/.env ] && cp -a backend/.env "$APP/.local-backup/env.bak"

  echo "== git =="
  $GIT fetch origin main
  $GIT reset --hard origin/main
  echo "Commit: $($GIT log -1 --oneline)"

  echo "== .env =="
  if [ -f backend/.env.nas ]; then
    cp -a backend/.env.nas backend/.env
  elif [ -f "$APP/.local-backup/env.bak" ]; then
    cp -a "$APP/.local-backup/env.bak" backend/.env
  fi

  # Port Postgres NAS
  sed -i 's/"5432:5432"/"5434:5432"/g' docker-compose.yml 2>/dev/null || true

  # Corrections obligatoires pour que le backend reste UP
  if [ -f backend/.env ]; then
    if grep -q '^FRONTEND_URL=' backend/.env; then
      sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://www.alexandre-bindl.fr|' backend/.env
    else
      echo 'FRONTEND_URL=https://www.alexandre-bindl.fr' >> backend/.env
    fi
    if grep -q '^NODE_ENV=' backend/.env; then
      sed -i 's|^NODE_ENV=.*|NODE_ENV=development|' backend/.env
    else
      echo 'NODE_ENV=development' >> backend/.env
    fi
    grep -q '^ADMIN_EMAIL=' backend/.env || echo 'ADMIN_EMAIL=alexandre.bindl@gmail.com' >> backend/.env
    grep -q '^ADMIN_PASSWORD=' backend/.env || echo 'ADMIN_PASSWORD=admin123' >> backend/.env
    grep -q '^ADMIN_EMAIL_2=' backend/.env || echo 'ADMIN_EMAIL_2=meriemzahzouh@gmail.com' >> backend/.env
    grep -q '^ADMIN_PASSWORD_2=' backend/.env || echo 'ADMIN_PASSWORD_2=admin123' >> backend/.env
  fi

  echo "== nettoyage conteneurs fantômes =="
  # Supprime TOUS les anciens backend/frontend du projet (y compris noms bizarres)
  $DOCKER rm -f peintreab-backend peintreab-frontend 2>/dev/null || true
  $DOCKER ps -a --filter "name=peintreab-backend" -q | while read id; do
    [ -n "$id" ] && $DOCKER rm -f "$id" 2>/dev/null || true
  done
  $DOCKER ps -a --filter "name=peintreab-frontend" -q | while read id; do
    [ -n "$id" ] && $DOCKER rm -f "$id" 2>/dev/null || true
  done
  # Orphelins type 49ea1a11e43b_peintreab-backend
  $DOCKER ps -a --format '{{.ID}} {{.Names}}' | grep peintreab-backend | awk '{print $1}' | while read id; do
    [ -n "$id" ] && $DOCKER rm -f "$id" 2>/dev/null || true
  done

  echo "== compose down (garde postgres + volumes data) =="
  $DOCKER compose down --remove-orphans || true
  # Remet db/mail si down les a arrêtés — on relance tout juste après

  echo "== build + up =="
  $DOCKER compose build backend || echo "WARN: build backend"
  $DOCKER compose up -d postgres mailpit 2>/dev/null || $DOCKER compose up -d db mail 2>/dev/null || true
  $DOCKER compose up -d
  sleep 20

  echo "== migrate =="
  $DOCKER compose exec -T backend npm run migrate || echo "WARN: migrate (backend peut encore démarrer)"

  sleep 8
  echo "== état =="
  $DOCKER compose ps
  $DOCKER ps -a --filter "name=peintreab" --format "table {{.Names}}\t{{.Status}}"

  echo "OK update terminé"
  echo "Test: https://www.alexandre-bindl.fr/api/health"
  echo "Login: meriemzahzouh@gmail.com / admin123"
} >> "$LOG" 2>&1
