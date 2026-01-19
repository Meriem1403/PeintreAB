# Guide SEO pour le référencement Google

Ce guide vous explique comment améliorer le référencement de votre site web sur Google.

## ✅ Optimisations déjà en place

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph pour les réseaux sociaux
- ✅ Schema.org (données structurées)
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ Langue française (lang="fr")
- ✅ URLs propres et descriptives

## ✅ Configuration du domaine

Le site est configuré avec le domaine **http://www.alexandre-bindl.fr**

Les fichiers suivants sont déjà configurés avec ce domaine :
- ✅ `public/sitemap.xml` : URLs configurées avec www.alexandre-bindl.fr
- ✅ `public/robots.txt` : Sitemap configuré
- ✅ `index.html` : Meta tags (canonical, og:url, etc.) configurés
- ✅ `docker-compose.yml` : FRONTEND_URL configuré

**Pour activer HTTPS** (recommandé pour le SEO) :
1. Installez SSL avec Let's Encrypt (voir README_DEPLOYMENT.md)
2. Mettez à jour les URLs de `http://` vers `https://` dans les fichiers ci-dessus

## 📋 Actions à faire pour améliorer le SEO

### 1. **Soumission à Google Search Console** (si serveur accessible publiquement)

1. Allez sur [Google Search Console](https://search.google.com/search-console)
2. Ajoutez votre propriété (votre URL : `https://www.alexandre-bindl.fr`)
3. Vérifiez la propriété (via fichier HTML ou DNS)
4. Soumettez votre sitemap : `https://www.alexandre-bindl.fr/sitemap.xml`

### 2. **Configuration des URLs pour serveur local**

Avant de continuer, configurez vos URLs :

**Si vous avez un nom de domaine** :
- Remplacez `VOTRE_DOMAINE` dans tous les fichiers par votre domaine réel
- Exemple : `https://artiste.votredomaine.fr`

**Si vous utilisez uniquement une IP** :
- Remplacez par votre IP publique : `http://VOTRE_IP:5173`
- Note : Le SEO sera limité sans nom de domaine

**Si c'est uniquement local** :
- Utilisez `http://localhost:5173` ou votre IP locale
- Le référencement Google ne fonctionnera pas (site non accessible publiquement)

### 3. **Optimisation des images**

- ✅ Ajoutez toujours un `alt` descriptif aux images
- ✅ Compressez les images (utilisez des outils comme TinyPNG)
- ✅ Utilisez des formats modernes (WebP) quand possible
- ✅ Nommez les fichiers de manière descriptive : `peinture-portrait-2024.jpg` plutôt que `IMG_1234.jpg`

### 4. **Contenu de qualité**

- ✅ Rédigez des descriptions détaillées pour chaque œuvre
- ✅ Ajoutez régulièrement du nouveau contenu (nouvelles œuvres, événements)
- ✅ Utilisez des mots-clés pertinents naturellement dans le contenu
- ✅ Créez une page "À propos" complète avec votre biographie

### 5. **Liens externes (Backlinks)**

- ✅ Inscrivez-vous sur des annuaires d'artistes
- ✅ Partagez vos œuvres sur les réseaux sociaux
- ✅ Participez à des expositions et mentionnez votre site
- ✅ Échangez des liens avec d'autres artistes ou galeries
- ✅ Créez un profil sur des plateformes d'art (ArtStation, Behance, etc.)

### 6. **Performance du site**

- ✅ Optimisez les images (compression)
- ✅ Utilisez un CDN si possible
- ✅ Minimisez le JavaScript et CSS
- ✅ Activez la mise en cache
- ✅ Vérifiez la vitesse avec [PageSpeed Insights](https://pagespeed.web.dev/)

### 7. **Mobile-friendly**

- ✅ Votre site est déjà responsive
- ✅ Testez sur différents appareils
- ✅ Utilisez [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### 8. **Mots-clés à cibler**

- "artiste peintre Marseille"
- "peinture à l'huile"
- "galerie d'art en ligne"
- "exposition peinture"
- "artiste contemporain"
- "portrait peinture"
- "Alexandre Bindl"

### 9. **Blog/Actualités (optionnel mais recommandé)**

Créez une section blog pour :
- Parler de vos techniques de peinture
- Partager vos inspirations
- Annoncer vos expositions
- Présenter vos nouvelles œuvres

### 10. **Google My Business**

Si vous avez un atelier ou participez à des expositions physiques :
- Créez un profil Google My Business
- Ajoutez vos coordonnées et photos
- Encouragez les avis clients

### 11. **Réseaux sociaux**

- ✅ Partagez régulièrement vos œuvres
- ✅ Utilisez des hashtags pertinents (#artistepeintre #peinture #art)
- ✅ Créez du contenu varié (photos, vidéos, stories)
- ✅ Interagissez avec votre communauté

## 🔧 Maintenance SEO

### Mise à jour du sitemap

Le fichier `public/sitemap.xml` doit être mis à jour régulièrement quand vous ajoutez :
- De nouvelles œuvres
- De nouveaux événements
- De nouvelles pages

### Vérifications régulières

- Vérifiez votre positionnement sur Google (mots-clés ciblés)
- Analysez le trafic dans Google Analytics
- Surveillez les erreurs dans Google Search Console
- Vérifiez les liens cassés

## 📊 Outils utiles

- **Google Search Console** : Analyse de performance et erreurs
- **Google Analytics** : Statistiques de trafic
- **PageSpeed Insights** : Performance du site
- **Google Keyword Planner** : Recherche de mots-clés
- **Screaming Frog** : Audit SEO technique
- **Ahrefs / SEMrush** : Analyse de la concurrence (payant)

## 🎯 Objectifs à court terme (1-3 mois)

1. Soumettre le site à Google Search Console
2. Optimiser toutes les images existantes
3. Créer des profils sur les réseaux sociaux
4. Obtenir 5-10 backlinks de qualité

## 🎯 Objectifs à long terme (6-12 mois)

1. Apparaître dans les 3 premières pages Google pour "artiste peintre Marseille"
2. Avoir 100+ pages indexées
3. Générer du trafic organique régulier
4. Avoir une présence forte sur les réseaux sociaux

## 📝 Notes importantes

- Le SEO prend du temps (3-6 mois minimum pour voir des résultats)
- La qualité du contenu est plus importante que la quantité
- Les backlinks de qualité valent mieux que beaucoup de liens de faible qualité
- Restez patient et constant dans vos efforts

## 🔗 Liens utiles

- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org](https://schema.org/)
- [Google My Business](https://www.google.com/business/)
