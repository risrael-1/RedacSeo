import { supabase } from '../config/supabase.js';

// Helper function to check if user can modify a project
async function checkProjectPermission(userId, projectId, projectOwnerId) {
  // Check if user is the project owner
  if (projectOwnerId === userId) {
    return true;
  }

  // Check if user is super_admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (currentUser?.role === 'super_admin') {
    return true;
  }

  // Check if user is admin of the project via project_members
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (membership?.role === 'owner' || membership?.role === 'admin') {
    return true;
  }

  // Check if project belongs to an organization where user is owner/admin
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single();

  if (project?.organization_id) {
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .single();

    return orgMembership?.role === 'owner' || orgMembership?.role === 'admin';
  }

  return false;
}

// Helper function to get user's organization ID
async function getUserOrganizationId(userId) {
  // Check if user owns an organization
  const { data: ownedOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (ownedOrg) {
    return ownedOrg.id;
  }

  // Check if user is a member of an organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  return membership?.organization_id || null;
}

// Get all projects for a user (including projects they're members of and organization projects)
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's role and account type
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_type')
      .eq('id', userId)
      .single();

    let projects = [];

    if (currentUser?.role === 'super_admin') {
      // Super admin sees ALL projects
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:users!projects_user_id_fkey(id, email),
          organization:organizations(id, name, slug)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      // Add my_role for super_admin (owner if it's their project, super_admin otherwise)
      projects = (data || []).map(p => ({
        ...p,
        my_role: p.user_id === userId ? 'owner' : 'super_admin'
      }));
    } else {
      // Get projects user owns
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select(`
          *,
          organization:organizations(id, name, slug)
        `)
        .eq('user_id', userId);

      // Auto-fix: ensure owner is in project_members for all owned projects
      for (const project of (ownedProjects || [])) {
        const { data: existingMembership } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', project.id)
          .eq('user_id', userId)
          .single();

        if (!existingMembership) {
          // Owner is missing from project_members, add them
          await supabase
            .from('project_members')
            .insert([{
              project_id: project.id,
              user_id: userId,
              role: 'owner',
              accepted_at: new Date()
            }]);
          console.log(`Auto-fixed: Added owner ${userId} to project_members for project ${project.id}`);
        }
      }

      // Get projects user is a member of (via project_members)
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select(`
          role,
          project:projects(*,
            organization:organizations(id, name, slug)
          )
        `)
        .eq('user_id', userId);

      // Get user's organization membership
      const { data: orgMembership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .single();

      // Combine and deduplicate projects
      const projectMap = new Map();

      // For org owners/admins: get all organization projects
      // For org members: they only see projects via project_members (already fetched above)
      if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
        const { data: organizationProjects } = await supabase
          .from('projects')
          .select(`
            *,
            organization:organizations(id, name, slug)
          `)
          .eq('organization_id', orgMembership.organization_id);

        (organizationProjects || []).forEach(p => {
          projectMap.set(p.id, {
            ...p,
            my_role: p.user_id === userId ? 'owner' : `org_${orgMembership.role}`
          });
        });
      }

      // Add from memberProjects (has the correct role, overrides org role if applicable)
      // This includes projects org members are explicitly assigned to
      (memberProjects || []).forEach(pm => {
        if (pm.project) {
          projectMap.set(pm.project.id, { ...pm.project, my_role: pm.role });
        }
      });

      // Add owned projects that might not be in memberProjects yet
      (ownedProjects || []).forEach(p => {
        if (!projectMap.has(p.id)) {
          projectMap.set(p.id, { ...p, my_role: 'owner' });
        }
      });

      projects = Array.from(projectMap.values());
      projects.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    // Get article count and member count for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const [articleResult, memberResult] = await Promise.all([
          supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id),
          supabase
            .from('project_members')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
        ]);

        return {
          ...project,
          article_count: articleResult.count || 0,
          member_count: memberResult.count || 0
        };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Get user's account type and organization membership
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_type')
      .eq('id', userId)
      .single();

    // Check if user is in an organization (as member, not owner)
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .single();

    // If user is a non-admin org member, deny project creation
    if (orgMembership && orgMembership.role === 'member') {
      return res.status(403).json({
        error: 'Les membres d\'organisation ne peuvent pas créer de projets. Seuls les administrateurs et propriétaires de l\'organisation peuvent créer des projets.'
      });
    }

    // Get user's organization ID (if they're part of an organization)
    const organizationId = await getUserOrganizationId(userId);

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: userId,
          name,
          description: description || '',
          color: color || '#667eea',
          organization_id: organizationId
        }
      ])
      .select(`
        *,
        organization:organizations(id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    // Add creator as owner in project_members - this is critical
    const { error: memberError } = await supabase
      .from('project_members')
      .insert([{
        project_id: project.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date()
      }]);

    if (memberError) {
      console.error('Add owner to project_members error:', memberError);
      // If member insert failed, delete the project and return error
      await supabase.from('projects').delete().eq('id', project.id);
      return res.status(500).json({ error: 'Failed to create project membership' });
    }

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, color } = req.body;

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions: owner, super_admin, or project admin
    const canUpdate = await checkProjectPermission(userId, id, existingProject.user_id);
    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        color,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions: owner or super_admin only (not project admins)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isOwner = existingProject.user_id === userId;
    const isSuperAdmin = currentUser?.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Only project owner or super admin can delete projects' });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
