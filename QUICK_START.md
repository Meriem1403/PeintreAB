# 🚀 Démarrage rapide - PeintreAB

Guide ultra-simplifié pour démarrer le site en quelques minutes.

## ⚡ Installation en 3 étapes

### 1. Prérequis
Assurez-vous d'avoir installé :
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Configuration automatique

```bash
# Rendre les scripts exécutables
chmod +x setup.sh deploy.sh

# Lancer la configuration automatique
./setup.sh
```

Le script va :
- ✅ Vérifier que Docker est installé
- ✅ Créer le fichier `.env` à partir du template
- ✅ Générer automatiquement les mots de passe sécurisés
- ✅ Vous guider pour configurer l'email

### 3. Déploiement

```bash
# Déploiement automatique
./deploy.sh
```

Ou manuellement :
```bash
docker-compose up -d --build
```

## 🎉 C'est tout !

Votre site sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api

## 📝 Configuration de l'email (optionnel mais recommandé)

Pour recevoir les notifications par email :

1. Allez dans votre compte Google
2. Activez la validation en deux étapes
3. Créez un "App Password" :
   - Sécurité > Validation en deux étapes
   - Mots de passe des applications > Créer
4. Copiez le mot de passe généré
5. Éditez `backend/.env` :
   ```bash
   nano backend/.env
   ```
6. Modifiez :
   - `EMAIL_USER=votre-email@gmail.com`
   - `EMAIL_PASSWORD=votre-app-password`

## 🔧 Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Redémarrer les services
docker-compose restart

# Voir l'état des conteneurs
docker-compose ps

# Accéder à la base de données
docker-compose exec postgres psql -U peintreab_user -d peintreab_db
```

## 🆘 Problèmes courants

**Les conteneurs ne démarrent pas :**
```bash
docker-compose down
docker-compose up -d --build
```

**Erreur de connexion à la base de données :**
- Vérifiez que le mot de passe dans `backend/.env` correspond à celui dans `docker-compose.yml`

**Port déjà utilisé :**
- Modifiez les ports dans `docker-compose.yml` si 5173 ou 3000 sont déjà utilisés

## 📚 Documentation complète

- **Déploiement avancé** : Voir `README_DEPLOYMENT.md`
- **Configuration email** : Voir `README_EMAIL_SETUP.md`
- **SEO** : Voir `README_SEO.md`

## 🔐 Compte admin par défaut

- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Changez ce mot de passe en production !**
