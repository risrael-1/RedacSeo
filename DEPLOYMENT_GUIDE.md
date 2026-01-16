# 🚀 Guide de Déploiement RedacSeo

Ce guide vous accompagne pour déployer votre application RedacSeo en production avec un nom de domaine personnalisé.

## 📋 Prérequis

- Un compte GitHub avec votre code pushé
- Un compte Supabase actif
- Un nom de domaine (optionnel, Vercel fournit un sous-domaine gratuit)

---

## 1️⃣ Déploiement du Frontend (Vercel)

### Étape 1: Connexion à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Sign Up" ou "Log In"
3. Connectez-vous avec votre compte GitHub

### Étape 2: Import du Projet

1. Cliquez sur "Add New..." → "Project"
2. Sélectionnez votre repository `RedacSeo`
3. Cliquez sur "Import"

### Étape 3: Configuration du Build

Vercel détectera automatiquement Vite. Vérifiez ces paramètres:

- **Framework Preset**: Vite
- **Root Directory**: `./` (racine du projet)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Étape 4: Variables d'Environnement

Ajoutez ces variables dans la section "Environment Variables":

```
VITE_API_URL=https://votre-backend.railway.app
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=votre_supabase_anon_key
```

**⚠️ Important**: Ne mettez PAS de `/` à la fin de `VITE_API_URL`

### Étape 5: Déployer

1. Cliquez sur "Deploy"
2. Attendez 2-3 minutes
3. Votre frontend sera disponible sur: `https://redacseo-xxx.vercel.app`

---

## 2️⃣ Déploiement du Backend (Railway)

### Étape 1: Connexion à Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "Login" → "Login with GitHub"
3. Autorisez Railway

### Étape 2: Créer un Nouveau Projet

1. Cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez votre repository `RedacSeo`
4. Railway détectera automatiquement le dossier `backend`

### Étape 3: Configuration

1. Railway créera un service automatiquement
2. Allez dans l'onglet "Variables"
3. Ajoutez ces variables d'environnement:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://votre-frontend.vercel.app
DATABASE_URL=votre_supabase_connection_string
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_KEY=votre_supabase_service_key
JWT_SECRET=votre_jwt_secret_32_caracteres_minimum
JWT_EXPIRES_IN=7d
```

### Étape 4: Obtenir les Valeurs Supabase

#### DATABASE_URL:
1. Allez dans votre projet Supabase
2. Settings → Database → Connection string
3. Mode "URI" → Copiez la chaîne
4. Remplacez `[YOUR-PASSWORD]` par votre vrai mot de passe

#### SUPABASE_SERVICE_KEY:
1. Settings → API
2. Copiez la clé "service_role key" (⚠️ GARDEZ-LA SECRÈTE!)

#### JWT_SECRET:
Générez une clé aléatoire de 32+ caractères. Vous pouvez utiliser:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 5: Déployer

1. Railway déploiera automatiquement
2. Allez dans "Settings" → "Networking"
3. Cliquez sur "Generate Domain"
4. Votre backend sera disponible sur: `https://redacseo-backend-xxx.railway.app`

### Étape 6: Mettre à Jour le Frontend

1. Retournez sur Vercel
2. Allez dans votre projet → Settings → Environment Variables
3. Modifiez `VITE_API_URL` avec l'URL Railway:
   ```
   VITE_API_URL=https://redacseo-backend-xxx.railway.app
   ```
4. Redéployez le frontend (Deployments → ⋯ → Redeploy)

---

## 3️⃣ Configuration du Nom de Domaine (Optionnel)

### Option A: Domaine Personnalisé pour le Frontend

1. Achetez un domaine (ex: chez OVH, Namecheap, Google Domains)
2. Dans Vercel:
   - Allez dans Settings → Domains
   - Ajoutez votre domaine: `redacseo.com` ou `www.redacseo.com`
3. Configurez les DNS chez votre registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Attendez 24-48h pour la propagation DNS

### Option B: Sous-domaine pour l'API

Si vous voulez `api.redacseo.com` au lieu de Railway:

1. Dans Railway → Settings → Networking
2. Ajoutez un custom domain: `api.redacseo.com`
3. Configurez le DNS:
   ```
   Type: CNAME
   Name: api
   Value: [URL_FOURNIE_PAR_RAILWAY]
   ```
