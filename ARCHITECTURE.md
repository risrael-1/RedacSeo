# 🏗️ Architecture RedacSeo

## Vue d'ensemble

RedacSeo est une application full-stack moderne séparant clairement le frontend et le backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                    (Navigateur Web)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     FRONTEND                                 │
│                React 19 + Vite                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │   Context    │  │  Services    │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ Login        │  │ AuthContext  │  │ API Service  │     │
│  │ Register     │──│ Articles     │──│              │     │
│  │ Dashboard    │  │ Rules        │  │ - authAPI    │     │
│  │ Redaction    │  │              │  │ - articlesAPI│     │
│  │ Regles       │  │              │  │ - rulesAPI   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Port: 5173                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
                       │ (JWT Token)
┌──────────────────────▼──────────────────────────────────────┐
│                     BACKEND                                  │
│                Node.js + Express                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │ Controllers  │  │  Middleware  │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ /api/auth    │──│ auth         │  │ JWT Auth     │     │
│  │ /api/articles│──│ articles     │──│ CORS         │     │
│  │ /api/rules   │  │ rules        │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Port: 5000                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
                       │ (Supabase Client)
┌──────────────────────▼──────────────────────────────────────┐
│                  BASE DE DONNÉES                             │
│                PostgreSQL (Supabase)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   users      │  │  articles    │  │   rules      │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │     │
│  │ email        │  │ user_id (FK) │  │ user_id (FK) │     │
│  │ password     │  │ article_name │  │ rule_id      │     │
│  │ created_at   │  │ title        │  │ rule_name    │     │
│  │ updated_at   │  │ content      │  │ enabled      │     │
│  └──────────────┘  │ keyword      │  │ min_value    │     │
│                     │ ...          │  │ max_value    │     │
│                     └──────────────┘  └──────────────┘     │
│                                                              │
│  Cloud: Supabase                                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de données

### 1. Authentification

```
User Action (Login)
       │
       ▼
Frontend (Login.jsx)
       │
       ▼
AuthContext
       │
       ▼
API Service (authAPI.login)
       │
       ▼
POST /api/auth/login
       │
       ▼
Backend (authController)
       │
       ├──▶ Vérification email/password
       │
       ├──▶ Génération JWT Token
       │
       ▼
Response { token, user }
       │
       ▼
Frontend stocke token
       │
       ▼
Redirect vers Dashboard
```

### 2. Gestion des Articles

```
User Action (Save Article)
       │
       ▼
Redaction.jsx
       │
       ▼
ArticlesContext.saveArticle()
       │
       ▼
API Service (articlesAPI.create/update)
       │
       ▼
POST/PUT /api/articles
       │
   Authorization: Bearer <token>
       │
       ▼
Backend Middleware (JWT Auth)
       │
       ▼
articlesController
       │
       ├──▶ Transformation des données
       │
       ├──▶ Supabase query
       │
       ▼
PostgreSQL (INSERT/UPDATE)
       │
       ▼
Response { article }
       │
       ▼
Frontend met à jour l'état local
       │
       ▼
Dashboard sync automatique
```

### 3. Vérification SEO

```
User Action (Check Rules)
       │
       ▼
Redaction.jsx
       │
       ▼
RulesContext.checkRules()
       │
       ├──▶ Chargement des règles (depuis API)
       │
       ├──▶ Analyse du contenu local
       │
       ├──▶ Vérification de chaque règle
       │
       ▼
Affichage des résultats
```

## 🔐 Sécurité

### Frontend
- Routes protégées avec ProtectedRoute
- Token JWT stocké en localStorage
- Header Authorization automatique

### Backend
- Middleware JWT sur toutes les routes protégées
- Validation des données entrantes
- Hash des mots de passe avec bcrypt (salt rounds: 10)
- CORS configuré pour le frontend uniquement

