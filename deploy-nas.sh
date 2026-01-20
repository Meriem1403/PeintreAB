#!/bin/bash

# Script de déploiement pour NAS
# Usage: ./deploy-nas.sh
# 
# IMPORTANT: Avant d'utiliser ce script :
# 1. Adaptez les chemins dans docker-compose.nas.yml selon votre NAS
# 2. Vérifiez que backend/.env est configuré correctement

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé. Veuillez l'installer d'abord."
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
fi

# Vérifier le fichier docker-compose.nas.yml
if [ ! -f "docker-compose.nas.yml" ]; then
    error "Le fichier docker-compose.nas.yml n'existe pas."
fi

# Vérifier le fichier .env du backend
if [ ! -f "backend/.env" ]; then
    warn "Le fichier backend/.env n'existe pas."
    if [ -f "backend/.env.example" ]; then
        info "Création du fichier .env à partir de .env.example..."
        cp backend/.env.example backend/.env
        warn "⚠️  IMPORTANT: Modifiez backend/.env avec vos vraies valeurs avant de continuer!"
        echo ""
        echo "Éditez le fichier avec: nano backend/.env"
        echo "Puis relancez ce script."
        exit 1
    else
        error "Le fichier backend/.env.example n'existe pas non plus."
    fi
fi

# Avertissement sur les chemins
warn "⚠️  Vérifiez que les chemins dans docker-compose.nas.yml sont corrects pour votre NAS!"
echo ""

# Arrêter les conteneurs existants
info "Arrêt des conteneurs existants..."
docker-compose -f docker-compose.nas.yml down 2>/dev/null || true

# Construire les images
info "Construction des images Docker..."
docker-compose -f docker-compose.nas.yml build --no-cache

# Démarrer les services
info "Démarrage des services..."
docker-compose -f docker-compose.nas.yml up -d

# Attendre que les services soient prêts
info "Attente du démarrage des services..."
sleep 15

# Vérifier l'état des conteneurs
info "Vérification de l'état des conteneurs..."
docker-compose -f docker-compose.nas.yml ps

# Afficher les logs
info "Affichage des logs (Ctrl+C pour quitter)..."
echo ""
docker-compose -f docker-compose.nas.yml logs -f
