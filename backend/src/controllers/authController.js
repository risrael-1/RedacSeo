import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

// Generate JWT token
const generateToken = (userId, email, role, accountType) => {
  return jwt.sign(
    { userId, email, role, accountType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate URL-friendly slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, accountType = 'individual', organizationName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate account type
    if (!['individual', 'organization'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }

    // Organization name required for organization accounts
    if (accountType === 'organization' && !organizationName) {
      return res.status(400).json({ error: 'Organization name is required for organization accounts' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { email, password: hashedPassword, role: 'user', account_type: accountType }
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    let organization = null;

    // If organization account, create the organization
    if (accountType === 'organization') {
      // Generate unique slug
      let slug = generateSlug(organizationName);
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
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: organizationName,
          slug,
          owner_id: newUser.id
        }])
        .select()
        .single();

      if (orgError) {
        // Rollback user creation
        await supabase.from('users').delete().eq('id', newUser.id);
        console.error('Create organization error:', orgError);
        return res.status(500).json({ error: 'Failed to create organization' });
      }

      organization = org;

      // Add owner to organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: org.id,
          user_id: newUser.id,
          role: 'owner',
          accepted_at: new Date()
        }]);

      if (memberError) {
        // Rollback
        await supabase.from('organizations').delete().eq('id', org.id);
        await supabase.from('users').delete().eq('id', newUser.id);
        console.error('Add owner to organization_members error:', memberError);
        return res.status(500).json({ error: 'Failed to create organization membership' });
      }
    }

    // Check for pending project invitations and add user to projects
    const { data: projectInvitations } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('email', email)
      .gt('expires_at', new Date().toISOString());

    if (projectInvitations && projectInvitations.length > 0) {
      for (const invitation of projectInvitations) {
        await supabase
          .from('project_members')
          .insert([{
            project_id: invitation.project_id,
            user_id: newUser.id,
            role: invitation.role,
            invited_by: invitation.invited_by,
            accepted_at: new Date()
          }]);
      }

      // Delete processed invitations
      await supabase
        .from('project_invitations')
        .delete()
        .eq('email', email);
    }

    // Check for pending organization invitations
    const { data: orgInvitations } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('email', email)
      .gt('expires_at', new Date().toISOString());

    if (orgInvitations && orgInvitations.length > 0) {
      for (const invitation of orgInvitations) {
        await supabase
          .from('organization_members')
          .insert([{
            organization_id: invitation.organization_id,
            user_id: newUser.id,
            role: invitation.role,
            invited_by: invitation.invited_by,
            accepted_at: new Date()
          }]);

        // Update user's organization_id
        await supabase
          .from('users')
          .update({ organization_id: invitation.organization_id })
          .eq('id', newUser.id);
      }

      // Delete processed invitations
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('email', email);
    }

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role || 'user', accountType);

    const response = {
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role || 'user',
        account_type: accountType
      }
    };

    if (organization) {
      response.organization = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        my_role: 'owner'
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accountType = user.account_type || 'individual';

    // Generate token
    const token = generateToken(user.id, user.email, user.role || 'user', accountType);

    const response = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        account_type: accountType
      }
    };

    // If organization account or member, include organization info
    if (accountType === 'organization' || user.organization_id) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations(id, name, slug)
        `)
        .eq('user_id', user.id)
        .single();

      if (membership?.organization) {
        response.organization = {
          ...membership.organization,
          my_role: membership.role
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password (simplified version)
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date() })
      .eq('email', email);

    if (error) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, account_type, organization_id, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountType = user.account_type || 'individual';
    const response = {
      user: {
        ...user,
        role: user.role || 'user',
        account_type: accountType
      }
    };

    // If organization account or member, include organization info
    if (accountType === 'organization' || user.organization_id) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations(id, name, slug)
        `)
        .eq('user_id', user.id)
        .single();

      if (membership?.organization) {
        response.organization = {
          ...membership.organization,
          my_role: membership.role
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password (authenticated user)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Get user with password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date() })
      .eq('id', req.user.userId);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
    }

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Change email (authenticated user)
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ error: 'Nouvel email et mot de passe requis' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Get current user with password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Check if new email is already taken
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail.toLowerCase())
      .neq('id', req.user.userId)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
    }

    // Update email
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ email: newEmail.toLowerCase(), updated_at: new Date() })
      .eq('id', req.user.userId)
      .select('id, email, role, created_at')
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'email' });
    }

    // Generate new token with updated email
    const newToken = generateToken(updatedUser.id, updatedUser.email, updatedUser.role || 'user');

    res.json({
      message: 'Email modifié avec succès',
      token: newToken,
      user: { ...updatedUser, role: updatedUser.role || 'user' }
    });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { displayName } = req.body;

    const updateData = { updated_at: new Date() };
    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.userId)
      .select('id, email, role, display_name, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }

    res.json({
      message: 'Profil mis à jour avec succès',
      user: { ...user, role: user.role || 'user' }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis pour confirmer la suppression' });
    }

    // Get user with password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Delete user's articles
    await supabase
      .from('articles')
      .delete()
      .eq('user_id', req.user.userId);

    // Delete user's project memberships
    await supabase
      .from('project_members')
      .delete()
      .eq('user_id', req.user.userId);

    // Delete projects owned by user (and their members)
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', req.user.userId);

    if (ownedProjects && ownedProjects.length > 0) {
      const projectIds = ownedProjects.map(p => p.id);

      // Delete members of owned projects
      await supabase
        .from('project_members')
        .delete()
        .in('project_id', projectIds);

      // Delete articles in owned projects
      await supabase
        .from('articles')
        .delete()
        .in('project_id', projectIds);

      // Delete owned projects
      await supabase
        .from('projects')
        .delete()
        .eq('owner_id', req.user.userId);
    }

    // Finally, delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.userId);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};
