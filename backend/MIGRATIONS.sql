-- ============================================
-- RedacSeo - Migrations SQL Consolidees
-- ============================================
-- Ce fichier contient toutes les migrations necessaires
-- A executer dans l'ordre dans Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Tables de base (users, articles, rules)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

-- ============================================
-- 2. Projets
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#667eea',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(user_id, name);

-- Ajouter project_id aux articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);

-- ============================================
-- 3. Score SEO
-- ============================================

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_articles_seo_score ON articles(seo_score DESC);

-- Ajouter seo_fields_enabled aux articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS seo_fields_enabled BOOLEAN DEFAULT true;

-- ============================================
-- 4. Roles utilisateurs et membres de projets
-- ============================================

-- Type ENUM pour les roles globaux
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter la colonne role dans users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Table des membres de projet
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Table des invitations en attente
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, email)
);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);

-- ============================================
-- 5. Migration des donnees existantes
-- ============================================

-- Migrer les projets existants - le createur devient owner
INSERT INTO project_members (project_id, user_id, role, accepted_at)
SELECT id, user_id, 'owner', created_at
FROM projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================
-- 6. Commentaires pour documentation
-- ============================================

COMMENT ON TABLE users IS 'Utilisateurs de l''application';
COMMENT ON COLUMN users.role IS 'Role global: super_admin (acces total), admin (gere ses projets), user (membre basique)';

COMMENT ON TABLE projects IS 'Projets pour organiser les articles par client ou theme';
COMMENT ON COLUMN projects.name IS 'Nom du projet (ex: "Hotel des Bains")';
COMMENT ON COLUMN projects.color IS 'Couleur hex pour identifier visuellement le projet';

COMMENT ON TABLE project_members IS 'Membres d''un projet avec leur role dans ce projet';
COMMENT ON COLUMN project_members.role IS 'Role dans le projet: owner (createur), admin (gestion), member (lecture/ecriture)';

COMMENT ON TABLE project_invitations IS 'Invitations en attente pour rejoindre un projet';

COMMENT ON TABLE articles IS 'Articles SEO des utilisateurs';
COMMENT ON COLUMN articles.project_id IS 'Lien vers le projet associe (NULL si aucun projet)';
COMMENT ON COLUMN articles.seo_score IS 'Score SEO de l''article calcule sur 100 points';
