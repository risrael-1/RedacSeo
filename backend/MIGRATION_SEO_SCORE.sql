-- Migration pour ajouter le score SEO aux articles
-- Date: 2026-01-16

-- Ajouter la colonne seo_score à la table articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN articles.seo_score IS 'Score SEO de l''article calculé sur 100 points';

-- Créer un index sur le score SEO pour les requêtes de tri
CREATE INDEX IF NOT EXISTS idx_articles_seo_score ON articles(seo_score DESC);
