# Configuration Environnement de Production - RedacSeo

## Architecture de Déploiement

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │     Railway     │     │    Supabase     │
│   (Frontend)    │────▶│    (Backend)    │────▶│   (Database)    │
│                 │     │                 │     │                 │
│ React + Vite    │     │  Node.js API    │     │  PostgreSQL     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## URLs de Production

| Service | URL |
|---------|-----|
| **Frontend** | https://redac-seo.vercel.app |
| **Backend API** | https://redacseo-production.up.railway.app |
| **Database** | https://umwovwfimonwkrlkbcec.supabase.co |

---

## Variables d'Environnement

### Frontend (Vercel)

Aller dans: **Vercel** → Project → **Settings** → **Environment Variables**

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `https://redacseo-production.up.railway.app/api` | URL de l'API backend (avec /api) |
| `VITE_SUPABASE_URL` | `https://umwovwfimonwkrlkbcec.supabase.co` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Clé publique Supabase (anon key) |

### Backend (Railway)

Aller dans: **Railway** → Project → **Variables**

| Variable | Valeur | Description |
|----------|--------|-------------|
| `PORT` | `8080` | Port d'écoute (imposé par Railway) |
| `NODE_ENV` | `production` | Environnement Node.js |
| `FRONTEND_URL` | `https://redac-seo.vercel.app` | URL frontend pour CORS |
| `SUPABASE_URL` | `https://umwovwfimonwkrlkbcec.supabase.co` | URL du projet Supabase |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` | Clé secrète Supabase (service_role) |
| `JWT_SECRET` | `833857d37af...` | Secret pour signer les tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | Durée de validité des tokens |

---

## Workflow Git

### Branches

| Branche | Usage | Déploiement Auto |
|---------|-------|------------------|
| `main` | Production | Vercel + Railway |
| `develop` | Développement | Preview Vercel uniquement |

### Commandes quotidiennes

```bash
# Travailler sur develop (par défaut)
git add .
git commit -m "Description du changement"
git push origin develop

# Mettre en production
git checkout main
git merge develop
git push origin main
git checkout develop  # Retourner sur develop
```

### Créer une Pull Request (recommandé)

1. Push sur `develop`
2. Aller sur GitHub → Pull Requests → New
3. Base: `main` ← Compare: `develop`
4. Review et Merge

---

## Accès aux Services

### Vercel
- **URL**: https://vercel.com/dashboard
- **Projet**: RedacSeo
- **Logs**: Deployments → View Function Logs

### Railway
- **URL**: https://railway.app/dashboard
- **Projet**: RedacSeo
- **Logs**: Deployments → View Logs

### Supabase
- **URL**: https://supabase.com/dashboard/project/umwovwfimonwkrlkbcec
- **Tables**: articles, projects, rules, users
- **Logs**: Logs → API Logs

---

## Dépannage

### Erreur CORS
1. Vérifier `FRONTEND_URL` sur Railway
2. Doit correspondre exactement à l'URL Vercel
3. Pas de `/` à la fin

### Erreur 502 Bad Gateway
1. Vérifier les logs Railway
2. Vérifier que `PORT=8080` est configuré
3. Vérifier que toutes les variables sont présentes

### Erreur 404 sur l'API
1. Vérifier `VITE_API_URL` sur Vercel
2. Doit se terminer par `/api`
3. Redéployer Vercel après modification

### Erreur d'authentification
1. Vérifier `JWT_SECRET` sur Railway
2. Vérifier `SUPABASE_SERVICE_KEY` sur Railway
3. Vérifier que le token n'est pas expiré

---

## Commandes Utiles

### Vérifier l'état de l'API
```bash
curl https://redacseo-production.up.railway.app/api/health
```

### Vérifier la branche actuelle
```bash
git branch
```

### Voir les derniers commits
```bash
git log --oneline -5
```

### Synchroniser develop avec main
```bash
git checkout develop
git pull origin main
git push origin develop
```

---

## Sécurité

### Clés à garder secrètes
- `SUPABASE_SERVICE_KEY` - Accès complet à la base de données
- `JWT_SECRET` - Permet de forger des tokens d'authentification

### Bonnes pratiques
- Ne jamais commiter les fichiers `.env`
- Utiliser des JWT_SECRET différents en dev et prod
- Régénérer les clés si compromises
- Activer 2FA sur GitHub, Vercel, Railway, Supabase

---

## Coûts Mensuels Estimés

| Service | Plan | Coût |
|---------|------|------|
| Vercel | Hobby | Gratuit |
| Railway | Starter | ~$5/mois (crédit gratuit) |
| Supabase | Free | Gratuit |
| **Total** | | **~$0-5/mois** |

---

## Contacts et Support

- **Vercel**: https://vercel.com/support
- **Railway**: https://docs.railway.app
- **Supabase**: https://supabase.com/docs

---

*Dernière mise à jour: Janvier 2026*
