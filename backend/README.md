# RedacSeo Backend API

API REST pour l'application RedacSeo - Gestion et optimisation de contenus SEO.

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez vos credentials :
   - Project URL
   - Anon/Public Key
   - Service Role Key (secret)

### 3. Configuration de l'environnement

```bash
cp .env.example .env
```

Editez le fichier `.env` avec vos credentials Supabase :

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_key

JWT_SECRET=changez_ce_secret_en_production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

### 4. Création des tables dans Supabase

Allez dans votre projet Supabase : **SQL Editor** et exécutez :

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
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

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

Ou utilisez le script de migration :

```bash
npm run migrate
```

### 5. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/reset-password` - Réinitialiser mot de passe
- `GET /api/auth/me` - Obtenir utilisateur actuel (authentifié)

### Articles

Toutes les routes nécessitent l'authentification (token JWT).

- `GET /api/articles` - Liste des articles
- `GET /api/articles/:id` - Détails d'un article
- `POST /api/articles` - Créer un article
- `PUT /api/articles/:id` - Modifier un article
- `DELETE /api/articles/:id` - Supprimer un article

### Rules

Toutes les routes nécessitent l'authentification (token JWT).

- `GET /api/rules` - Liste des règles
- `POST /api/rules` - Créer/Modifier une règle
- `POST /api/rules/batch` - Mise à jour en masse

### Health Check

- `GET /api/health` - Status de l'API

## 🔒 Authentification

L'API utilise JWT (JSON Web Tokens). Incluez le token dans le header :

```
Authorization: Bearer votre_token_jwt
```

## 🗄️ Structure de la base de données

### Table `users`
- `id` (UUID) - Identifiant unique
- `email` (VARCHAR) - Email de l'utilisateur
- `password` (VARCHAR) - Mot de passe hashé (bcrypt)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Table `articles`
- `id` (UUID) - Identifiant unique
- `user_id` (UUID) - Référence vers users
- `article_name` (VARCHAR) - Nom de l'article
- `title` (VARCHAR) - Titre SEO
- `meta_description` (TEXT) - Meta description
- `keyword` (VARCHAR) - Mot-clé principal
- `secondary_keywords` (JSONB) - Mots-clés secondaires
- `content` (TEXT) - Contenu de l'article
- `word_count` (INTEGER) - Nombre de mots
- `status` (VARCHAR) - Statut (Brouillon, En cours, Terminé)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Table `rules`
- `id` (UUID) - Identifiant unique
- `user_id` (UUID) - Référence vers users
- `rule_id` (VARCHAR) - Identifiant de la règle
- `rule_name` (VARCHAR) - Nom de la règle
- `enabled` (BOOLEAN) - Activée ou non
- `min_value` (INTEGER) - Valeur minimale
- `max_value` (INTEGER) - Valeur maximale
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🛠️ Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Supabase** - Base de données PostgreSQL
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe

## 📝 Scripts disponibles

```bash
npm run dev      # Démarrer en mode développement (nodemon)
npm start        # Démarrer en production
npm run migrate  # Créer les tables (alternative)
npm test         # Lancer les tests unitaires
npm run test:watch  # Lancer les tests en mode watch
```

## 🧪 Tests

Le backend utilise **Jest** et **Supertest** pour les tests d'API.

### Lancer les tests

```bash
npm test
```

### Structure des tests

```
backend/
├── tests/
│   ├── setup.js      # Configuration et helpers
│   └── auth.test.js  # Tests d'authentification (22 tests)
```

### Tests disponibles

- **POST /api/auth/register** - Inscription (4 tests)
- **POST /api/auth/login** - Connexion (4 tests)
- **GET /api/auth/me** - Utilisateur actuel (3 tests)
- **POST /api/auth/change-password** - Changement de mot de passe (4 tests)
- **POST /api/auth/change-email** - Changement d'email (3 tests)
- **DELETE /api/auth/delete-account** - Suppression de compte (3 tests)
- **GET /api/health** - Health check (1 test)

## 🔧 Développement

Le serveur utilise `nodemon` en développement pour le rechargement automatique.

## 🚀 Déploiement

Pour déployer en production :

1. Assurez-vous que `NODE_ENV=production`
2. Changez le `JWT_SECRET` par une valeur sécurisée
3. Configurez `FRONTEND_URL` avec votre URL de production
4. Déployez sur Railway, Render, ou votre plateforme préférée

## 📧 Support

Pour toute question, créez une issue sur le repository.
