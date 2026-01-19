# Alexandre Bindl - Galerie d'Artiste Peintre

Site web React pour exposer la galerie de l'artiste peintre Alexandre Bindl.

## ⚡ Démarrage rapide

Pour démarrer rapidement, consultez **[QUICK_START.md](QUICK_START.md)**.

```bash
# Configuration automatique
./setup.sh

# Déploiement
./deploy.sh
```

## 🚀 Technologies

- **React 19** - Bibliothèque JavaScript pour l'interface utilisateur
- **Vite 7** - Outil de build et serveur de développement
- **Docker** - Containerisation pour l'environnement de développement

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (version 20 ou supérieure)
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)

## 🐳 Développement avec Docker

### Démarrer l'application

```bash
# Construire et démarrer le conteneur
docker-compose up --build

# Ou en mode détaché (en arrière-plan)
docker-compose up -d --build
```

L'application sera accessible sur **http://localhost:5173**

### Arrêter l'application

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes (attention : supprime node_modules)
docker-compose down -v
```

### Voir les logs

```bash
docker-compose logs -f web
```

### Reconstruire l'image

```bash
docker-compose build --no-cache
```

## 💻 Développement local (sans Docker)

### Installation

```bash
npm install
```

### Lancer le serveur de développement

```bash
npm run dev
```

### Build pour production

```bash
npm run build
```

### Prévisualiser le build de production

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## 📁 Structure du projet

```
AlexandreBindl/
├── public/           # Fichiers statiques
├── src/
│   ├── assets/      # Ressources (images, etc.)
│   ├── components/  # Composants React réutilisables
│   ├── hooks/       # Hooks personnalisés
│   ├── layouts/     # Layouts de pages
│   ├── pages/       # Pages de l'application
│   ├── utils/       # Fonctions utilitaires
│   ├── App.jsx      # Composant principal
│   ├── main.jsx     # Point d'entrée
│   └── index.css    # Styles globaux
├── Dockerfile       # Configuration Docker
├── docker-compose.yml  # Orchestration Docker
└── package.json     # Dépendances npm
```

## 🔧 Configuration

- Le port par défaut est **5173** (configurable dans `docker-compose.yml`)
- Le hot-reload est activé avec les volumes Docker
- Les modifications dans `src/` sont automatiquement reflétées dans le conteneur

## 📝 Notes

- Les `node_modules` ne sont pas montés en volume pour éviter les conflits entre OS
- Le mode développement utilise `--host 0.0.0.0` pour permettre l'accès depuis l'extérieur du conteneur
