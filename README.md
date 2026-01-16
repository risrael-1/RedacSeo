# RedacSeo - Application de Rédaction SEO

Application web complète pour la gestion et l'optimisation de contenus SEO. Créez, éditez et optimisez vos articles en suivant les meilleures pratiques du référencement naturel.

## 🏗️ Architecture

- **Frontend**: React 19.1.0 + Vite (port 5173)
- **Backend**: Node.js + Express API REST (port 5000)
- **Base de données**: PostgreSQL via Supabase
- **Authentification**: JWT (JSON Web Tokens)

## 🚀 Fonctionnalités

### Authentification
- Inscription et connexion utilisateur avec API REST
- Gestion de mot de passe oublié
- Authentification JWT avec tokens sécurisés
- Routes protégées côté frontend et backend

### Gestion des Articles
- Création et sauvegarde d'articles multiples via API
- Stockage persistant en base de données PostgreSQL
- Auto-sauvegarde toutes les 30 secondes
- Popup de confirmation animée lors de la sauvegarde
- Liste des articles sauvegardés par utilisateur
- Chargement et suppression d'articles
- Icône "Effacer" (🗑️) pour réinitialiser le contenu avec popup de confirmation
- Navigation depuis le Dashboard vers l'éditeur
- Synchronisation en temps réel avec le Dashboard
- Compteur de mots en temps réel

### Éditeur SEO
- Éditeur de contenu avec toolbar (gras, H1, H2, H3)
- Gestion des mots-clés principaux et secondaires
- Application manuelle du formatage en gras sur les mots-clés
- Priorité aux expressions longues (ex: "hôtel en Bretagne bord de mer")
- Génération automatique de suggestions de titre SEO (max 65 caractères)
- Génération automatique de meta descriptions (150-160 caractères)

### Vérification SEO
- Configuration personnalisée des règles SEO
- Vérification en temps réel :
  - Longueur du titre (max 65 caractères)
  - Longueur de la meta description (150-160 caractères)
  - Nombre de mots-clés en gras (min 2)
  - Nombre de mots dans l'article (min 300)
  - Nombre de balises H1 (exactement 1)
- Activation/désactivation des règles individuelles

### Interface Utilisateur
- Design moderne et responsive
- Navigation intuitive avec navbar
- Dashboard de gestion des articles avec statistiques
- Édition et suppression d'articles depuis le Dashboard
- Popup de sauvegarde animée avec icône de succès
- Suggestions cliquables pour titre et meta description
- Tags visuels pour les mots-clés secondaires
- Badges de statut colorés (Brouillon, En cours, Terminé)

## 🛠️ Technologies Utilisées

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

## 📦 Installation

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
```

#### Configurer Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Copiez `.env.example` vers `.env`
4. Remplissez les variables d'environnement :

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

#### Créer les tables

Allez dans **Supabase Dashboard > SQL Editor** et exécutez :

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_name VARCHAR(500),
  title VARCHAR(255),
  meta_description TEXT,
  keyword VARCHAR(255),
  secondary_keywords JSONB DEFAULT '[]',
  content TEXT,
  word_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Brouillon',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id VARCHAR(100) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  min_value INTEGER,
  max_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
```

#### Démarrer le serveur backend

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### 3. Configuration du Frontend

Dans un nouveau terminal :

```bash
cd ..  # Retour à la racine
npm install
```

Créez un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:5000/api
```

#### Démarrer le frontend

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

### 4. Accéder à l'application

Ouvrez `http://localhost:5173` dans votre navigateur et créez un compte !

## 🏗️ Structure du Projet

