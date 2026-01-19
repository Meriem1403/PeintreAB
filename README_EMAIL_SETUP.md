# Configuration Email Gmail

## Étapes pour configurer l'envoi d'emails avec Gmail

### 1. Activer la validation en 2 étapes sur votre compte Gmail

1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Activez la "Validation en deux étapes" si ce n'est pas déjà fait

### 2. Générer un "App Password" (Mot de passe d'application)

1. Allez sur [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Sélectionnez "Mail" comme application
3. Sélectionnez "Autre (nom personnalisé)" comme appareil
4. Entrez un nom (ex: "PeintreAB")
5. Cliquez sur "Générer"
6. **Copiez le mot de passe généré** (16 caractères sans espaces)

### 3. Configurer les variables d'environnement

#### Option 1 : Via docker-compose.yml (recommandé pour le développement)

Modifiez directement dans `docker-compose.yml` :
```yaml
- EMAIL_USER=meriemzahzouh@gmail.com
- EMAIL_PASSWORD=votre-app-password-ici
- EMAIL_FROM=meriemzahzouh@gmail.com
```

#### Option 2 : Via fichier .env (recommandé pour la production)

Créez un fichier `backend/.env` :
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=meriemzahzouh@gmail.com
EMAIL_PASSWORD=votre-app-password-ici
EMAIL_FROM=meriemzahzouh@gmail.com
```

Puis modifiez `docker-compose.yml` pour charger le fichier `.env` :
```yaml
env_file:
  - ./backend/.env
```

### 4. Redémarrer les services

```bash
docker-compose restart backend
```

### 5. Vérifier la configuration

Les logs du backend devraient afficher :
```
✅ Service de mailing configuré avec succès
```

Si vous voyez une erreur, vérifiez :
- Que l'App Password est correct (16 caractères, sans espaces)
- Que la validation en 2 étapes est activée
- Que les variables d'environnement sont bien définies

## Test de l'envoi d'email

Pour tester, utilisez le formulaire de contact sur le site. Un email de notification devrait être envoyé à `meriemzahzouh@gmail.com`.

## Sécurité

⚠️ **Important** : Ne commitez jamais le fichier `.env` avec les mots de passe réels dans Git !
Le fichier `.env.example` est fourni comme modèle sans informations sensibles.
