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
        .select('id, email, role, created_at')
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
          .select('id, email, role, created_at')
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
          .select('id, email, role, created_at')
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
