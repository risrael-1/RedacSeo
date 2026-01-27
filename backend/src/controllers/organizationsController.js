import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

// Helper: Check if user has access to organization
async function checkOrganizationAccess(userId, organizationId) {
  // Check if user is super_admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (currentUser?.role === 'super_admin') {
    return { access: true, role: 'super_admin' };
  }

  // Check if user is member of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (membership) {
    return { access: true, role: membership.role };
  }

  return { access: false, role: null };
}

// Helper: Check if user can manage organization (owner, admin, or super_admin)
async function canManageOrganization(userId, organizationId) {
  const { access, role } = await checkOrganizationAccess(userId, organizationId);
  return access && ['owner', 'admin', 'super_admin'].includes(role);
}

// Generate URL-friendly slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// Organization CRUD
// ============================================

// Get user's organization (for organization accounts)
export const getMyOrganization = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's account type
    const { data: user } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', userId)
      .single();

    if (user?.account_type !== 'organization') {
      return res.status(400).json({ error: 'User does not have an organization account' });
    }

    // Find organization where user is owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (!membership?.organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get member count and project count
    const [memberResult, projectResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', membership.organization.id),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', membership.organization.id)
    ]);

    res.json({
      organization: {
        ...membership.organization,
        member_count: memberResult.count || 0,
        project_count: projectResult.count || 0
      }
    });
  } catch (error) {
    console.error('Get my organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all organizations (super_admin only)
export const getAllOrganizations = async (req, res) => {
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

    // Get all organizations with stats
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:users!organizations_owner_id_fkey(id, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get organizations error:', error);
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    // Get member and project counts
    const orgsWithCounts = await Promise.all(
      (organizations || []).map(async (org) => {
        const [memberResult, projectResult] = await Promise.all([
          supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id),
          supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
        ]);

        return {
          ...org,
          member_count: memberResult.count || 0,
          project_count: projectResult.count || 0
        };
      })
    );

    res.json({ organizations: orgsWithCounts });
  } catch (error) {
    console.error('Get all organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single organization
export const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check access
    const { access } = await checkOrganizationAccess(userId, id);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:users!organizations_owner_id_fkey(id, email)
      `)
      .eq('id', id)
      .single();

    if (error || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get member and project counts
    const [memberResult, projectResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id),
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
    ]);

    res.json({
      organization: {
        ...organization,
        member_count: memberResult.count || 0,
        project_count: projectResult.count || 0
      }
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create organization (upgrade individual to organization account)
export const createOrganization = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Check if user already has an organization account
    const { data: user } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', userId)
      .single();

    if (user?.account_type === 'organization') {
      return res.status(400).json({ error: 'User already has an organization account' });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = true;
    let slugSuffix = 0;

    while (slugExists) {
      const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug;
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', checkSlug)
        .single();

      if (!existing) {
        slug = checkSlug;
        slugExists = false;
      } else {
        slugSuffix++;
      }
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name,
        slug,
        description: description || '',
        owner_id: userId
      }])
      .select()
      .single();

    if (orgError) {
      console.error('Create organization error:', orgError);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Add owner to organization_members
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: organization.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date()
      }]);

    if (memberError) {
      // Rollback organization creation
      await supabase.from('organizations').delete().eq('id', organization.id);
      console.error('Add owner to organization_members error:', memberError);
      return res.status(500).json({ error: 'Failed to create organization membership' });
    }

    // Update user account type
    const { error: userError } = await supabase
      .from('users')
      .update({ account_type: 'organization' })
      .eq('id', userId);

    if (userError) {
      // Rollback
      await supabase.from('organization_members').delete().eq('organization_id', organization.id);
      await supabase.from('organizations').delete().eq('id', organization.id);
      console.error('Update user account type error:', userError);
      return res.status(500).json({ error: 'Failed to update account type' });
    }

    // Migrate user's existing projects to organization
    await supabase
      .from('projects')
      .update({ organization_id: organization.id })
      .eq('user_id', userId)
      .is('organization_id', null);

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update organization
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, logo_url } = req.body;

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update organization error:', error);
      return res.status(500).json({ error: 'Failed to update organization' });
    }

    res.json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload organization logo (base64)
export const uploadOrganizationLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { logo_base64 } = req.body;

    // Check if user can manage organization (owner only for logo)
    const { access, role } = await checkOrganizationAccess(userId, id);
    if (!access || (role !== 'owner' && role !== 'super_admin')) {
      return res.status(403).json({ error: 'Seul le propriétaire peut modifier le logo' });
    }

    if (!logo_base64) {
      return res.status(400).json({ error: 'Logo data is required' });
    }

    // Validate base64 format and size (max 500KB)
    const base64Data = logo_base64.replace(/^data:image\/\w+;base64,/, '');
    const sizeInBytes = Buffer.from(base64Data, 'base64').length;
    const maxSize = 500 * 1024; // 500KB

    if (sizeInBytes > maxSize) {
      return res.status(400).json({ error: 'Le logo ne doit pas dépasser 500KB' });
    }

    // Upload to Supabase Storage
    const fileExtension = logo_base64.match(/^data:image\/(\w+);base64,/)?.[1] || 'png';
    const fileName = `org-${id}-logo-${Date.now()}.${fileExtension}`;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, fileBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload logo error:', uploadError);
      // If bucket doesn't exist, store base64 directly as fallback
      const { data: organization, error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logo_base64, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to upload logo' });
      }

      return res.json({
        message: 'Logo uploaded successfully (stored as base64)',
        organization
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    const logoUrl = publicUrlData?.publicUrl || logo_base64;

    // Update organization with logo URL
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: logoUrl, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update organization logo error:', updateError);
      return res.status(500).json({ error: 'Failed to update organization logo' });
    }

    res.json({
      message: 'Logo uploaded successfully',
      organization
    });
  } catch (error) {
    console.error('Upload organization logo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete organization logo
export const deleteOrganizationLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user can manage organization (owner only for logo)
    const { access, role } = await checkOrganizationAccess(userId, id);
    if (!access || (role !== 'owner' && role !== 'super_admin')) {
      return res.status(403).json({ error: 'Seul le propriétaire peut supprimer le logo' });
    }

    // Update organization to remove logo
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({ logo_url: null, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Delete organization logo error:', error);
      return res.status(500).json({ error: 'Failed to delete logo' });
    }

    res.json({
      message: 'Logo deleted successfully',
      organization
    });
  } catch (error) {
    console.error('Delete organization logo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete organization (owner or super_admin only)
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is owner or super_admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: organization } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const isOwner = organization.owner_id === userId;
    const isSuperAdmin = currentUser?.role === 'super_admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Only organization owner or super admin can delete organizations' });
    }

    // Get all members to revert their account types if needed
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', id);

    // Delete organization (cascades to organization_members)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete organization error:', error);
      return res.status(500).json({ error: 'Failed to delete organization' });
    }

    // Revert owner's account type to individual
    if (members) {
      const owner = members.find(m => m.role === 'owner');
      if (owner) {
        await supabase
          .from('users')
          .update({ account_type: 'individual', organization_id: null })
          .eq('id', owner.user_id);
      }

      // Clear organization_id for other members
      for (const member of members) {
        if (member.role !== 'owner') {
          await supabase
            .from('users')
            .update({ organization_id: null })
            .eq('id', member.user_id);
        }
      }
    }

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Organization Members
// ============================================

// Get organization members
export const getOrganizationMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check access
    const { access } = await checkOrganizationAccess(userId, id);
    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        accepted_at,
        created_at,
        user:users!organization_members_user_id_fkey(id, email, role, created_at)
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get organization members error:', error);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }

    res.json({ members: members || [] });
  } catch (error) {
    console.error('Get organization members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add member to organization (by user ID - for existing users)
export const addOrganizationMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { user_id: newUserId, role = 'member' } = req.body;

    if (!newUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user exists
    const { data: newUser } = await supabase
      .from('users')
      .select('id, email, account_type')
      .eq('id', newUserId)
      .single();

    if (!newUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', id)
      .eq('user_id', newUserId)
      .single();

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Add member
    const { data: member, error } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: id,
        user_id: newUserId,
        role,
        invited_by: userId,
        accepted_at: new Date()
      }])
      .select(`
        id,
        role,
        accepted_at,
        user:users!organization_members_user_id_fkey(id, email)
      `)
      .single();

    if (error) {
      console.error('Add organization member error:', error);
      return res.status(500).json({ error: 'Failed to add member' });
    }

    // Update user's organization_id
    await supabase
      .from('users')
      .update({ organization_id: id })
      .eq('id', newUserId);

    res.status(201).json({
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Add organization member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Invite member by email
export const inviteToOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMembership) {
        return res.status(400).json({ error: 'User is already a member of this organization' });
      }
    }

    // Check for existing invitation
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .insert([{
        organization_id: id,
        email: email.toLowerCase(),
        role,
        invited_by: userId,
        token,
        expires_at: expiresAt
      }])
      .select()
      .single();

    if (error) {
      console.error('Create organization invitation error:', error);
      return res.status(500).json({ error: 'Failed to create invitation' });
    }

    // TODO: Send invitation email

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Invite to organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update member role
export const updateOrganizationMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.userId;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if member exists and is not owner
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('organization_id', id)
      .single();

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    // Update role
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error('Update organization member role error:', error);
      return res.status(500).json({ error: 'Failed to update member role' });
    }

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update organization member role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove member from organization
export const removeOrganizationMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.userId;

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if member exists and is not owner
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('organization_id', id)
      .single();

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove organization owner' });
    }

    // Remove member
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Remove organization member error:', error);
      return res.status(500).json({ error: 'Failed to remove member' });
    }

    // Clear user's organization_id
    await supabase
      .from('users')
      .update({ organization_id: null })
      .eq('id', member.user_id);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove organization member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending invitations for an organization
export const getOrganizationInvitations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: invitations, error } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        inviter:users!organization_invitations_invited_by_fkey(id, email)
      `)
      .eq('organization_id', id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get organization invitations error:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }

    res.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Get organization invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel invitation
export const cancelOrganizationInvitation = async (req, res) => {
  try {
    const { id, invitationId } = req.params;
    const userId = req.user.userId;

    // Check if user can manage organization
    const canManage = await canManageOrganization(userId, id);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('organization_id', id);

    if (error) {
      console.error('Cancel organization invitation error:', error);
      return res.status(500).json({ error: 'Failed to cancel invitation' });
    }

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel organization invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept invitation (called by invited user)
export const acceptOrganizationInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId;

    // Find invitation
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('*, organization:organizations(id, name)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    // Verify email matches
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ error: 'This invitation is for a different email address' });
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      // Delete invitation and return success
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitation.id);
      return res.json({ message: 'Already a member of this organization' });
    }

    // Add member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        accepted_at: new Date()
      }]);

    if (memberError) {
      console.error('Accept organization invitation error:', memberError);
      return res.status(500).json({ error: 'Failed to join organization' });
    }

    // Update user's organization_id
    await supabase
      .from('users')
      .update({ organization_id: invitation.organization_id })
      .eq('id', userId);

    // Delete invitation
    await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitation.id);

    res.json({
      message: 'Successfully joined organization',
      organization: invitation.organization
    });
  } catch (error) {
    console.error('Accept organization invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending invitations for current user (by their email)
export const getMyPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all pending invitations for this email
    const { data: invitations, error } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        role,
        expires_at,
        created_at,
        organization:organizations(id, name, slug)
      `)
      .eq('email', user.email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get my pending invitations error:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }

    res.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Get my pending invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept invitation by ID (for logged-in users)
export const acceptInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    // Get user's email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find invitation
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('*, organization:organizations(id, name)')
      .eq('id', invitationId)
      .eq('email', user.email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      // Delete invitation and return success
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitation.id);
      return res.json({ message: 'Already a member of this organization' });
    }

    // Add member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        accepted_at: new Date()
      }]);

    if (memberError) {
      console.error('Accept invitation error:', memberError);
      return res.status(500).json({ error: 'Failed to join organization' });
    }

    // Update user's organization_id
    await supabase
      .from('users')
      .update({ organization_id: invitation.organization_id })
      .eq('id', userId);

    // Delete invitation
    await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitation.id);

    res.json({
      message: 'Successfully joined organization',
      organization: invitation.organization
    });
  } catch (error) {
    console.error('Accept invitation by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Decline invitation by ID
export const declineInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    // Get user's email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the invitation (only if it belongs to this user's email)
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('email', user.email.toLowerCase());

    if (error) {
      console.error('Decline invitation error:', error);
      return res.status(500).json({ error: 'Failed to decline invitation' });
    }

    res.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