```
RedacSeo/
├── backend/                    # Backend API REST
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js    # Configuration Supabase
│   │   │   └── migrate.js     # Script de migration DB
│   │   ├── controllers/
│   │   │   ├── authController.js      # Logique d'authentification
│   │   │   ├── articlesController.js  # Logique articles
│   │   │   └── rulesController.js     # Logique règles SEO
│   │   ├── middleware/
│   │   │   └── auth.js        # Middleware JWT
│   │   ├── routes/
│   │   │   ├── authRoutes.js  # Routes d'authentification
│   │   │   ├── articlesRoutes.js      # Routes articles
│   │   │   └── rulesRoutes.js # Routes règles
│   │   └── server.js          # Point d'entrée du serveur
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── src/                       # Frontend React
│   ├── components/
│   │   ├── Navbar.jsx        # Barre de navigation
│   │   └── ProtectedRoute.jsx # Routes protégées
│   ├── context/
│   │   ├── AuthContext.jsx   # Gestion auth avec API
│   │   ├── RulesContext.jsx  # Gestion règles avec API
│   │   └── ArticlesContext.jsx # Gestion articles avec API
│   ├── pages/
│   │   ├── Login.jsx         # Page de connexion
│   │   ├── Register.jsx      # Page d'inscription
│   │   ├── ForgotPassword.jsx # Réinitialisation mot de passe
│   │   ├── Dashboard.jsx     # Tableau de bord
│   │   ├── Redaction.jsx     # Éditeur de contenu SEO
│   │   └── Regles.jsx        # Configuration des règles
│   ├── services/
│   │   └── api.js            # Service API REST
│   ├── App.jsx               # Composant racine
│   ├── main.jsx              # Point d'entrée
│   └── index.css             # Styles globaux
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

## 📝 Utilisation

### 1. Créer un compte
- Accéder à la page d'inscription
- Entrer votre email et mot de passe
- Se connecter avec vos identifiants

### 2. Rédiger un article
1. Aller dans la section "Rédaction"
2. Donner un nom à votre article
3. Coller ou rédiger votre contenu
4. Cliquer sur "Générer des suggestions" pour obtenir des propositions de titre et meta description
5. Définir votre mot-clé principal et vos mots-clés secondaires
6. Cliquer sur "Appliquer le gras aux mots-clés" pour formater le contenu
7. Choisir parmi les suggestions de titre et meta description
8. Sauvegarder votre article

### 3. Vérifier les règles SEO
- Cliquer sur "Vérifier les règles SEO"
- Consulter les résultats de validation
- Ajuster votre contenu selon les recommandations

### 4. Configurer les règles
- Aller dans "Règles SEO"
- Activer/désactiver les règles selon vos besoins
- Modifier les valeurs minimales/maximales
- Les règles sont sauvegardées automatiquement

## 🎨 Fonctionnalités Clés

### Gestion Intelligente des Mots-Clés
L'application applique les mots-clés en gras avec une logique intelligente :
- Les expressions longues sont traitées en priorité
- Exemple : "hôtel en Bretagne bord de mer" sera mis en gras comme un bloc complet, même si "hôtel en Bretagne" est aussi un mot-clé

### Auto-Sauvegarde
- Sauvegarde automatique toutes les 30 secondes
- Sauvegarde manuelle avec confirmation
- Aucune perte de données en cas de fermeture accidentelle

### Suggestions Intelligentes
- Analyse du contenu pour extraire les mots les plus fréquents
- Génération de titres optimisés SEO
- Meta descriptions respectant les bonnes pratiques (150-160 caractères)

## 🔒 Sécurité

- Authentification requise pour accéder aux fonctionnalités
- Routes protégées avec redirection automatique
- Données utilisateur isolées par email
- Stockage local sécurisé

## 🚧 Scripts Disponibles

### Frontend (racine)

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour la production
npm run preview      # Preview du build de production
npm run lint         # Linter le code avec ESLint
```

### Backend (dossier backend/)

```bash
npm run dev          # Lancer avec nodemon (auto-reload)
npm start            # Lancer en production
npm run migrate      # Créer les tables (alternative)
```

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/reset-password` - Réinitialiser mot de passe
- `GET /api/auth/me` - Utilisateur actuel (protégé)

### Articles (routes protégées)
- `GET /api/articles` - Liste des articles
- `GET /api/articles/:id` - Détails d'un article
- `POST /api/articles` - Créer un article
- `PUT /api/articles/:id` - Modifier un article
- `DELETE /api/articles/:id` - Supprimer un article

### Règles SEO (routes protégées)
- `GET /api/rules` - Liste des règles
- `POST /api/rules` - Créer/Modifier une règle
- `POST /api/rules/batch` - Mise à jour en masse

## 🗄️ Base de Données

### Schéma PostgreSQL

**Table `users`**
- Stockage des comptes utilisateurs
- Mots de passe hashés avec bcrypt
- Authentification JWT

**Table `articles`**
- Articles SEO par utilisateur
- Contenu, mots-clés, meta descriptions
- Statistiques (nombre de mots, statut)

**Table `rules`**
- Règles SEO personnalisables par utilisateur
- Paramètres min/max configurables
- Activation/désactivation individuelle

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à me contacter.

---

**Développé avec ❤️ et Claude Sonnet 4.5**