4. Mettez à jour `VITE_API_URL` sur Vercel avec `https://api.redacseo.com`

---

## 4️⃣ Vérifications Post-Déploiement

### ✅ Checklist

- [ ] Le frontend s'affiche correctement sur l'URL Vercel
- [ ] L'inscription/connexion fonctionne
- [ ] Les articles peuvent être créés et modifiés
- [ ] Les projets peuvent être créés
- [ ] Le score SEO se calcule correctement
- [ ] Les règles SEO personnalisées fonctionnent
- [ ] Pas d'erreurs CORS dans la console du navigateur

### 🔍 Test de l'API

Testez votre backend avec:
```bash
curl https://votre-backend.railway.app/api/health
```

Vous devriez recevoir:
```json
{
  "status": "ok",
  "message": "RedacSeo API is running",
  "timestamp": "2026-01-16T..."
}
```

### 🐛 Dépannage

**Erreur CORS:**
- Vérifiez que `FRONTEND_URL` dans Railway correspond exactement à votre URL Vercel
- Pas de `/` à la fin

**Erreur 500 Backend:**
- Vérifiez les logs dans Railway (Deployments → View Logs)
- Vérifiez que toutes les variables d'environnement sont définies
- Testez la connexion Supabase

**Erreur 404 Frontend:**
- Vérifiez que `VITE_API_URL` pointe vers Railway
- Redéployez après avoir changé les variables

---

## 5️⃣ Déploiement Continu (CI/CD)

### Automatique! 🎉

Une fois configuré:
- **Push sur GitHub** → Vercel et Railway redéploient automatiquement
- **Branche `main`** → Production
- **Autres branches** → Preview deployments (Vercel uniquement)

---

## 📊 Monitoring et Logs

### Vercel
- Dashboard → Your Project → Analytics (trafic, performances)
- Deployments → Logs (erreurs de build)

### Railway
- Dashboard → Deployments → View Logs (logs du serveur)
- Metrics (CPU, RAM, trafic réseau)

### Supabase
- Dashboard → Database → Table Editor (données)
- Auth → Users (utilisateurs inscrits)
- Logs → API Logs (requêtes)

---

## 💰 Coûts Estimés

- **Vercel**: Gratuit (100GB bandwidth/mois)
- **Railway**: $5 de crédit gratuit/mois (≈500h de runtime)
- **Supabase**: Gratuit (500MB database, 2GB bandwidth/mois)
- **Total**: **Gratuit** pour commencer! 🎉

Si vous dépassez les limites gratuites:
- Railway: ~$5-10/mois
- Vercel Pro: $20/mois (si besoin)

---

## 🔒 Sécurité en Production

### ✅ Best Practices Appliquées

- ✅ HTTPS automatique (Vercel + Railway)
- ✅ Variables d'environnement sécurisées
- ✅ JWT pour l'authentification
- ✅ Supabase RLS (Row Level Security)
- ✅ CORS configuré
- ✅ Mots de passe hashés avec bcrypt

### ⚠️ À NE JAMAIS FAIRE

- ❌ Commiter les fichiers `.env`
- ❌ Partager les clés `SUPABASE_SERVICE_KEY` ou `JWT_SECRET`
- ❌ Désactiver CORS en production
- ❌ Utiliser `NODE_ENV=development` en prod

---

## 🎯 Prochaines Étapes

Une fois déployé, vous pouvez:

1. **Configurer Google Analytics** (ajoutez dans `index.html`)
2. **Ajouter un favicon personnalisé** (`public/favicon.ico`)
3. **Optimiser les images** (compression, lazy loading)
4. **Activer le cache** (headers HTTP via Vercel)
5. **Monitorer les performances** (Vercel Analytics)

---

## 📞 Support

**Problèmes?**
- Vérifiez les logs Vercel et Railway
- Consultez la documentation officielle
- Testez localement avec les mêmes variables d'environnement

**Ressources:**
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Railway](https://docs.railway.app)
- [Documentation Supabase](https://supabase.com/docs)

---

## 🎉 Félicitations!

Votre application RedacSeo est maintenant en production! 🚀

Partagez votre URL: `https://redacseo-xxx.vercel.app`
