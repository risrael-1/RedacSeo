import { supabase } from '../config/supabase.js';

// Default SEO criteria that will be used if user has no custom criteria
const defaultCriteria = [
  {
    criterion_id: 'content-length',
    label: 'Longueur du contenu',
    description: 'Le contenu doit contenir au moins 300 mots',
    icon: '📝',
    max_points: 15,
    check_type: 'word_count',
    min_value: 300,
    max_value: null,
    target_value: 800
  },
  {
    criterion_id: 'keyword-title',
    label: 'Mot-clé dans le titre',
    description: 'Le mot-clé principal doit apparaître dans le titre SEO',
    icon: '🎯',
    max_points: 12,
    check_type: 'keyword_in_title',
    min_value: null,
    max_value: null,
    target_value: null
  },
  {
    criterion_id: 'keyword-meta',
    label: 'Mot-clé dans la meta',
    description: 'Le mot-clé principal doit apparaître dans la meta description',
    icon: '📄',
    max_points: 8,
    check_type: 'keyword_in_meta',
    min_value: null,
    max_value: null,
    target_value: null
  },
  {
    criterion_id: 'meta-length',
    label: 'Longueur meta description',
    description: 'La meta description doit faire entre 120 et 160 caractères',
    icon: '📄',
    max_points: 8,
    check_type: 'meta_length',
    min_value: 120,
    max_value: 160,
    target_value: null
  },
  {
    criterion_id: 'keyword-density',
    label: 'Densité du mot-clé',
    description: 'Le mot-clé doit apparaître entre 1% et 2.5% du contenu',
    icon: '💎',
    max_points: 12,
    check_type: 'keyword_density',
    min_value: 1,
    max_value: 2.5,
    target_value: null
  },
  {
    criterion_id: 'h1-structure',
    label: 'Structure H1',
    description: 'Le contenu doit contenir exactement 1 balise H1',
    icon: '🏷️',
    max_points: 10,
    check_type: 'h1_count',
    min_value: 1,
    max_value: 1,
    target_value: 1
  },
  {
    criterion_id: 'h1-keyword',
    label: 'Mot-clé dans H1',
    description: 'Le mot-clé principal doit apparaître dans le H1',
    icon: '🏷️',
    max_points: 3,
    check_type: 'keyword_in_h1',
    min_value: null,
    max_value: null,
    target_value: null
  },
  {
    criterion_id: 'h2-structure',
    label: 'Structure H2',
    description: 'Le contenu doit contenir au moins 2 balises H2',
    icon: '📋',
    max_points: 6,
    check_type: 'h2_count',
    min_value: 2,
    max_value: null,
    target_value: 3
  },
  {
    criterion_id: 'h3-structure',
    label: 'Structure H3',
    description: 'Le contenu doit contenir au moins 2 balises H3',
    icon: '📋',
    max_points: 4,
    check_type: 'h3_count',
    min_value: 2,
    max_value: null,
    target_value: null
  },
  {
    criterion_id: 'title-length',
    label: 'Longueur du titre',
    description: 'Le titre doit faire entre 30 et 60 caractères',
    icon: '📌',
    max_points: 5,
    check_type: 'title_length',
    min_value: 30,
    max_value: 60,
    target_value: null
  },
  {
    criterion_id: 'keyword-intro',
    label: 'Mot-clé au début',
    description: 'Le mot-clé doit apparaître dans les 100 premiers mots',
    icon: '⚡',
    max_points: 5,
    check_type: 'keyword_in_intro',
    min_value: null,
    max_value: null,
    target_value: 100
  },
  {
    criterion_id: 'strong-tags',
    label: 'Contenu en gras',
    description: 'Le contenu doit contenir au moins 3 balises strong',
    icon: '💪',
    max_points: 5,
    check_type: 'strong_count',
    min_value: 3,
    max_value: null,
    target_value: 5
  },
  {
    criterion_id: 'title-present',
    label: 'Titre présent',
    description: 'Un titre SEO doit être défini',
    icon: '✅',
    max_points: 5,
    check_type: 'title_present',
    min_value: null,
    max_value: null,
    target_value: null
  },
  {
    criterion_id: 'meta-present',
    label: 'Meta description présente',
    description: 'Une meta description doit être définie',
    icon: '✅',
    max_points: 2,
    check_type: 'meta_present',
    min_value: null,
    max_value: null,
    target_value: null
  }
];

// Helper: Resolve user's organization context for SEO criteria
async function resolveOrgContext(userId) {
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (membership) {
    return {
      isOrg: true,
      organizationId: membership.organization_id,
      orgRole: membership.role,
      canManage: membership.role === 'owner' || membership.role === 'admin'
    };
  }

  return { isOrg: false, organizationId: null, orgRole: null, canManage: false };
}

