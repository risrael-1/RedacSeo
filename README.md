# RedacSeo - Application de Rédaction SEO

Application web complète pour la gestion et l'optimisation de contenus SEO. Créez, éditez et optimisez vos articles en suivant les meilleures pratiques du référencement naturel.

## Architecture

- **Frontend**: React 19.1.0 + Vite (port 5173)
- **Backend**: Node.js + Express API REST (port 5000)
- **Base de données**: PostgreSQL via Supabase
- **Authentification**: JWT (JSON Web Tokens)
- **Tests E2E**: Playwright (22 tests)
- **Tests API**: Jest + Supertest (22 tests)

## Fonctionnalités

### Authentification et Rôles
- Inscription et connexion utilisateur avec API REST
- Authentification JWT avec tokens sécurisés (session par onglet)
- Gestion de mot de passe oublié
- **Système de rôles globaux** :
  - `super_admin` : accès total à tous les projets et utilisateurs
  - `admin` : gère ses projets et voit les membres
  - `user` : utilisateur standard
- Page d'administration pour gérer les utilisateurs (super_admin/admin)

### Gestion des Projets
- Création et organisation de projets par client/thème
- Couleur personnalisable pour chaque projet
- **Système de membres par projet** :
  - `owner` : propriétaire du projet (créateur)
  - `admin` : peut modifier le projet et gérer les membres
  - `member` : peut voir et éditer les articles du projet
- Invitation de membres par email
- Recherche et filtrage des projets
- Compteur d'articles et de membres par projet

### Gestion des Articles
- Création et sauvegarde d'articles multiples via API
- Association d'articles à des projets
- Stockage persistant en base de données PostgreSQL
- Auto-sauvegarde toutes les 30 secondes
- Liste des articles avec filtrage par projet
- Navigation depuis le Dashboard vers l'éditeur
- Compteur de mots en temps réel
- Score SEO calculé automatiquement (0-100)

### Éditeur SEO
- Éditeur de contenu avec toolbar (gras, H1, H2, H3)
- Gestion des mots-clés principaux et secondaires
- Application manuelle du formatage en gras sur les mots-clés
- Priorité aux expressions longues (ex: "hôtel en Bretagne bord de mer")
- Génération automatique de suggestions de titre SEO (max 65 caractères)
- Génération automatique de meta descriptions (150-160 caractères)

