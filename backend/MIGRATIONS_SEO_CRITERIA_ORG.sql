-- ============================================
-- RedacSeo - Migration Criteres SEO Organisation
-- ============================================
-- Ce fichier contient les migrations pour permettre
-- aux organisations de partager des criteres SEO
-- A executer APRES MIGRATIONS_ORGANIZATIONS.sql
-- ============================================

-- ============================================
-- 1. Ajouter organization_id a seo_criteria
-- ============================================

ALTER TABLE seo_criteria
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seo_criteria_organization_id ON seo_criteria(organization_id);

COMMENT ON COLUMN seo_criteria.organization_id IS 'Organisation proprietaire de ce critere (NULL pour criteres individuels)';

-- ============================================
-- 2. Rendre user_id nullable
-- ============================================
-- Les criteres d'organisation n'ont pas de user_id
-- Les criteres individuels gardent user_id

ALTER TABLE seo_criteria
ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- 3. Remplacer la contrainte unique
-- ============================================
-- L'ancienne contrainte UNIQUE(user_id, criterion_id)
-- est remplacee par deux index partiels

ALTER TABLE seo_criteria
DROP CONSTRAINT IF EXISTS seo_criteria_user_id_criterion_id_key;

-- Index unique pour criteres individuels (user_id NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_seo_criteria_user
  ON seo_criteria(user_id, criterion_id)
  WHERE user_id IS NOT NULL;

-- Index unique pour criteres d'organisation (organization_id NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_seo_criteria_org
  ON seo_criteria(organization_id, criterion_id)
  WHERE organization_id IS NOT NULL;

-- ============================================
-- 4. Contrainte de validation
-- ============================================
-- Un critere appartient soit a un utilisateur
-- soit a une organisation, jamais les deux

DO $$ BEGIN
  ALTER TABLE seo_criteria
  ADD CONSTRAINT chk_seo_criteria_owner
    CHECK (
      (user_id IS NOT NULL AND organization_id IS NULL)
      OR
      (user_id IS NULL AND organization_id IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

