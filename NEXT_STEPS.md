# 📋 Prochaines Étapes - Configuration de RedacSeo

## ✅ Ce qui a été fait

L'architecture complète a été mise en place :

### Backend
- ✅ Structure du projet (Express + Node.js)
- ✅ Configuration Supabase (PostgreSQL)
- ✅ Authentification JWT
- ✅ Routes API (auth, articles, règles)
- ✅ Controllers et middleware
- ✅ Fichiers de configuration (.env.example)

### Frontend
- ✅ Service API centralisé
- ✅ Contexts adaptés (Auth, Articles, Rules)
- ✅ Intégration avec l'API backend
- ✅ Variables d'environnement

### Documentation
- ✅ README complet
- ✅ Guide de démarrage rapide (QUICKSTART.md)
- ✅ Documentation backend

## 🚀 Pour démarrer l'application

### Option 1: Guide rapide (5 minutes)

Suivez le fichier [QUICKSTART.md](QUICKSTART.md) pour une configuration rapide.

### Option 2: Guide détaillé

#### 1. Configurer Supabase

1. Allez sur https://supabase.com
2. Créez un compte et un nouveau projet
3. Dans **SQL Editor**, exécutez le SQL fourni dans QUICKSTART.md
4. Récupérez vos credentials dans **Settings > API**

#### 2. Configurer le Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditez .env avec vos credentials Supabase
npm run dev
```

Le backend démarre sur `http://localhost:5000`

#### 3. Configurer le Frontend

```bash
cd ..
npm install
# Créez .env à la racine avec:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

## 📝 Fichiers à configurer

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_key
JWT_SECRET=changez_moi_en_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env` à la racine)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Tester l'application

1. Ouvrez `http://localhost:5173`
2. Cliquez sur "S'inscrire"
3. Créez un compte avec email/mot de passe
4. Connectez-vous
5. Créez votre premier article SEO !

## 🔍 Vérifier que tout fonctionne

### Backend
- Health check: `http://localhost:5000/api/health`
- Devrait retourner: `{"status":"ok",...}`

### Frontend
- Ouvrir `http://localhost:5173`
- Console (F12) ne devrait pas avoir d'erreurs de connexion

### Base de données
- Allez dans **Supabase Dashboard > Table Editor**
- Vous devriez voir les tables `users`, `articles`, `rules`

## ⚠️ Problèmes courants

### "Cannot connect to backend"
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez le fichier `.env` à la racine du frontend
- Vérifiez que VITE_API_URL est correct

### "Supabase credentials invalid"
- Vérifiez SUPABASE_URL (doit commencer par https://)
- Vérifiez que vous utilisez SERVICE_KEY (pas ANON_KEY)
- Vérifiez que les credentials sont corrects dans backend/.env

### "Tables not found"
- Exécutez le SQL dans Supabase SQL Editor
- Vérifiez dans Table Editor que les tables existent
- Vérifiez que l'user de la DB a les bonnes permissions

### Port 5000 déjà utilisé
- Sur Windows: `netstat -ano | findstr :5000`
- Changez le PORT dans backend/.env
- Pensez à mettre à jour VITE_API_URL dans frontend/.env

## 📚 Documentation

- [README.md](README.md) - Documentation complète
- [QUICKSTART.md](QUICKSTART.md) - Guide de démarrage rapide
- [backend/README.md](backend/README.md) - Documentation API

## 🎯 Fonctionnalités disponibles

Une fois l'app lancée, vous pouvez :

1. **S'inscrire/Se connecter** - Authentification sécurisée JWT
2. **Dashboard** - Vue d'ensemble de vos articles
3. **Créer des articles** - Éditeur SEO complet
4. **Générer des suggestions** - Titre et meta description automatiques
5. **Appliquer le formatage** - Mise en gras des mots-clés
6. **Vérifier les règles SEO** - Validation en temps réel
7. **Configurer les règles** - Personnaliser les critères SEO

## 🚢 Déploiement (optionnel)

Pour déployer en production :

### Backend
- Railway, Render, ou Heroku
- Configurez les variables d'environnement
- Changez NODE_ENV=production
- Générez un JWT_SECRET sécurisé

### Frontend
- Vercel, Netlify, ou Cloudflare Pages
- Configurez VITE_API_URL avec votre URL de prod
- Build: `npm run build`

### Base de données
- Déjà hébergée sur Supabase (gratuit)
- Pensez à sauvegarder régulièrement

## 💡 Besoin d'aide ?

- Consultez les fichiers README
- Vérifiez les logs du backend (console où tourne `npm run dev`)
- Vérifiez la console du navigateur (F12)
- Créez une issue sur GitHub

## 🎉 Prêt !

Votre application est maintenant prête à être utilisée !

Bon développement 🚀