### Score SEO Automatique
Score calculé sur 12 critères (100 points max) :
- Longueur du contenu (jusqu'à 15 points)
- Mot-clé dans le titre (12 points + bonus position)
- Mot-clé dans la meta description (8 points)
- Longueur de la meta description (8 points)
- Densité du mot-clé (12 points)
- Structure H1 (10 points + bonus)
- Structure H2/H3 (10 points)
- Contenu en gras (5 points)
- Longueur du titre (5 points)
- Et plus...

### Interface Utilisateur
- Design moderne et responsive
- Navigation intuitive avec navbar adaptée au rôle
- Dashboard de gestion des articles avec statistiques SEO
- Page Projets avec gestion des membres
- Page Admin pour la gestion des utilisateurs
- Badges de rôle colorés (Propriétaire, Admin, Membre)
- Badges de statut (Brouillon, En cours, Terminé)

## Technologies Utilisées

### Frontend
- **React 19.1.0** - Framework JavaScript
- **Vite 6.3.5** - Build tool et dev server
- **React Router DOM 7.12.0** - Navigation et routing
- **Context API** - Gestion d'état globale
- **CSS3** - Styling avec gradients et animations

### Backend
- **Node.js** - Runtime JavaScript
- **Express 4.18** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **Supabase** - Backend as a Service (BaaS)
- **JWT** - Authentification sécurisée
- **bcryptjs** - Hashage des mots de passe
- **CORS** - Gestion des origines croisées

## Installation

### Prérequis

- Node.js 18+ et npm
- Compte Supabase (gratuit)

### 1. Cloner le repository

```bash
git clone <votre-repo-url>
cd RedacSeo
```

### 2. Configuration du Backend

```bash
cd backend
npm install
cp .env.example .env
```

Remplissez les variables d'environnement dans `backend/.env` :

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_key

JWT_SECRET=votre_secret_jwt_securise
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

### 3. Créer les tables

Allez dans **Supabase Dashboard > SQL Editor** et exécutez le fichier `backend/MIGRATIONS.sql`.

### 4. Démarrer le serveur backend

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### 5. Configuration du Frontend

Dans un nouveau terminal :

```bash
cd ..  # Retour à la racine
npm install
```

Créez un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Démarrer le frontend

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

## Structure du Projet

```
RedacSeo/
├── backend/                    # Backend API REST
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js    # Configuration Supabase
│   │   ├── controllers/
│   │   │   ├── authController.js      # Authentification
│   │   │   ├── articlesController.js  # Articles
│   │   │   ├── projectsController.js  # Projets
│   │   │   ├── usersController.js     # Utilisateurs & membres
│   │   │   └── rulesController.js     # Règles SEO
│   │   ├── middleware/
│   │   │   └── auth.js        # Middleware JWT
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── articlesRoutes.js
│   │   │   ├── projectsRoutes.js
│   │   │   ├── usersRoutes.js
│   │   │   └── rulesRoutes.js
│   │   ├── app.js             # Configuration Express
│   │   └── server.js          # Point d'entrée
│   ├── tests/                 # Tests API (Jest)
│   │   ├── setup.js
│   │   └── auth.test.js       # 22 tests d'authentification
│   ├── MIGRATIONS.sql         # Toutes les migrations SQL
│   └── package.json
│
├── src/                       # Frontend React
│   ├── components/
│   │   ├── Navbar.jsx        # Barre de navigation
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx   # Auth + rôles
│   │   ├── ArticlesContext.jsx
│   │   ├── ProjectsContext.jsx
│   │   └── RulesContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Redaction.jsx     # Éditeur SEO
│   │   ├── Projects.jsx      # Gestion projets & membres
│   │   ├── Admin.jsx         # Gestion utilisateurs
│   │   └── Regles.jsx
│   ├── services/
│   │   └── api.js            # Service API REST
│   └── App.jsx
│
├── tests/                     # Tests E2E (Playwright)
│   └── e2e/
│       ├── auth.spec.js       # Tests d'authentification (15 tests)
│       └── user-journey.spec.js  # Parcours utilisateur (7 tests)
│
├── docs/
│   └── PRODUCTION_ENV.md     # Config production
├── playwright.config.js      # Configuration Playwright
├── package.json
└── README.md
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/reset-password` - Réinitialiser mot de passe
- `GET /api/auth/me` - Utilisateur actuel

### Articles
- `GET /api/articles` - Liste des articles (filtrés par rôle)
- `GET /api/articles/:id` - Détails d'un article
- `POST /api/articles` - Créer un article
- `PUT /api/articles/:id` - Modifier un article
- `DELETE /api/articles/:id` - Supprimer un article

### Projets
- `GET /api/projects` - Liste des projets (filtrés par rôle)
- `GET /api/projects/:id` - Détails d'un projet
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/:id` - Modifier un projet
- `DELETE /api/projects/:id` - Supprimer un projet

### Utilisateurs et Membres
- `GET /api/users` - Liste des utilisateurs (admin)
- `PATCH /api/users/:id/role` - Modifier le rôle global
- `GET /api/users/projects/:id/members` - Membres d'un projet
- `POST /api/users/projects/:id/members` - Ajouter un membre
- `POST /api/users/projects/:id/invite` - Inviter par email
- `PATCH /api/users/projects/:projectId/members/:memberId` - Modifier rôle membre
- `DELETE /api/users/projects/:projectId/members/:memberId` - Retirer membre

### Règles SEO
- `GET /api/rules` - Liste des règles
- `POST /api/rules` - Créer/Modifier une règle
- `POST /api/rules/batch` - Mise à jour en masse

## Base de Données

### Tables principales

**`users`** - Comptes utilisateurs
- `id`, `email`, `password`, `role` (super_admin/admin/user)

**`projects`** - Projets pour organiser les articles
- `id`, `user_id`, `name`, `description`, `color`

**`project_members`** - Membres d'un projet
- `id`, `project_id`, `user_id`, `role` (owner/admin/member)

**`project_invitations`** - Invitations en attente
- `id`, `project_id`, `email`, `role`, `token`

**`articles`** - Articles SEO
- `id`, `user_id`, `project_id`, `article_name`, `title`, `content`, `seo_score`...

**`rules`** - Règles SEO personnalisables
- `id`, `user_id`, `rule_id`, `enabled`, `min_value`, `max_value`

## Permissions

| Action | super_admin | admin (global) | owner (projet) | admin (projet) | member |
|--------|-------------|----------------|----------------|----------------|--------|
| Page Admin | Oui | Oui (limité) | Non | Non | Non |
| Voir tous projets | Oui | Non | Non | Non | Non |
| Modifier projet | Oui | Si owner | Oui | Oui | Non |
| Supprimer projet | Oui | Si owner | Oui | Non | Non |
| Gérer membres | Oui | Si owner | Oui | Oui | Non |
| Voir articles projet | Oui | Oui | Oui | Oui | Oui |

## Scripts Disponibles

### Frontend (racine)

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour la production
npm run preview      # Preview du build de production
npm run lint         # Linter le code avec ESLint
npm test             # Lancer les tests E2E Playwright
npm run test:ui      # Tests E2E avec interface graphique
npm run test:headed  # Tests E2E en mode visible (non-headless)
```

### Backend (dossier backend/)

```bash
npm run dev          # Lancer avec nodemon (auto-reload)
npm start            # Lancer en production
npm test             # Lancer les tests API Jest
npm run test:watch   # Tests API en mode watch
```

## Tests

### Tests E2E (Playwright)

22 tests couvrant l'interface utilisateur complète :

```bash
npm test
```

**Couverture :**
- Authentification (inscription, connexion, déconnexion)
- Validation des formulaires
- Protection des routes
- Navigation entre les pages
- Parcours utilisateur complet (inscription → suppression compte)

### Tests API (Jest + Supertest)

22 tests couvrant tous les endpoints d'authentification :

```bash
cd backend && npm test
```

**Couverture :**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/change-password
- POST /api/auth/change-email
- DELETE /api/auth/delete-account
- GET /api/health

## Déploiement

Voir `docs/PRODUCTION_ENV.md` pour la configuration de production avec :
- **Frontend** : Vercel
- **Backend** : Railway
- **Database** : Supabase

## Licence

Ce projet est sous licence MIT.

---

**Développé avec Claude**
