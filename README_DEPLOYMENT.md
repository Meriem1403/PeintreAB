# Guide de déploiement sur serveur personnel

Ce guide explique comment déployer le site sur un serveur personnel (local).

## 📋 Prérequis

- Serveur avec Linux (Ubuntu/Debian recommandé)
- Docker et Docker Compose installés
- Nom de domaine (optionnel mais recommandé pour le SEO)
- Accès root ou sudo

## 🚀 Installation sur serveur

### 1. Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install docker-compose -y

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Cloner le projet

```bash
# Créer un répertoire pour le projet
sudo mkdir -p /var/www/peintreab
cd /var/www/peintreab

# Cloner le dépôt Git
git clone https://github.com/Meriem1403/PeintreAB.git .

# Ou transférer les fichiers via SCP/SFTP
```

### 3. Configuration de l'environnement

```bash
# Créer le fichier .env pour le backend
cd backend
cp .env.example .env
nano .env
```

**Configuration `.env` backend :**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=peintreab_db
DB_USER=peintreab_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
JWT_SECRET=VOTRE_SECRET_JWT_TRES_SECURISE
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://www.alexandre-bindl.fr

# Configuration email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password
EMAIL_FROM=votre-email@gmail.com
```

### 4. Configuration du domaine (optionnel mais recommandé)

#### Option A : Avec nom de domaine

1. **Configurer le DNS** :
   - Créer un enregistrement A pointant vers l'IP publique de votre serveur
   - Pour `www.alexandre-bindl.fr` et `alexandre-bindl.fr` → `VOTRE_IP_PUBLIQUE`

2. **Installer Nginx** (reverse proxy) :
```bash
sudo apt install nginx -y

# Créer la configuration
sudo nano /etc/nginx/sites-available/peintreab
```

**Configuration Nginx :**
```nginx
server {
    listen 80;
    server_name artiste.votredomaine.fr;  # Votre domaine

    # Redirection vers HTTPS (si vous avez un certificat SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/peintreab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option B : Sans nom de domaine (IP uniquement)

Si vous utilisez uniquement une IP, mettez à jour les fichiers de configuration avec votre IP :

```bash
# Dans docker-compose.yml, index.html, sitemap.xml, robots.txt
# Remplacer les URLs par : http://VOTRE_IP:5173
```

### 5. SSL/HTTPS (recommandé pour le SEO)

```bash
# Installer Certbot pour Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Obtenir un certificat SSL
sudo certbot --nginx -d www.alexandre-bindl.fr -d alexandre-bindl.fr

# Le certificat sera renouvelé automatiquement
```

### 6. Démarrer l'application

```bash
cd /var/www/peintreab

# Construire et démarrer les conteneurs
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### 7. Configuration du firewall

```bash
# Autoriser les ports nécessaires
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5173/tcp  # Frontend (si accès direct)
sudo ufw allow 3000/tcp  # Backend (si accès direct, sinon bloquer)
sudo ufw enable
```

## 🔧 Configuration pour production

### 1. Mettre à jour les URLs dans les fichiers

**Dans `public/sitemap.xml`** :
```xml
<loc>https://artiste.votredomaine.fr/</loc>
```

**Dans `public/robots.txt`** :
```
Sitemap: https://artiste.votredomaine.fr/sitemap.xml
```

**Dans `index.html`** :
- Mettre à jour toutes les URLs avec votre domaine
- Mettre à jour les meta tags Open Graph

**Dans `docker-compose.yml`** :
```yaml
environment:
  - FRONTEND_URL=https://artiste.votredomaine.fr
```

### 2. Mode production avec Vite

Pour un build optimisé en production :

```bash
# Build de production
npm run build

# Le dossier dist/ contiendra les fichiers optimisés
```

Modifier `docker-compose.yml` pour utiliser le build de production :

```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile.prod  # Créer un Dockerfile pour production
  # ... reste de la config
```

### 3. Variables d'environnement production

```bash
# Dans docker-compose.yml
environment:
  - NODE_ENV=production
  - VITE_API_URL=https://artiste.votredomaine.fr/api
```

## 📊 Monitoring et maintenance

### Logs

```bash
# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Sauvegarde de la base de données

```bash
# Créer un script de sauvegarde
sudo nano /usr/local/bin/backup-peintreab.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/peintreab"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U peintreab_user peintreab_db > $BACKUP_DIR/backup_$DATE.sql

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-peintreab.sh

# Ajouter au cron (sauvegarde quotidienne à 2h du matin)
sudo crontab -e
# Ajouter : 0 2 * * * /usr/local/bin/backup-peintreab.sh
```

### Redémarrage automatique

```bash
# Créer un service systemd pour démarrer automatiquement
sudo nano /etc/systemd/system/peintreab.service
```

```ini
[Unit]
Description=PeintreAB Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/peintreab
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable peintreab
sudo systemctl start peintreab
```

## 🔒 Sécurité

### 1. Mots de passe forts
- Utilisez des mots de passe complexes pour la base de données
- Changez le JWT_SECRET en production
- Utilisez des App Passwords pour Gmail

### 2. Limiter l'accès
- Ne pas exposer directement les ports 3000 (backend) et 5432 (PostgreSQL)
- Utiliser Nginx comme reverse proxy
- Configurer le firewall correctement

### 3. Mises à jour
```bash
# Mettre à jour régulièrement
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d --build
```

## 📝 Checklist de déploiement

- [ ] Serveur préparé avec Docker et Docker Compose
- [ ] Fichiers du projet transférés sur le serveur
- [ ] Fichier `.env` configuré avec les bonnes valeurs
- [ ] URLs mises à jour dans tous les fichiers (sitemap, robots.txt, index.html)
- [ ] Nginx configuré (si utilisation d'un domaine)
- [ ] SSL/HTTPS configuré (recommandé)
- [ ] Firewall configuré
- [ ] Application démarrée et testée
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring des logs configuré

## 🆘 Dépannage

### L'application ne démarre pas
```bash
docker-compose logs
docker-compose ps
```

### Problème de connexion à la base de données
```bash
docker-compose exec postgres psql -U peintreab_user -d peintreab_db
```

### Redémarrer tous les services
```bash
docker-compose down
docker-compose up -d --build
```

### Vider le cache Docker
```bash
docker system prune -a
```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs : `docker-compose logs`
2. L'état des conteneurs : `docker-compose ps`
3. La connectivité réseau : `curl http://localhost:5173`
4. Les permissions des fichiers
