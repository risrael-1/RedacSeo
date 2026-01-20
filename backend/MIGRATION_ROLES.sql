-- Migration: Ajout de la gestion des rôles et membres de projets
-- Date: 2026-01-19
-- Description: Ajout des rôles utilisateurs et de la table project_members

-- 1. Créer le type ENUM pour les rôles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Ajouter la colonne role dans la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. Définir les super admins (raphael.israel@live.fr et julie.saint-genes@orange.fr)
UPDATE users SET role = 'super_admin' WHERE email IN ('raphael.israel@live.fr');
UPDATE users SET role = 'admin' WHERE email IN ('julie.saint-genes@orange.fr');

-- 4. Créer la table project_members pour gérer les membres d'un projet
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

-- 5. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 6. Migrer les projets existants - le créateur devient owner
INSERT INTO project_members (project_id, user_id, role, accepted_at)
SELECT id, user_id, 'owner', created_at
FROM projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 7. Créer une table pour les invitations en attente
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

-- 8. Commentaires pour documentation
COMMENT ON COLUMN users.role IS 'Rôle global: super_admin (accès total), admin (gère ses projets + users), user (membre basique)';
COMMENT ON TABLE project_members IS 'Membres d''un projet avec leur rôle dans ce projet';
COMMENT ON COLUMN project_members.role IS 'Rôle dans le projet: owner (créateur), admin (gestion), member (lecture/écriture)';
COMMENT ON TABLE project_invitations IS 'Invitations en attente pour rejoindre un projet';
