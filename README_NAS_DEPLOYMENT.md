# Guide de déploiement sur NAS-AL

Ce guide explique comment déployer le site PeintreAB sur un NAS (Network Attached Storage).

## 📋 Prérequis

- NAS avec Docker installé (Synology, QNAP, ou autre)
- Accès SSH ou interface web du NAS
- Nom de domaine configuré (optionnel mais recommandé)

## 🚀 Installation sur NAS

### 1. Préparer le NAS

#### Pour Synology :
1. Ouvrez **Package Center**
2. Installez **Docker** (si pas déjà installé)
3. Ouvrez **Docker** → **Registry** → Recherchez et téléchargez les images nécessaires

#### Pour QNAP :
1. Ouvrez **App Center**
2. Installez **Container Station** (si pas déjà installé)
3. Container Station gère Docker automatiquement

### 2. Transférer les fichiers sur le NAS

#### Option A : Via SSH/SCP
```bash
# Depuis votre machine locale
scp -r /Users/meriemzahzouh/epitech/PeintreAB admin@NAS-AL:/volume1/docker/peintreab
```

#### Option B : Via interface web du NAS
1. Connectez-vous à l'interface web du NAS
2. Utilisez **File Station** (Synology) ou **File Manager** (QNAP)
3. Créez un dossier : `/docker/peintreab` (ou `/volume1/docker/peintreab`)
4. Transférez tous les fichiers du projet

#### Option C : Via Git (si le NAS a Git installé)
```bash
# Via SSH sur le NAS
ssh admin@NAS-AL
cd /volume1/docker
git clone https://github.com/Meriem1403/PeintreAB.git peintreab
cd peintreab
```

### 3. Configuration de l'environnement

#### Créer le fichier `.env` pour le backend

Sur le NAS, éditez `backend/.env` :

```env
# Configuration Base de données
DB_HOST=postgres
DB_PORT=5432
DB_NAME=peintreab_db
DB_USER=peintreab_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE_ICI

# Configuration JWT
JWT_SECRET=VOTRE_SECRET_JWT_TRES_SECURISE_ICI
JWT_EXPIRES_IN=7d
PORT=3000

# URL du frontend (adapter selon votre configuration)
FRONTEND_URL=http://www.alexandre-bindl.fr
# Ou si vous utilisez l'IP du NAS :
# FRONTEND_URL=http://192.168.1.XXX:5173

# Configuration Email Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password-gmail
EMAIL_FROM=votre-email@gmail.com
```

### 4. Configuration Docker Compose pour NAS

Le fichier `docker-compose.yml` devrait fonctionner tel quel, mais vous pouvez créer un `docker-compose.nas.yml` pour adapter les ports :

```yaml
version: '3.8'

services:
  postgres:
    ports:
      - "5432:5432"  # Adapter si nécessaire
    volumes:
      - /volume1/docker/peintreab/postgres_data:/var/lib/postgresql/data

  backend:
    ports:
      - "3000:3000"  # Adapter si nécessaire
    volumes:
      - /volume1/docker/peintreab/backend/src:/app/src
      - /volume1/docker/peintreab/backend/migrations:/app/migrations
      - /volume1/docker/peintreab/backend/.env:/app/.env

  frontend:
    ports:
      - "5173:5173"  # Adapter si nécessaire
    volumes:
      - /volume1/docker/peintreab/src:/app/src
      - /volume1/docker/peintreab/public:/app/public
```

**Important** : Adaptez les chemins `/volume1/docker/peintreab` selon votre NAS :
- Synology : `/volume1/docker/peintreab` ou `/docker/peintreab`
- QNAP : `/share/Container/peintreab` ou `/share/CACHEDEV1_DATA/peintreab`

### 5. Déploiement via interface web du NAS

#### Pour Synology :
1. Ouvrez **Docker** → **Container**
2. Cliquez sur **Create** → **From docker-compose.yml**
3. Sélectionnez le fichier `docker-compose.yml`
4. Cliquez sur **Next** puis **Done**

#### Pour QNAP :
1. Ouvrez **Container Station**
2. Allez dans **Compose**
3. Cliquez sur **Create** → **From File**
4. Sélectionnez `docker-compose.yml`
5. Cliquez sur **Create**

### 6. Déploiement via SSH (recommandé)

