import { supabase } from '../config/supabase.js';

// Get all users (super_admin and admin only)
export const getUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let users = [];

    if (currentUser.role === 'super_admin') {
      // Super admin sees all users
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, account_type, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      users = data || [];
    } else {
      // Admin: get project IDs where they are owner
      const { data: ownedProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId)
        .eq('role', 'owner');

      const projectIds = (ownedProjects || []).map(p => p.project_id);

      if (projectIds.length > 0) {
        // Get all members from those projects
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('user_id')
          .in('project_id', projectIds);

        const userIds = [...new Set((projectMembers || []).map(pm => pm.user_id))];
        userIds.push(userId); // Include self

        // Get user details
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, account_type, created_at')
          .in('id', userIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Get users error:', error);
          return res.status(500).json({ error: 'Failed to fetch users' });
        }
        users = data || [];
      } else {
        // Admin has no projects, just return themselves
        const { data } = await supabase
          .from('users')
          .select('id, email, role, account_type, created_at')
          .eq('id', userId)
          .single();

        users = data ? [data] : [];
      }
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user role (super_admin only, or admin for their project members)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;

    if (!['super_admin', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    if (!currentUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can set super_admin role
    if (role === 'super_admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can promote to super admin' });
    }

    // Admin can only set user or admin roles for users in their projects
    if (currentUser.role === 'admin') {
      // Check if target user is in one of admin's projects
      const { data: isInProject } = await supabase
        .from('project_members')
        .select('id')
        .eq('user_id', id)
        .in('project_id',
          supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', currentUserId)
            .eq('role', 'owner')
        )
        .single();

      if (!isInProject) {
        return res.status(403).json({ error: 'You can only modify users in your projects' });
      }
    } else if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent demoting yourself
    if (id === currentUserId && role !== currentUser.role) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, email, role')
      .single();

    if (error) {
      console.error('Update user role error:', error);
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    res.json({ message: 'User role updated', user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get project members
export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project members
    const { data: members, error } = await supabase
      .from('project_members')
      .select('id, role, user_id, created_at, accepted_at')
      .eq('project_id', projectId);

    if (error) {
      console.error('Get project members error:', error);
      return res.status(500).json({ error: 'Failed to fetch project members' });
    }

    // Get user details separately
    const userIds = (members || []).map(m => m.user_id).filter(Boolean);
    let usersMap = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', userIds);

      (users || []).forEach(u => {
        usersMap[u.id] = u;
      });
    }

    // Flatten the structure for frontend
    const flattenedMembers = (members || []).map(member => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      email: usersMap[member.user_id]?.email || '',
      user_role: usersMap[member.user_id]?.role || 'user',
      created_at: member.created_at,
      accepted_at: member.accepted_at
    }));

    res.json({ members: flattenedMembers });
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add member to project
export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId: targetUserId, role = 'member' } = req.body;
    const currentUserId = req.user.userId;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    // Check if current user is owner or admin of the project
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canAdd = currentUser?.role === 'super_admin' ||
                   currentMember?.role === 'owner' ||
                   currentMember?.role === 'admin';

    if (!canAdd) {
      return res.status(403).json({ error: 'You do not have permission to add members' });
    }

    // Check if user already exists in project
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const { data: member, error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: targetUserId,
        role,
        invited_by: currentUserId,
        accepted_at: new Date()
      }])
      .select('id, role, user_id, created_at')
      .single();

    if (error) {
      console.error('Add project member error:', error);
      return res.status(500).json({ error: 'Failed to add project member' });
    }

    // Get user details separately
    const { data: userDetails } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', targetUserId)
      .single();

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: member.id,
        role: member.role,
        user_id: member.user_id,
        created_at: member.created_at,
        email: userDetails?.email || '',
        user_role: userDetails?.role || 'user'
      }
    });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project member role
