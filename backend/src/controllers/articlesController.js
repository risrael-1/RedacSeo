import { supabase } from '../config/supabase.js';

// Helper function to get accessible project IDs for a user
async function getAccessibleProjectIds(userId) {
  // Get user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (currentUser?.role === 'super_admin') {
    return { isSuperAdmin: true, projectIds: [] };
  }

  const projectIds = new Set();

  // Get projects user owns
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  (ownedProjects || []).forEach(p => projectIds.add(p.id));

  // Get projects user is a member of
  const { data: memberProjects } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);

  (memberProjects || []).forEach(pm => projectIds.add(pm.project_id));

  // Get user's organization membership
  const { data: orgMembership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  // For org owners/admins: add all org project IDs
  if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
    const { data: orgProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', orgMembership.organization_id);

    (orgProjects || []).forEach(p => projectIds.add(p.id));
  }

  return { isSuperAdmin: false, projectIds: Array.from(projectIds), orgMembership };
}

// Get all articles for a user (including articles from projects they're members of)
export const getArticles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { isSuperAdmin, projectIds } = await getAccessibleProjectIds(userId);

    let articles = [];

    if (isSuperAdmin) {
      // Super admin sees ALL articles
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Get articles error:', error);
        return res.status(500).json({ error: 'Failed to fetch articles' });
      }
      articles = data || [];
    } else {
      // Get user's own articles (without project)
      const { data: ownArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', userId)
        .is('project_id', null);

      // Get articles from accessible projects
      let projectArticles = [];
      if (projectIds.length > 0) {
        const { data: projArticles } = await supabase
          .from('articles')
          .select('*')
          .in('project_id', projectIds);
        projectArticles = projArticles || [];
      }

      // Combine and deduplicate
      const articleMap = new Map();
      (ownArticles || []).forEach(a => articleMap.set(a.id, a));
      projectArticles.forEach(a => {
        if (!articleMap.has(a.id)) {
          articleMap.set(a.id, a);
        }
      });

      articles = Array.from(articleMap.values());
      articles.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    res.json({ articles });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single article
export const getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get the article first
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check access
    const { isSuperAdmin, projectIds } = await getAccessibleProjectIds(userId);

    // Super admin can access all
    if (isSuperAdmin) {
      return res.json({ article });
    }

    // User owns the article (and it has no project)
    if (article.user_id === userId && !article.project_id) {
      return res.json({ article });
    }

    // Article belongs to an accessible project
    if (article.project_id && projectIds.includes(article.project_id)) {
      return res.json({ article });
    }

    return res.status(403).json({ error: 'Accès refusé à cet article' });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new article
export const createArticle = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      project_id,
      article_name,
      title,
      meta_description,
      keyword,
      secondary_keywords,
      content,
      word_count,
      seo_score,
      seo_fields_enabled,
      status
    } = req.body;

    // Get user's accessible projects and org membership
    const { isSuperAdmin, projectIds, orgMembership } = await getAccessibleProjectIds(userId);

    // Check if user is an org member (not owner/admin)
    const isOrgMemberOnly = orgMembership && orgMembership.role === 'member';

    // Org members must specify a project they have access to
    if (isOrgMemberOnly) {
      if (!project_id) {
        return res.status(403).json({
          error: 'Les membres d\'organisation doivent sélectionner un projet pour créer un article.'
        });
      }
      if (!projectIds.includes(project_id)) {
        return res.status(403).json({
          error: 'Vous n\'avez pas accès à ce projet.'
        });
      }
    }

    // For non-super-admin users, verify project access if project_id is specified
    if (!isSuperAdmin && project_id) {
      if (!projectIds.includes(project_id)) {
        return res.status(403).json({
          error: 'Vous n\'avez pas accès à ce projet.'
        });
      }
    }

    const { data: article, error} = await supabase
      .from('articles')
      .insert([
        {
          user_id: userId,
          project_id: project_id || null,
          article_name: article_name || 'Nouvel article',
          title: title || '',
          meta_description: meta_description || '',
          keyword: keyword || '',
          secondary_keywords: secondary_keywords || [],
          content: content || '',
          word_count: word_count || 0,
          seo_score: seo_score || 0,
          seo_fields_enabled: seo_fields_enabled !== false, // true par défaut
          status: status || 'Brouillon'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create article error:', error);
      return res.status(500).json({ error: 'Failed to create article' });
    }

    res.status(201).json({
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update article
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      project_id,
      article_name,
      title,
      meta_description,
      keyword,
      secondary_keywords,
      content,
      word_count,
      seo_score,
      seo_fields_enabled,
      status
    } = req.body;

    // Get the article first
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check access
    const { isSuperAdmin, projectIds, orgMembership } = await getAccessibleProjectIds(userId);

    let hasAccess = false;
    if (isSuperAdmin) {
      hasAccess = true;
    } else if (existingArticle.user_id === userId && !existingArticle.project_id) {
      hasAccess = true;
    } else if (existingArticle.project_id && projectIds.includes(existingArticle.project_id)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès refusé à cet article' });
    }

    // If changing project, verify access to new project
    if (project_id && project_id !== existingArticle.project_id) {
      if (!isSuperAdmin && !projectIds.includes(project_id)) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès au projet cible' });
      }
    }

    // Org members cannot remove article from project (set project_id to null)
    const isOrgMemberOnly = orgMembership && orgMembership.role === 'member';
    if (isOrgMemberOnly && existingArticle.project_id && !project_id) {
      return res.status(403).json({
        error: 'Les membres d\'organisation ne peuvent pas retirer un article de son projet'
      });
    }

    const { data: article, error } = await supabase
      .from('articles')
      .update({
        project_id,
        article_name,
        title,
        meta_description,
        keyword,
        secondary_keywords,
        content,
        word_count,
        seo_score,
        seo_fields_enabled,
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update article error:', error);
      return res.status(500).json({ error: 'Failed to update article' });
    }

    res.json({
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get the article first
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check access
    const { isSuperAdmin, projectIds } = await getAccessibleProjectIds(userId);

    let hasAccess = false;
    if (isSuperAdmin) {
      hasAccess = true;
    } else if (existingArticle.user_id === userId && !existingArticle.project_id) {
      // User owns the article and it has no project
      hasAccess = true;
    } else if (existingArticle.project_id && projectIds.includes(existingArticle.project_id)) {
      // Article belongs to an accessible project
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès refusé à cet article' });
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete article error:', error);
      return res.status(500).json({ error: 'Failed to delete article' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