// Get all SEO criteria for a user (or their organization)
export const getSeoCriteria = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgContext = await resolveOrgContext(userId);

    let query = supabase
      .from('seo_criteria')
      .select('*')
      .order('created_at', { ascending: true });

    if (orgContext.isOrg) {
      query = query.eq('organization_id', orgContext.organizationId);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: criteria, error } = await query;

    if (error) {
      console.error('Get SEO criteria error:', error);
      return res.status(500).json({ error: 'Failed to fetch SEO criteria' });
    }

    // If no criteria found, return defaults
    if (!criteria || criteria.length === 0) {
      return res.json({
        criteria: defaultCriteria.map(c => ({ ...c, enabled: true })),
        isDefault: true,
        isOrganization: orgContext.isOrg,
        canManage: orgContext.isOrg ? orgContext.canManage : true
      });
    }

    res.json({
      criteria,
      isDefault: false,
      isOrganization: orgContext.isOrg,
      canManage: orgContext.isOrg ? orgContext.canManage : true
    });
  } catch (error) {
    console.error('Get SEO criteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Initialize default criteria for a user or organization
export const initializeDefaultCriteria = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgContext = await resolveOrgContext(userId);

    // If org mode, only owners/admins can initialize
    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent initialiser les critères de l\'organisation'
      });
    }

    // Check if criteria already exist
    let checkQuery = supabase.from('seo_criteria').select('id').limit(1);
    if (orgContext.isOrg) {
      checkQuery = checkQuery.eq('organization_id', orgContext.organizationId);
    } else {
      checkQuery = checkQuery.eq('user_id', userId);
    }

    const { data: existingCriteria } = await checkQuery;

    if (existingCriteria && existingCriteria.length > 0) {
      return res.status(400).json({ error: 'User already has SEO criteria' });
    }

    // Insert default criteria
    const criteriaToInsert = defaultCriteria.map(c => ({
      ...c,
      user_id: orgContext.isOrg ? null : userId,
      organization_id: orgContext.isOrg ? orgContext.organizationId : null,
      enabled: true
    }));

    const { data, error } = await supabase
      .from('seo_criteria')
      .insert(criteriaToInsert)
      .select();

    if (error) {
      console.error('Initialize criteria error:', error);
      return res.status(500).json({ error: 'Failed to initialize SEO criteria' });
    }

    res.json({ message: 'SEO criteria initialized successfully', criteria: data });
  } catch (error) {
    console.error('Initialize criteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or update a single criterion
export const upsertCriterion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { criterion_id, label, description, icon, max_points, enabled, check_type, min_value, max_value, target_value } = req.body;
    const orgContext = await resolveOrgContext(userId);

    // If org mode, only owners/admins can modify
    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent modifier les critères de l\'organisation'
      });
    }

    if (!criterion_id || !label || !check_type) {
      return res.status(400).json({ error: 'criterion_id, label, and check_type are required' });
    }

    // Check if criterion exists
    let findQuery = supabase
      .from('seo_criteria')
      .select('*')
      .eq('criterion_id', criterion_id);

    if (orgContext.isOrg) {
      findQuery = findQuery.eq('organization_id', orgContext.organizationId);
    } else {
      findQuery = findQuery.eq('user_id', userId);
    }

    const { data: existingCriterion } = await findQuery.single();

    let result;

    if (existingCriterion) {
      // Update existing criterion
      let updateQuery = supabase
        .from('seo_criteria')
        .update({
          label,
          description,
          icon: icon || '📝',
          max_points: max_points || 10,
          enabled: enabled !== undefined ? enabled : true,
          check_type,
          min_value,
          max_value,
          target_value,
          updated_at: new Date()
        })
        .eq('criterion_id', criterion_id);

      if (orgContext.isOrg) {
        updateQuery = updateQuery.eq('organization_id', orgContext.organizationId);
      } else {
        updateQuery = updateQuery.eq('user_id', userId);
      }

      const { data, error } = await updateQuery.select().single();

      if (error) {
        console.error('Update criterion error:', error);
        return res.status(500).json({ error: 'Failed to update criterion' });
      }
      result = data;
    } else {
      // Create new criterion
      const { data, error } = await supabase
        .from('seo_criteria')
        .insert([{
          user_id: orgContext.isOrg ? null : userId,
          organization_id: orgContext.isOrg ? orgContext.organizationId : null,
          criterion_id,
          label,
          description,
          icon: icon || '📝',
          max_points: max_points || 10,
          enabled: enabled !== undefined ? enabled : true,
          check_type,
          min_value,
          max_value,
          target_value
        }])
        .select()
        .single();

      if (error) {
        console.error('Create criterion error:', error);
        return res.status(500).json({ error: 'Failed to create criterion' });
      }
      result = data;
    }

    res.json({ message: 'Criterion saved successfully', criterion: result });
  } catch (error) {
    console.error('Upsert criterion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a criterion
export const deleteCriterion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { criterionId } = req.params;
    const orgContext = await resolveOrgContext(userId);

    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent supprimer les critères de l\'organisation'
      });
    }

    let deleteQuery = supabase
      .from('seo_criteria')
      .delete()
      .eq('criterion_id', criterionId);

    if (orgContext.isOrg) {
      deleteQuery = deleteQuery.eq('organization_id', orgContext.organizationId);
    } else {
      deleteQuery = deleteQuery.eq('user_id', userId);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error('Delete criterion error:', error);
      return res.status(500).json({ error: 'Failed to delete criterion' });
    }

    res.json({ message: 'Criterion deleted successfully' });
  } catch (error) {
    console.error('Delete criterion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle criterion enabled status
export const toggleCriterion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { criterionId } = req.params;
    const orgContext = await resolveOrgContext(userId);

    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent modifier les critères de l\'organisation'
      });
    }

    // Get current status
    let findQuery = supabase
      .from('seo_criteria')
      .select('enabled')
      .eq('criterion_id', criterionId);

    if (orgContext.isOrg) {
      findQuery = findQuery.eq('organization_id', orgContext.organizationId);
    } else {
      findQuery = findQuery.eq('user_id', userId);
    }

    const { data: criterion, error: fetchError } = await findQuery.single();

    if (fetchError || !criterion) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    // Toggle
    let updateQuery = supabase
      .from('seo_criteria')
      .update({ enabled: !criterion.enabled, updated_at: new Date() })
      .eq('criterion_id', criterionId);

    if (orgContext.isOrg) {
      updateQuery = updateQuery.eq('organization_id', orgContext.organizationId);
    } else {
      updateQuery = updateQuery.eq('user_id', userId);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      console.error('Toggle criterion error:', error);
      return res.status(500).json({ error: 'Failed to toggle criterion' });
    }

    res.json({ message: 'Criterion toggled successfully', criterion: data });
  } catch (error) {
    console.error('Toggle criterion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Batch update criteria
export const batchUpdateCriteria = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { criteria } = req.body;
    const orgContext = await resolveOrgContext(userId);

    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent modifier les critères de l\'organisation'
      });
    }

    if (!Array.isArray(criteria)) {
      return res.status(400).json({ error: 'criteria must be an array' });
    }

    const updatedCriteria = [];

    for (const criterion of criteria) {
      const { criterion_id, label, description, icon, max_points, enabled, check_type, min_value, max_value, target_value } = criterion;

      // Check if criterion exists
      let findQuery = supabase
        .from('seo_criteria')
        .select('*')
        .eq('criterion_id', criterion_id);

      if (orgContext.isOrg) {
        findQuery = findQuery.eq('organization_id', orgContext.organizationId);
      } else {
        findQuery = findQuery.eq('user_id', userId);
      }

      const { data: existingCriterion } = await findQuery.single();

      if (existingCriterion) {
        // Update
        let updateQuery = supabase
          .from('seo_criteria')
          .update({
            label,
            description,
            icon,
            max_points,
            enabled,
            check_type,
            min_value,
            max_value,
            target_value,
            updated_at: new Date()
          })
          .eq('criterion_id', criterion_id);

        if (orgContext.isOrg) {
          updateQuery = updateQuery.eq('organization_id', orgContext.organizationId);
        } else {
          updateQuery = updateQuery.eq('user_id', userId);
        }

        const { data } = await updateQuery.select().single();
        if (data) updatedCriteria.push(data);
      } else {
        // Insert
        const { data } = await supabase
          .from('seo_criteria')
          .insert([{
            user_id: orgContext.isOrg ? null : userId,
            organization_id: orgContext.isOrg ? orgContext.organizationId : null,
            criterion_id,
            label,
            description,
            icon,
            max_points,
            enabled,
            check_type,
            min_value,
            max_value,
            target_value
          }])
          .select()
          .single();

        if (data) updatedCriteria.push(data);
      }
    }

    res.json({ message: 'Criteria updated successfully', criteria: updatedCriteria });
  } catch (error) {
    console.error('Batch update criteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset to default criteria
export const resetToDefault = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgContext = await resolveOrgContext(userId);

    if (orgContext.isOrg && !orgContext.canManage) {
      return res.status(403).json({
        error: 'Seuls les administrateurs peuvent réinitialiser les critères de l\'organisation'
      });
    }

    // Delete all existing criteria
    let deleteQuery = supabase.from('seo_criteria').delete();
    if (orgContext.isOrg) {
      deleteQuery = deleteQuery.eq('organization_id', orgContext.organizationId);
    } else {
      deleteQuery = deleteQuery.eq('user_id', userId);
    }
    await deleteQuery;

    // Insert default criteria
    const criteriaToInsert = defaultCriteria.map(c => ({
      ...c,
      user_id: orgContext.isOrg ? null : userId,
      organization_id: orgContext.isOrg ? orgContext.organizationId : null,
      enabled: true
    }));

    const { data, error } = await supabase
      .from('seo_criteria')
      .insert(criteriaToInsert)
      .select();

    if (error) {
      console.error('Reset criteria error:', error);
      return res.status(500).json({ error: 'Failed to reset SEO criteria' });
    }

    res.json({ message: 'SEO criteria reset to default successfully', criteria: data });
  } catch (error) {
    console.error('Reset criteria error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
