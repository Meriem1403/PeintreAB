# Guide de transfert des données vers le NAS

Ce guide explique comment transférer vos données de test de votre machine locale vers le NAS pour éviter de tout réentrer.

> **Note Windows** : Si vous êtes sur Windows, consultez aussi [README_WINDOWS.md](README_WINDOWS.md) pour les commandes spécifiques.

## 📦 Méthode 1 : Export/Import via fichiers JSON (Recommandé)

### Étape 1 : Exporter les données depuis votre machine locale

#### Sur Windows :
```cmd
REM Via script batch
export-data.bat

REM Ou via PowerShell
.\export-data.ps1

REM Ou directement via npm
cd backend
npm run export-data
```

#### Sur Mac/Linux :
```bash
cd backend
npm run export-data
```

Cela créera un fichier `data-export.json` à la racine du projet avec toutes vos données.

### Étape 2 : Transférer le fichier sur le NAS

#### Option A : Via SCP
```bash
scp data-export.json admin@NAS-AL:/volume1/docker/peintreab/
```

#### Option B : Via l'interface web du NAS
1. Connectez-vous à l'interface web du NAS
2. Utilisez **File Station** (Synology) ou **File Manager** (QNAP)
3. Naviguez vers `/docker/peintreab/`
4. Téléversez le fichier `data-export.json`

### Étape 3 : Importer les données sur le NAS

```bash
# Se connecter au NAS via SSH
ssh admin@NAS-AL

# Aller dans le dossier du projet
cd /volume1/docker/peintreab/backend

# Importer les données (remplace les données existantes)
node migrations/importData.js ../data-export.json --clear

# Ou importer sans remplacer (ajoute seulement les nouvelles)
node migrations/importData.js ../data-export.json
```

## 📦 Méthode 2 : Transfert direct du volume PostgreSQL (Plus rapide)

### Étape 1 : Arrêter les conteneurs locaux

```bash
cd /Users/meriemzahzouh/epitech/PeintreAB
docker-compose down
```

### Étape 2 : Localiser le volume PostgreSQL local

```bash
docker volume inspect peintreab_postgres_data
```

Notez le chemin `Mountpoint` (ex: `/var/lib/docker/volumes/peintreab_postgres_data/_data`)

### Étape 3 : Transférer le volume vers le NAS

```bash
# Créer le dossier sur le NAS si nécessaire
ssh admin@NAS-AL "mkdir -p /volume1/docker/peintreab/postgres_data"

# Transférer les données (cela peut prendre du temps)
sudo rsync -avz /var/lib/docker/volumes/peintreab_postgres_data/_data/ admin@NAS-AL:/volume1/docker/peintreab/postgres_data/
```

**Note** : Vous devrez peut-être utiliser `sudo` pour accéder au volume Docker.

### Étape 4 : Démarrer les conteneurs sur le NAS

```bash
ssh admin@NAS-AL
cd /volume1/docker/peintreab
docker-compose -f docker-compose.nas.yml up -d
```

## 📦 Méthode 3 : Utiliser pg_dump/pg_restore (Recommandé pour grandes bases)

### Étape 1 : Exporter depuis votre machine locale

```bash
# Depuis votre machine locale
docker-compose exec postgres pg_dump -U peintreab_user peintreab_db > backup.sql
```

### Étape 2 : Transférer le fichier sur le NAS

```bash
scp backup.sql admin@NAS-AL:/volume1/docker/peintreab/
```

### Étape 3 : Restaurer sur le NAS

```bash
# Se connecter au NAS
ssh admin@NAS-AL

# Copier le fichier dans le conteneur
docker cp /volume1/docker/peintreab/backup.sql peintreab-db:/tmp/

# Restaurer
docker-compose exec postgres psql -U peintreab_user -d peintreab_db < /tmp/backup.sql
```

## ✅ Vérification

Après l'import, vérifiez que les données sont bien présentes :

```bash
# Sur le NAS
docker-compose exec postgres psql -U peintreab_user -d peintreab_db -c "SELECT COUNT(*) FROM works;"
docker-compose exec postgres psql -U peintreab_user -d peintreab_db -c "SELECT COUNT(*) FROM artist_info;"
docker-compose exec postgres psql -U peintreab_user -d peintreab_db -c "SELECT COUNT(*) FROM contact_info;"
```

## 🔄 Mise à jour des données

Si vous modifiez des données localement et voulez les transférer à nouveau :

1. Réexécutez `npm run export-data` localement
2. Retransférez le fichier `data-export.json` sur le NAS
3. Réexécutez l'import avec `--clear` pour remplacer les données

## 📝 Notes importantes

- **Sauvegarde** : Toujours faire une sauvegarde avant d'importer avec `--clear`
- **Images** : Les images dans `/public/images/` doivent aussi être transférées sur le NAS
- **Permissions** : Assurez-vous que les permissions sont correctes sur le NAS

## 🖼️ Transfert des images

Les images doivent aussi être transférées :

```bash
# Depuis votre machine locale
rsync -avz public/images/ admin@NAS-AL:/volume1/docker/peintreab/public/images/
```

Ou via l'interface web du NAS en téléversant le dossier `public/images/`.
