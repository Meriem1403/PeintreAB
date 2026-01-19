#!/bin/bash

# Script de configuration initiale pour PeintreAB
# Ce script configure l'environnement pour la première fois

set -e

echo "🔧 Configuration initiale de PeintreAB"
echo ""

# Vérifier les prérequis
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé."
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé."
    echo "Installez Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker et Docker Compose sont installés"
echo ""

# Créer le fichier .env du backend si il n'existe pas
if [ ! -f "backend/.env" ]; then
    echo "📝 Création du fichier backend/.env..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✓ Fichier backend/.env créé"
        echo ""
        echo "⚠️  IMPORTANT: Vous devez maintenant éditer backend/.env avec vos valeurs:"
        echo "   - DB_PASSWORD: Mot de passe pour PostgreSQL"
        echo "   - JWT_SECRET: Clé secrète pour les tokens JWT (générez une longue chaîne aléatoire)"
        echo "   - EMAIL_USER: Votre adresse Gmail"
        echo "   - EMAIL_PASSWORD: Votre App Password Gmail"
        echo ""
        echo "Pour éditer: nano backend/.env"
        echo ""
        read -p "Appuyez sur Entrée une fois que vous avez modifié le fichier .env..."
    else
        echo "❌ Le fichier backend/.env.example n'existe pas"
        exit 1
    fi
else
    echo "✓ Le fichier backend/.env existe déjà"
fi

# Générer un JWT_SECRET si il n'est pas défini
if grep -q "CHANGEZ_MOI_EN_PRODUCTION" backend/.env 2>/dev/null; then
    echo ""
    echo "🔑 Génération d'un JWT_SECRET aléatoire..."
    JWT_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
    else
        # Linux
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
    fi
    echo "✓ JWT_SECRET généré automatiquement"
fi

# Générer un mot de passe DB si il n'est pas défini
if grep -q "CHANGEZ_MOI_EN_PRODUCTION" backend/.env 2>/dev/null; then
    echo ""
    echo "🔑 Génération d'un mot de passe pour la base de données..."
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" backend/.env
        sed -i '' "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASSWORD/" docker-compose.yml
    else
        # Linux
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" backend/.env
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASSWORD/" docker-compose.yml
    fi
    echo "✓ Mot de passe DB généré automatiquement"
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Vérifiez/modifiez backend/.env si nécessaire"
echo "2. Lancez le déploiement avec: ./deploy.sh"
echo "   ou manuellement: docker-compose up -d --build"
echo ""
