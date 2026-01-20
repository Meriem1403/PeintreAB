# Compatibilité navigateurs Windows

Ce guide détaille la compatibilité du site avec les navigateurs Windows.

## ✅ Navigateurs supportés

### Navigateurs modernes (recommandés)
- **Chrome** (version 90+) ✅
- **Edge** (version 90+) ✅
- **Firefox** (version 88+) ✅
- **Opera** (version 76+) ✅

### Navigateurs avec support partiel
- **Edge Legacy** (version 79-89) ⚠️
  - Fonctionnalités de base : ✅
  - `backdrop-filter` : ❌ (flou d'arrière-plan désactivé)
  - `aspect-ratio` : ⚠️ (fallback CSS appliqué)

### Navigateurs non supportés
- **Internet Explorer 11** ❌
  - Le site ne fonctionnera pas correctement
  - Utilisez Edge ou Chrome à la place

## 🎨 Fonctionnalités CSS

### Support complet
- ✅ Flexbox
- ✅ Grid Layout
- ✅ Transform & Transitions
- ✅ CSS Variables
- ✅ Media Queries
- ✅ Font Loading (Google Fonts)

### Support conditionnel
- ⚠️ `backdrop-filter` (flou d'arrière-plan)
  - Chrome/Edge 90+ : ✅
  - Firefox 103+ : ✅
  - Edge Legacy : ❌ (fallback : fond semi-transparent)
  
- ⚠️ `aspect-ratio`
  - Chrome/Edge 88+ : ✅
  - Firefox 89+ : ✅
  - Edge Legacy : ⚠️ (fallback avec padding-top)

## 🔧 JavaScript

### APIs utilisées
- ✅ `fetch()` - Supporté sur tous les navigateurs modernes
- ✅ `localStorage` - Supporté partout
- ✅ `Canvas API` - Supporté (particles.js)
- ✅ `addEventListener` - Supporté partout
- ✅ `scrollTo({ behavior: 'smooth' })` - Supporté sur navigateurs modernes

### Fallbacks automatiques
- `scrollTo` avec `behavior: 'smooth'` : Si non supporté, scroll instantané
- `backdrop-filter` : Fallback vers fond opaque si non supporté

## 📱 Responsive Design

Le site est entièrement responsive et fonctionne sur :
- ✅ Desktop Windows (1920x1080 et plus)
- ✅ Laptop Windows (1366x768 et plus)
- ✅ Tablettes Windows (768px et plus)
- ✅ Smartphones (320px et plus)

## 🖼️ Polices

### Polices système Windows
- **Segoe UI** : Police Windows par défaut (utilisée en fallback)
- **Google Fonts** : Chargées depuis CDN
  - Playfair Display
  - Cormorant Garamond
  - Great Vibes
  - Dancing Script

### Chargement des polices
- Les polices sont préchargées pour éviter le FOUT (Flash of Unstyled Text)
- Fallback vers les polices système si le chargement échoue

## 🎯 Tests recommandés

### Avant déploiement, tester sur :
1. **Chrome** (dernière version)
2. **Edge** (dernière version)
3. **Firefox** (dernière version)
4. **Résolution 1920x1080** (Full HD)
5. **Résolution 1366x768** (HD)
6. **Mode responsive** (DevTools)

### Points à vérifier
- ✅ Navigation entre les pages
- ✅ Affichage des images
- ✅ Animations fluides
- ✅ Carrousel des œuvres
- ✅ Modal de détails
- ✅ Formulaire de contact
- ✅ Espace admin
- ✅ Particles.js en arrière-plan

## 🐛 Problèmes connus et solutions

### 1. Particles.js ne s'affiche pas
**Cause** : Bloqueur de scripts ou connexion lente
**Solution** : Vérifier la console (F12) pour les erreurs de chargement

### 2. Flou d'arrière-plan non visible
**Cause** : Navigateur ne supporte pas `backdrop-filter`
**Solution** : Normal, un fond semi-transparent est affiché à la place

### 3. Images ne se chargent pas
**Cause** : Chemins incorrects ou permissions
**Solution** : Vérifier les chemins dans la console (F12 → Network)

### 4. Scroll non fluide
**Cause** : Navigateur ancien ne supporte pas `scroll-behavior: smooth`
**Solution** : Normal, le scroll sera instantané

## 📊 Performance

### Métriques attendues (Windows)
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Largest Contentful Paint** : < 2.5s

### Optimisations appliquées
- ✅ Images optimisées (lazy loading)
- ✅ Code splitting (React Router)
- ✅ Minification CSS/JS en production
- ✅ CDN pour particles.js et Google Fonts

## 🔍 Vérification de compatibilité

Pour vérifier la compatibilité de votre navigateur :

1. Ouvrez la console (F12)
2. Tapez : `navigator.userAgent`
3. Vérifiez la version de votre navigateur

### Versions minimales recommandées
- Chrome : 90+
- Edge : 90+
- Firefox : 88+

## 💡 Recommandations

1. **Utilisez toujours la dernière version** de votre navigateur
2. **Activez les mises à jour automatiques**
3. **Désactivez les extensions** qui pourraient bloquer le JavaScript
4. **Videz le cache** si vous rencontrez des problèmes d'affichage

## 🆘 Support

Si vous rencontrez des problèmes d'affichage sur Windows :

1. Vérifiez la version de votre navigateur
2. Mettez à jour vers la dernière version
3. Videz le cache (Ctrl + Shift + Delete)
4. Désactivez les extensions
5. Testez en mode navigation privée
