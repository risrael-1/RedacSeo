-- ============================================
-- RedacSeo - Migration Organisations
-- ============================================
-- Ce fichier contient les migrations pour le systeme
-- d'organisations / comptes individuels
-- A executer APRES MIGRATIONS.sql dans Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Type ENUM pour le type de compte
-- ============================================

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('individual', 'organization');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Table des organisations
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

COMMENT ON TABLE organizations IS 'Organisations pour regrouper plusieurs utilisateurs';
COMMENT ON COLUMN organizations.slug IS 'Identifiant URL-friendly unique (ex: mmc)';
COMMENT ON COLUMN organizations.owner_id IS 'Proprietaire de l''organisation (createur du compte organisation)';

-- ============================================
-- 3. Table des membres d'organisation
-- ============================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

COMMENT ON TABLE organization_members IS 'Membres d''une organisation avec leur role';
COMMENT ON COLUMN organization_members.role IS 'Role dans l''organisation: owner (createur), admin (gestion), member (acces projets)';

-- ============================================
-- 4. Table des invitations d'organisation
-- ============================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);

COMMENT ON TABLE organization_invitations IS 'Invitations en attente pour rejoindre une organisation';

-- ============================================
-- 5. Modifier la table users
-- ============================================

-- Ajouter le type de compte (individual par defaut)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'individual';

-- Ajouter la reference vers l'organisation (pour les membres invites)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

COMMENT ON COLUMN users.account_type IS 'Type de compte: individual (projets personnels) ou organization (compte organisation)';
COMMENT ON COLUMN users.organization_id IS 'Organisation principale de l''utilisateur (NULL pour les individuels et les owners d''org)';

-- ============================================
-- 6. Modifier la table projects
-- ============================================

-- Ajouter la reference vers l'organisation
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);

COMMENT ON COLUMN projects.organization_id IS 'Organisation proprietaire du projet (NULL pour projets individuels)';

-- ============================================
-- 7. Migration des donnees existantes
-- ============================================

-- Tous les utilisateurs existants deviennent des comptes individuels
UPDATE users
SET account_type = 'individual'
WHERE account_type IS NULL;


-- ============================================
-- 9. Vues utiles pour les requetes
-- ============================================

-- Vue des organisations avec nombre de membres
CREATE OR REPLACE VIEW organizations_with_stats AS
SELECT
  o.*,
  COUNT(DISTINCT om.user_id) as member_count,
  COUNT(DISTINCT p.id) as project_count
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
LEFT JOIN projects p ON p.organization_id = o.id
GROUP BY o.id;

-- Vue des utilisateurs avec leur organisation
CREATE OR REPLACE VIEW users_with_organization AS
SELECT
  u.*,
  o.name as organization_name,
  o.slug as organization_slug,
  om.role as organization_role
FROM users u
LEFT JOIN organization_members om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.organization_id;

-- ============================================
-- 10. Permissions et acces
-- ============================================

-- Note: La logique de permissions est geree dans le backend
-- super_admin: acces a tout (toutes les organisations, tous les projets)
-- organization owner/admin: gestion de l'organisation et ses projets
-- organization member: acces aux projets de l'organisation
-- individual: acces uniquement a ses propres projets

COMMENT ON TABLE organizations IS 'Permissions: super_admin voit tout, owner/admin gerent, members ont acces en lecture/ecriture aux projets';
