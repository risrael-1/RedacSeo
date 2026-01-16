# 🚀 Guide de Démarrage Rapide - RedacSeo

## Configuration en 5 minutes

### 1️⃣ Créer un compte Supabase (2 min)

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Créez un compte (GitHub recommandé)
4. Créez un nouveau projet :
   - Nom: `redacseo`
   - Mot de passe: (notez-le)
   - Région: Choisissez la plus proche

### 2️⃣ Configurer la base de données (1 min)

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Copiez-collez ce SQL et exécutez :

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE articles (
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

CREATE TABLE rules (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_rules_user_id ON rules(user_id);
```

### 3️⃣ Récupérer les credentials (30 sec)

Dans votre projet Supabase :
1. Allez dans **Settings** → **API**
2. Copiez :
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 4️⃣ Configurer le backend (1 min)

```bash
cd backend
npm install
cp .env.example .env
```

Éditez `backend/.env` :
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=VOTRE_PROJECT_URL_ICI
SUPABASE_ANON_KEY=VOTRE_ANON_KEY_ICI
SUPABASE_SERVICE_KEY=VOTRE_SERVICE_KEY_ICI

JWT_SECRET=mon_secret_super_securise_123
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

Démarrez le backend :
```bash
npm run dev
```

✅ Vous devriez voir : `🚀 Server running on http://localhost:5000`

### 5️⃣ Configurer le frontend (30 sec)

Nouveau terminal :
```bash
cd ..
npm install
```

Créez `.env` à la racine :
```env
VITE_API_URL=http://localhost:5000/api
```

Démarrez le frontend :
```bash
npm run dev
```

✅ Vous devriez voir : `Local: http://localhost:5173/`

## 🎉 C'est prêt !

Ouvrez `http://localhost:5173` et créez votre compte !

## ⚠️ Problèmes courants

### Le backend ne démarre pas
- Vérifiez que les credentials Supabase sont corrects
- Assurez-vous que le port 5000 n'est pas utilisé

### Le frontend ne se connecte pas
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez le fichier `.env` à la racine

### Erreur de connexion à la DB
- Vérifiez que les tables sont créées dans Supabase
- Vérifiez le SUPABASE_SERVICE_KEY (pas ANON_KEY)

## 📚 Documentation complète

Consultez le [README.md](README.md) pour plus de détails.
