-- Migration: Ajout de la gestion des projets
-- Date: 2026-01-16
-- Description: Cr\u00e9ation de la table projects et modification de la table articles

-- 1. Cr\u00e9er la table projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#667eea',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requ\u00eates
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(user_id, name);

-- 2. Ajouter la colonne project_id dans la table articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Index pour la relation articles <-> projects
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);

-- 3. Commentaires pour documentation
COMMENT ON TABLE projects IS 'Projets pour organiser les articles par client ou th\u00e8me';
COMMENT ON COLUMN projects.name IS 'Nom du projet (ex: "H\u00f4tel des Bains")';
COMMENT ON COLUMN projects.description IS 'Description optionnelle du projet';
COMMENT ON COLUMN projects.color IS 'Couleur hex pour identifier visuellement le projet (#667eea par d\u00e9faut)';
COMMENT ON COLUMN articles.project_id IS 'Lien vers le projet associ\u00e9 (NULL si aucun projet)';
