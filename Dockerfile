# Dockerfile pour environnement de développement
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port de Vite (par défaut 5173)
EXPOSE 5173

# Démarrer le serveur de développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