```bash
# Se connecter au NAS
ssh admin@NAS-AL

# Aller dans le dossier du projet
cd /volume1/docker/peintreab

# Arrêter les conteneurs existants (si nécessaire)
docker-compose down

# Construire et démarrer
docker-compose build
docker-compose up -d

# Vérifier l'état
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 7. Configuration du Reverse Proxy (optionnel mais recommandé)

#### Pour Synology (avec DSM) :

1. Ouvrez **Control Panel** → **Login Portal** → **Advanced** → **Reverse Proxy**
2. Créez une nouvelle règle :
   - **Description** : PeintreAB
   - **Source** :
     - Protocol : HTTPS
     - Hostname : www.alexandre-bindl.fr
     - Port : 443
   - **Destination** :
     - Protocol : HTTP
     - Hostname : localhost
     - Port : 5173

#### Pour QNAP :

1. Ouvrez **Control Panel** → **Network & Virtual Switch** → **Reverse Proxy**
2. Créez une nouvelle règle similaire

### 8. Configuration SSL/HTTPS (recommandé)

#### Option A : Certificat Let's Encrypt (gratuit)

**Pour Synology :**
1. **Control Panel** → **Security** → **Certificate**
2. Ajoutez un nouveau certificat
3. Sélectionnez "Get a certificate from Let's Encrypt"
4. Entrez votre domaine : `www.alexandre-bindl.fr`
5. Configurez le reverse proxy pour utiliser ce certificat

**Pour QNAP :**
1. **Control Panel** → **Security** → **Certificate & Private Key**
2. Utilisez l'assistant Let's Encrypt

#### Option B : Certificat auto-signé (pour test local)

Généré automatiquement par le NAS, mais les navigateurs afficheront un avertissement.

### 9. Configuration du Firewall

Assurez-vous que les ports suivants sont ouverts :
- **80** (HTTP)
- **443** (HTTPS)
- **3000** (Backend API - optionnel, peut rester interne)
- **5173** (Frontend - optionnel si reverse proxy configuré)

### 10. Vérification

1. **Vérifier les conteneurs** :
   ```bash
   docker-compose ps
   ```
   Tous les conteneurs doivent être "Up"

2. **Vérifier les logs** :
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Tester l'accès** :
   - Frontend : `http://NAS-AL-IP:5173` ou `http://www.alexandre-bindl.fr`
   - Backend API : `http://NAS-AL-IP:3000/api/health`

### 11. Mise à jour automatique (optionnel)

Pour mettre à jour automatiquement depuis Git :

```bash
# Créer un script de mise à jour
nano /volume1/docker/peintreab/update.sh
```

```bash
#!/bin/bash
cd /volume1/docker/peintreab
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

```bash
chmod +x update.sh
```

### 12. Sauvegarde automatique (recommandé)

Configurez une sauvegarde régulière de :
- `/volume1/docker/peintreab/postgres_data` (base de données)
- `/volume1/docker/peintreab/backend/.env` (configuration)
- `/volume1/docker/peintreab/public/images` (images)

Utilisez l'outil de sauvegarde intégré du NAS (Hyper Backup pour Synology, Backup Station pour QNAP).

## 📦 Transfert des données de test

Si vous avez des données de test sur votre machine locale et souhaitez les transférer sur le NAS pour éviter de tout réentrer, consultez le guide détaillé : **[README_DATA_TRANSFER.md](README_DATA_TRANSFER.md)**

### Méthode rapide (Export/Import JSON)

1. **Exporter depuis votre machine locale** :
   ```bash
   cd backend
   npm run export-data
   ```
   Cela crée un fichier `data-export.json` avec toutes vos données.

2. **Transférer le fichier sur le NAS** :
   ```bash
   scp data-export.json admin@NAS-AL:/volume1/docker/peintreab/
   ```

3. **Importer sur le NAS** :
   ```bash
   ssh admin@NAS-AL
   cd /volume1/docker/peintreab/backend
   node migrations/importData.js ../data-export.json --clear
   ```

## 🔧 Dépannage

### Les conteneurs ne démarrent pas
```bash
# Vérifier les logs
docker-compose logs

# Vérifier les permissions
ls -la /volume1/docker/peintreab
```

### Problème de connexion à la base de données
- Vérifiez que le conteneur `postgres` est démarré
- Vérifiez les variables d'environnement dans `backend/.env`

### Problème d'accès depuis l'extérieur
- Vérifiez le firewall du NAS
- Vérifiez la configuration du routeur (port forwarding)
- Vérifiez la configuration DNS

### Redémarrer les services
```bash
cd /volume1/docker/peintreab
docker-compose restart
```

### Arrêter complètement
```bash
docker-compose down
```

### Voir l'utilisation des ressources
```bash
docker stats
```

## 📝 Notes importantes

1. **Sécurité** :
   - Changez tous les mots de passe par défaut
   - Utilisez des mots de passe forts pour la base de données et JWT
   - Ne partagez jamais le fichier `.env`

2. **Performance** :
   - Les NAS ont généralement moins de RAM qu'un serveur dédié
   - Surveillez l'utilisation des ressources
   - Considérez limiter les ressources Docker si nécessaire

3. **Maintenance** :
   - Mettez à jour régulièrement Docker et les images
   - Faites des sauvegardes régulières
   - Surveillez les logs pour détecter les erreurs

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez l'état des conteneurs : `docker-compose ps`
3. Vérifiez la configuration : `cat backend/.env`
4. Consultez la documentation de votre NAS