export const updateProjectMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if current user is owner of the project or super_admin
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canUpdate = currentUser?.role === 'super_admin' || currentMember?.role === 'owner';

    if (!canUpdate) {
      return res.status(403).json({ error: 'Only project owners can change member roles' });
    }

    // Can't change owner role
    const { data: targetMember } = await supabase
      .from('project_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single();

    if (targetMember?.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    const { data: updatedMember, error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('id', memberId)
      .select('id, role, user_id')
      .single();

    if (error) {
      console.error('Update project member role error:', error);
      return res.status(500).json({ error: 'Failed to update member role' });
    }

    // Get user details separately
    const { data: userDetails } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', updatedMember.user_id)
      .single();

    res.json({
      message: 'Member role updated',
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        user_id: updatedMember.user_id,
        email: userDetails?.email || ''
      }
    });
  } catch (error) {
    console.error('Update project member role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove member from project
export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const currentUserId = req.user.userId;

    // Check if current user is owner or admin of the project
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canRemove = currentUser?.role === 'super_admin' ||
                      currentMember?.role === 'owner' ||
                      currentMember?.role === 'admin';

    if (!canRemove) {
      return res.status(403).json({ error: 'You do not have permission to remove members' });
    }

    // Can't remove owner
    const { data: targetMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('id', memberId)
      .single();

    if (targetMember?.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Remove project member error:', error);
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Invite user to project by email
export const inviteToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;
    const currentUserId = req.user.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if current user can invite
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canInvite = currentUser?.role === 'super_admin' ||
                      currentMember?.role === 'owner' ||
                      currentMember?.role === 'admin';

    if (!canInvite) {
      return res.status(403).json({ error: 'You do not have permission to invite members' });
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // User exists, add them directly
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this project' });
      }

      const { data: member, error } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: existingUser.id,
          role,
          invited_by: currentUserId,
          accepted_at: new Date()
        }])
        .select()
        .single();

      if (error) {
        console.error('Add member error:', error);
        return res.status(500).json({ error: 'Failed to add member' });
      }

      return res.status(201).json({
        message: 'User added to project successfully',
        member,
        userExists: true
      });
    }

    // User doesn't exist, create invitation
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('project_invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .single();

    if (existingInvite) {
      // Update existing invitation
      const { error } = await supabase
        .from('project_invitations')
        .update({
          role,
          token,
          expires_at: expiresAt,
          invited_by: currentUserId
        })
        .eq('id', existingInvite.id);

      if (error) {
        console.error('Update invitation error:', error);
        return res.status(500).json({ error: 'Failed to update invitation' });
      }
    } else {
      // Create new invitation
      const { error } = await supabase
        .from('project_invitations')
        .insert([{
          project_id: projectId,
          email,
          role,
          invited_by: currentUserId,
          token,
          expires_at: expiresAt
        }]);

      if (error) {
        console.error('Create invitation error:', error);
        return res.status(500).json({ error: 'Failed to create invitation' });
      }
    }

    // In a real app, you would send an email here
    // For now, we just return the token (for testing)
    res.status(201).json({
      message: 'Invitation created. User will be added when they register.',
      email,
      userExists: false
    });
  } catch (error) {
    console.error('Invite to project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to check project access
async function checkProjectAccess(userId, projectId) {
  // Check if super_admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (user?.role === 'super_admin') {
    return true;
  }

  // Check if member of project
  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  return !!member;
}

// Helper function to generate invite token
function generateInviteToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get org members available for assignment to a project (not already members)
export const getOrgMembersForAssignment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.userId;

    // Check if user is owner or admin of the project
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canAssign = currentUser?.role === 'super_admin' ||
                      currentMember?.role === 'owner' ||
                      currentMember?.role === 'admin';

    if (!canAssign) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'affecter des membres' });
    }

    // Get the project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();

    if (!project?.organization_id) {
      return res.json({ members: [], isOrgProject: false });
    }

    // Get all org members
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        user_id,
        user:users!organization_members_user_id_fkey(id, email)
      `)
      .eq('organization_id', project.organization_id);

    // Get current project members
    const { data: projectMembers } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    const projectMemberIds = new Set((projectMembers || []).map(pm => pm.user_id));

    // Filter out members already in the project
    const availableMembers = (orgMembers || [])
      .filter(om => !projectMemberIds.has(om.user_id))
      .map(om => ({
        id: om.id,
        user_id: om.user_id,
        org_role: om.role,
        email: om.user?.email
      }));

    res.json({ members: availableMembers, isOrgProject: true });
  } catch (error) {
    console.error('Get org members for assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign an org member directly to a project (no invitation needed)
export const assignOrgMemberToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId: targetUserId, role = 'member' } = req.body;
    const currentUserId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    // Check if current user can assign members
    const { data: currentMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', currentUserId)
      .single();

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const canAssign = currentUser?.role === 'super_admin' ||
                      currentMember?.role === 'owner' ||
                      currentMember?.role === 'admin';

    if (!canAssign) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'affecter des membres' });
    }

    // Get the project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();

    if (!project?.organization_id) {
      return res.status(400).json({ error: 'Ce projet n\'appartient pas à une organisation' });
    }

    // Check if target user is a member of the same organization
    const { data: targetOrgMembership } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', targetUserId)
      .single();

    if (!targetOrgMembership) {
      return res.status(400).json({ error: 'L\'utilisateur n\'est pas membre de cette organisation' });
    }

    // Check if user already exists in project
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'L\'utilisateur est déjà membre de ce projet' });
    }

    // Add member directly (no invitation process)
    const { data: member, error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: targetUserId,
        role,
        invited_by: currentUserId,
        accepted_at: new Date()
      }])
      .select('id, role, user_id, created_at')
      .single();

    if (error) {
      console.error('Assign org member error:', error);
      return res.status(500).json({ error: 'Failed to assign member to project' });
    }

    // Get user details
    const { data: userDetails } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', targetUserId)
      .single();

    res.status(201).json({
      message: 'Membre affecté au projet avec succès',
      member: {
        id: member.id,
        role: member.role,
        user_id: member.user_id,
        created_at: member.created_at,
        email: userDetails?.email || '',
        user_role: userDetails?.role || 'user'
      }
    });
  } catch (error) {
    console.error('Assign org member to project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (super_admin only)
export const deleteUserAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Check if current user is super_admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    if (currentUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Seuls les super admins peuvent supprimer des utilisateurs' });
    }

    // Cannot delete yourself
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte depuis l\'admin' });
    }

    // Check target user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email, role, account_type')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Delete user's articles
    await supabase
      .from('articles')
      .delete()
      .eq('user_id', id);

    // Delete user's project memberships
    await supabase
      .from('project_members')
      .delete()
      .eq('user_id', id);

    // Delete projects owned by user (and their members/articles)
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', id);

    if (ownedProjects && ownedProjects.length > 0) {
      const projectIds = ownedProjects.map(p => p.id);

      await supabase
        .from('project_members')
        .delete()
        .in('project_id', projectIds);

      await supabase
        .from('articles')
        .delete()
        .in('project_id', projectIds);

      await supabase
        .from('projects')
        .delete()
        .eq('owner_id', id);
    }

    // Delete organization memberships
    await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', id);

    // If user owns an organization, delete it and its members
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', id);

    if (ownedOrgs && ownedOrgs.length > 0) {
      const orgIds = ownedOrgs.map(o => o.id);

      await supabase
        .from('organization_members')
        .delete()
        .in('organization_id', orgIds);

      await supabase
        .from('organization_invitations')
        .delete()
        .in('organization_id', orgIds);

      await supabase
        .from('organizations')
        .delete()
        .eq('owner_id', id);
    }

    // Finally, delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Admin delete user error:', deleteError);
      return res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get global admin statistics (super_admin only)
export const getAdminStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user is super_admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (currentUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Get counts in parallel
    const [usersResult, orgsResult, projectsResult, articlesResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('articles').select('*', { count: 'exact', head: true })
    ]);

    // Get users by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role');

    const roleStats = {
      super_admin: 0,
      admin: 0,
      user: 0
    };
    (usersByRole || []).forEach(u => {
      if (roleStats[u.role] !== undefined) {
        roleStats[u.role]++;
      } else {
        roleStats.user++;
      }
    });

    // Get users by account type
    const { data: usersByAccountType } = await supabase
      .from('users')
      .select('account_type');

    const accountTypeStats = {
      individual: 0,
      organization: 0
    };
    (usersByAccountType || []).forEach(u => {
      const type = u.account_type || 'individual';
      if (accountTypeStats[type] !== undefined) {
        accountTypeStats[type]++;
      }
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsersResult, recentArticlesResult] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    res.json({
      stats: {
        totals: {
          users: usersResult.count || 0,
          organizations: orgsResult.count || 0,
          projects: projectsResult.count || 0,
          articles: articlesResult.count || 0
        },
        usersByRole: roleStats,
        usersByAccountType: accountTypeStats,
        recent30Days: {
          newUsers: recentUsersResult.count || 0,
          newArticles: recentArticlesResult.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