### Base de données
- Foreign keys avec ON DELETE CASCADE
- Indexes pour optimisation des requêtes
- Constraints UNIQUE sur (user_id, rule_id)
- Row Level Security (RLS) via Supabase (optionnel)

## 📦 Technologies

### Frontend Stack
```
React 19.1.0
  ├── Vite 6.3.5 (build tool)
  ├── React Router DOM 7.12.0 (routing)
  ├── Context API (state management)
  └── CSS3 (styling)
```

### Backend Stack
```
Node.js
  ├── Express 4.18 (web framework)
  ├── JWT (authentication)
  ├── bcryptjs (password hashing)
  ├── @supabase/supabase-js (DB client)
  ├── CORS (cross-origin)
  └── dotenv (environment variables)
```

### Infrastructure
```
Supabase
  ├── PostgreSQL 15+ (database)
  ├── Connection pooling
  ├── Automatic backups
  └── SSL connections
```

## 🚀 Déploiement

### Architecture de Production

```
                    Cloudflare / DNS
                           │
                           ▼
       ┌──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   Frontend           Backend           Database
   (Vercel)          (Railway)        (Supabase)
       │                  │                  │
  Static Files      Docker Container    PostgreSQL
  CDN Cached        Auto-scaled        Managed Service
  Global Edge       Health checks      Auto-backup
```

### Variables d'environnement Production

**Frontend (.env.production)**
```env
VITE_API_URL=https://api.votre-domaine.com/api
```

**Backend (.env.production)**
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=xxxxx
JWT_SECRET=<secret-super-securise>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://votre-domaine.com
```

## 📊 Performance

### Optimisations Frontend
- Code splitting automatique (Vite)
- Lazy loading des routes
- Memoization des contexts
- Debounce sur auto-save (30s)

### Optimisations Backend
- Connection pooling (Supabase)
- Indexes sur foreign keys
- Validation en amont
- Compression des réponses

### Optimisations Database
- Indexes sur colonnes fréquemment requêtées
- JSONB pour secondary_keywords (performance)
- Timestamps automatiques
- Cascade deletes (évite orphelins)

## 🔧 Extensibilité

### Ajouter une nouvelle fonctionnalité

1. **Database**: Créer/modifier tables dans Supabase
2. **Backend**:
   - Créer controller dans `backend/src/controllers/`
   - Créer routes dans `backend/src/routes/`
   - Ajouter dans `server.js`
3. **Frontend**:
   - Ajouter méthode dans `src/services/api.js`
   - Créer/modifier context si nécessaire
   - Créer page/composant
   - Ajouter route dans `App.jsx`

### Exemples d'extensions possibles

- Export PDF des articles
- Analyse concurrentielle SEO
- Suggestions IA (OpenAI API)
- Collaboration multi-utilisateurs
- Versionning des articles
- Statistiques avancées
- Intégration CMS (WordPress, etc.)

## 📝 Conventions de Code

### Backend
- Controllers: Logique métier uniquement
- Routes: Définition des endpoints
- Middleware: Authentification, validation
- Naming: camelCase pour fonctions, PascalCase pour classes

### Frontend
- Components: PascalCase (Login.jsx)
- Contexts: PascalCase + Context (AuthContext.jsx)
- Services: camelCase (api.js)
- Hooks: use prefix (useAuth, useArticles)

### Database
- Tables: lowercase plural (users, articles)
- Columns: snake_case (user_id, created_at)
- Primary keys: id (UUID)
- Foreign keys: table_id (user_id)

## 🐛 Debugging

### Frontend
- React DevTools
- Console logs dans contexts
- Network tab pour API calls
- localStorage inspection

### Backend
- Console logs avec timestamps
- Try/catch sur routes
- Error middleware
- Supabase logs

### Database
- Supabase Dashboard > Table Editor
- SQL Editor pour queries manuelles
- Logs API dans Supabase

## 📚 Ressources

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Supabase Documentation](https://supabase.com/docs)
- [JWT Best Practices](https://jwt.io/introduction)
