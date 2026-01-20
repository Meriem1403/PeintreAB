# Guide Windows pour PeintreAB

Ce guide explique comment utiliser le projet PeintreAB sur Windows.

## 📋 Prérequis Windows

- **Node.js** (v20 ou supérieur) : [Télécharger](https://nodejs.org/)
- **Docker Desktop** : [Télécharger](https://www.docker.com/products/docker-desktop/)
- **Git** (optionnel) : [Télécharger](https://git-scm.com/download/win)
- **Navigateur moderne** : Chrome 90+, Edge 90+, ou Firefox 88+ (voir [Guide de compatibilité navigateurs](README_BROWSER_COMPATIBILITY.md))

## 🚀 Installation

### 1. Cloner le projet

```powershell
# Via PowerShell ou CMD
git clone https://github.com/Meriem1403/PeintreAB.git
cd PeintreAB
```

### 2. Installer les dépendances

```powershell
# Installer les dépendances du frontend
npm install

# Installer les dépendances du backend
cd backend
npm install
cd ..
```

### 3. Configurer l'environnement

Créez le fichier `backend/.env` en copiant `backend/.env.example` :

```powershell
# Via PowerShell
Copy-Item backend\.env.example backend\.env

# Via CMD
copy backend\.env.example backend\.env
```

Éditez `backend/.env` avec vos paramètres.

### 4. Démarrer avec Docker

```powershell
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 📦 Export/Import des données

### Export des données (Windows)

#### Option 1 : Via script batch (.bat)
```cmd
export-data.bat
```

#### Option 2 : Via script PowerShell (.ps1)
```powershell
.\export-data.ps1
```

#### Option 3 : Via npm directement
```powershell
cd backend
npm run export-data
cd ..
```

### Import des données (Windows)

#### Option 1 : Via script batch (.bat)
```cmd
REM Importer sans remplacer
import-data.bat

REM Importer en remplaçant les données existantes
import-data.bat data-export.json --clear
```

#### Option 2 : Via script PowerShell (.ps1)
```powershell
# Importer sans remplacer
.\import-data.ps1

# Importer en remplaçant les données existantes
.\import-data.ps1 -ImportFile "data-export.json" -Clear
```

#### Option 3 : Via npm directement
```powershell
cd backend
node migrations/importData.js ..\data-export.json
# Ou avec --clear pour remplacer
node migrations/importData.js ..\data-export.json --clear
cd ..
```

## 🔧 Commandes utiles

### Docker Compose

```powershell
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Redémarrer un service
docker-compose restart backend

# Reconstruire les images
docker-compose build --no-cache
```

### Base de données

```powershell
# Se connecter à PostgreSQL
docker-compose exec postgres psql -U peintreab_user -d peintreab_db

# Exécuter les migrations
docker-compose exec backend npm run migrate

# Scanner et ajouter les images
docker-compose exec backend npm run scan-seed
```

## ⚠️ Problèmes courants sur Windows

### 1. Erreur de permissions PowerShell

Si vous obtenez une erreur "execution policy", exécutez :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Chemins de fichiers avec espaces

Si votre chemin contient des espaces, utilisez des guillemets :

```powershell
cd "C:\Users\Mon Nom\Documents\PeintreAB"
```

### 3. Ports déjà utilisés

Si le port 3000 ou 5173 est déjà utilisé :

```powershell
# Voir les processus utilisant le port
netstat -ano | findstr :3000

# Arrêter le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F
```

### 4. Docker Desktop ne démarre pas

- Vérifiez que la virtualisation est activée dans le BIOS
- Vérifiez que WSL2 est installé et activé
- Redémarrez Docker Desktop

### 5. Problèmes de casse des noms de fichiers

Windows n'est pas sensible à la casse par défaut. Si vous avez des problèmes :

```powershell
# Vérifier la casse des fichiers
Get-ChildItem -Recurse | Where-Object { $_.Name -cmatch '[A-Z]' }
```

## 📝 Notes importantes

- **Chemins** : Les scripts utilisent `path.join()` qui gère automatiquement les différences Windows/Unix
- **Docker** : Les chemins dans `docker-compose.yml` utilisent des chemins Unix car ils sont exécutés dans des conteneurs Linux
- **Ligne de commande** : PowerShell est recommandé pour une meilleure compatibilité
- **Éditeur** : Utilisez VS Code ou un autre éditeur qui gère bien les fins de ligne Unix (LF)

## 🌐 Compatibilité navigateurs

Le site est optimisé pour Windows et fonctionne parfaitement sur :
- ✅ **Chrome** (version 90+)
- ✅ **Edge** (version 90+)
- ✅ **Firefox** (version 88+)

Pour plus de détails sur la compatibilité, consultez **[README_BROWSER_COMPATIBILITY.md](README_BROWSER_COMPATIBILITY.md)**

### Points importants pour l'affichage Windows

1. **Polices** : Le site utilise Segoe UI (police Windows native) en fallback
2. **Rendu** : Optimisé pour ClearType (rendu Windows)
3. **Fallbacks** : Des fallbacks CSS sont inclus pour les navigateurs plus anciens
4. **Performance** : Optimisé pour les machines Windows standard

## 🔗 Ressources

- [Documentation Docker Desktop](https://docs.docker.com/desktop/windows/)
- [Documentation Node.js Windows](https://nodejs.org/en/download/package-manager/#windows)
- [Documentation PowerShell](https://docs.microsoft.com/powershell/)
- [Guide de compatibilité navigateurs](README_BROWSER_COMPATIBILITY.md)
