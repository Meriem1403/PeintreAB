#!/bin/bash
# Mise à jour code + redémarrage frontend (à lancer SUR le serveur / NAS, dans le dossier du projet).
# Usage:
#   ./update-deploy.sh              # docker-compose.yml (dev / serveur classique)
#   ./update-deploy.sh nas          # docker-compose.nas.yml

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
if [ "${1:-}" = "nas" ]; then
  COMPOSE_FILE="docker-compose.nas.yml"
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "📁 Dossier de déploiement : $ROOT"
echo "📄 Compose : $COMPOSE_FILE"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Ce dossier n'est pas un dépôt git. Le conteneur ne verra pas vos changements."
  exit 1
fi

echo "⬇️  git pull…"
git fetch origin
git pull origin main

COMMIT="$(git rev-parse --short HEAD)"
echo "✅ Commit déployé : $COMMIT — $(git log -1 --format=%s)"

if [ -f backend/.env.nas ]; then
  cp backend/.env.nas backend/.env
  echo "📝 backend/.env mis à jour depuis backend/.env.nas"
fi

mkdir -p public
printf '{"commit":"%s","deployedAt":"%s"}\n' "$(git rev-parse HEAD)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > public/build-info.json

if ! command -v docker-compose >/dev/null 2>&1 && command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    DC() { docker compose -f "$COMPOSE_FILE" "$@"; }
  else
    echo "❌ docker compose / docker-compose introuvable."
    exit 1
  fi
else
  DC() { docker-compose -f "$COMPOSE_FILE" "$@"; }
fi

echo "🔨 Rebuild backend (dépendances npm : helmet, etc.) + renouvellement node_modules…"
# --renew-anon-volumes : évite l’ancien volume /app/node_modules sans les nouveaux packages
DC build --no-cache backend
DC up -d --force-recreate --renew-anon-volumes backend

echo "🔄 Redémarrage du frontend (Vite relit les fichiers montés)…"
DC restart frontend 2>/dev/null || DC up -d --force-recreate frontend

sleep 6

if DC exec -T backend node -e "import('helmet').then(()=>console.log('helmet ok')).catch(e=>{console.error(e);process.exit(1)})" 2>/dev/null; then
  echo "✅ Conteneur backend : package helmet présent."
else
  echo "⚠️  Backend : helmet toujours absent — lancez :"
  echo "   docker compose -f $COMPOSE_FILE exec backend npm install"
  echo "   puis redémarrez peintreab-backend."
fi

if DC exec -T frontend test -f /app/src/utils/ticketExport.js 2>/dev/null; then
  if DC exec -T frontend grep -q saveTicketQrImage /app/src/utils/ticketExport.js 2>/dev/null; then
    echo "✅ Conteneur frontend : sources à jour (saveTicketQrImage présent)."
  else
    echo "⚠️  Le conteneur ne voit PAS le dernier code — vérifiez les volumes dans $COMPOSE_FILE"
    echo "   (chemins absolus NAS vs dossier où vous avez fait git pull)."
  fi
else
  echo "⚠️  Impossible de lire /app/src dans le conteneur frontend."
fi

echo ""
echo "🌐 Vérifications côté navigateur :"
echo "   • Hard refresh : Safari iOS → effacer historique cache, ou recharger sans cache"
echo "   • Fichier public : https://VOTRE-DOMAINE/build-info.json doit afficher commit $COMMIT"
echo "   • Si nginx sert un dossier dist/ statique : lancer aussi « npm ci && npm run build » et copier dist/"
echo "   • Backend OK : journal peintreab-backend sans « Cannot find package 'helmet' »"
