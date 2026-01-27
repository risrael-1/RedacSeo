import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Organization.css';

const Organization = () => {
  const { user, organization, isOrgOwner, isOrgAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();
  const logoInputRef = useRef(null);

  // Organization info state
  const [orgData, setOrgData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Logo state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');

  // Members state
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Invitations state
  const [invitations, setInvitations] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load organization data
        const orgResponse = await organizationsAPI.getOne(organization.id);
        setOrgData(orgResponse.organization);
        setEditName(orgResponse.organization.name);
        setEditDescription(orgResponse.organization.description || '');

        // Load members
        setLoadingMembers(true);
        const membersResponse = await organizationsAPI.getMembers(organization.id);
        setMembers(membersResponse.members || []);

        // Load invitations if admin/owner
        if (isOrgAdmin()) {
          const invitationsResponse = await organizationsAPI.getInvitations(organization.id);
          setInvitations(invitationsResponse.invitations || []);
        }
      } catch (error) {
        console.error('Error loading organization data:', error);
      } finally {
        setLoading(false);
        setLoadingMembers(false);
      }
    };

    loadData();
  }, [organization?.id]);

  const handleSaveOrganization = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!editName.trim()) {
      setSaveError('Le nom de l\'organisation est requis');
      return;
    }

    setIsSaving(true);
    try {
      const response = await organizationsAPI.update(organization.id, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      setOrgData(response.organization);
      setSaveSuccess('Organisation mise à jour avec succès');
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      setSaveError(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      setLogoError('Le logo ne doit pas dépasser 500KB');
      return;
    }

    setLogoError('');
    setIsUploadingLogo(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result;
          const response = await organizationsAPI.uploadLogo(organization.id, base64);
          setOrgData(response.organization);
          setSaveSuccess('Logo mis à jour avec succès');
          await refreshUser();
        } catch (error) {
          setLogoError(error.message || 'Erreur lors de l\'upload du logo');
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.onerror = () => {
        setLogoError('Erreur lors de la lecture du fichier');
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLogoError(error.message || 'Erreur lors de l\'upload');
      setIsUploadingLogo(false);
    }

    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer le logo ?')) {
      return;
    }

    setLogoError('');
    setIsUploadingLogo(true);

    try {
      const response = await organizationsAPI.deleteLogo(organization.id);
      setOrgData(response.organization);
      setSaveSuccess('Logo supprimé avec succès');
      await refreshUser();
    } catch (error) {
      setLogoError(error.message || 'Erreur lors de la suppression du logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteEmail.trim()) {
      setInviteError('L\'email est requis');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Format d\'email invalide');
      return;
    }

    setIsInviting(true);
    try {
      await organizationsAPI.inviteMember(organization.id, inviteEmail.trim(), inviteRole);
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');

      // Reload invitations
      const invitationsResponse = await organizationsAPI.getInvitations(organization.id);
      setInvitations(invitationsResponse.invitations || []);
    } catch (error) {
      setInviteError(error.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await organizationsAPI.updateMemberRole(organization.id, memberId, newRole);
      // Reload members
      const membersResponse = await organizationsAPI.getMembers(organization.id);
      setMembers(membersResponse.members || []);
    } catch (error) {
      console.error('Error updating member role:', error);
      alert(error.message || 'Erreur lors de la mise à jour du rôle');
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberEmail} de l'organisation ?`)) {
      return;
    }

    try {
      await organizationsAPI.removeMember(organization.id, memberId);
      // Reload members
      const membersResponse = await organizationsAPI.getMembers(organization.id);
      setMembers(membersResponse.members || []);
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.message || 'Erreur lors de la suppression du membre');
    }
  };

  const handleCancelInvitation = async (invitationId, email) => {
    if (!confirm(`Annuler l'invitation envoyée à ${email} ?`)) {
      return;
    }

    try {
      await organizationsAPI.cancelInvitation(organization.id, invitationId);
      // Reload invitations
      const invitationsResponse = await organizationsAPI.getInvitations(organization.id);
      setInvitations(invitationsResponse.invitations || []);
    } catch (error) {
      console.error('Error canceling invitation:', error);
      alert(error.message || 'Erreur lors de l\'annulation de l\'invitation');
    }
  };

  const getRoleBadge = (role) => {
    const roleLabels = {
      owner: 'Propriétaire',
      admin: 'Admin',
      member: 'Membre'
    };
    const roleClasses = {
      owner: 'role-owner',
      admin: 'role-admin',
      member: 'role-member'
    };
    return (
      <span className={`member-role-badge ${roleClasses[role] || ''}`}>
        {roleLabels[role] || role}
      </span>
    );
  };

  // Redirect if not part of any organization
  if (!loading && !organization) {
    return (
      <div className="organization-container">
        <Navbar />
        <main className="organization-main">
          <div className="organization-header">
            <h1>Organisation</h1>
          </div>
          <div className="no-organization">
            <div className="no-org-icon">🏢</div>
            <h2>Compte Individuel</h2>
            <p>Vous avez actuellement un compte individuel.</p>
            <p>Pour créer une organisation et inviter des membres, vous pouvez convertir votre compte.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/profile')}
            >
              Voir mon profil
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="organization-container">
        <Navbar />
        <main className="organization-main">
          <div className="loading-state">Chargement...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="organization-container">
      <Navbar />
      <main className="organization-main">
        <div className="organization-header">
          <h1>Mon Organisation</h1>
          <p>Gérez les paramètres et les membres de votre organisation</p>
        </div>

        <div className="organization-grid">
          {/* Organization Info Card */}
          <div className="org-card">
            <div className="org-card-header">
              <h2>Informations</h2>
              {isOrgAdmin() && !isEditing && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveOrganization} className="org-form">
                {saveError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="orgName">Nom de l'organisation</label>
                  <input
                    type="text"
                    id="orgName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-input"
                    placeholder="Nom de l'organisation"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orgDescription">Description (optionnel)</label>
                  <textarea
                    id="orgDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="form-input"
                    placeholder="Description de l'organisation"
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(orgData?.name || '');
                      setEditDescription(orgData?.description || '');
                      setSaveError('');
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="org-info">
                {saveSuccess && (
                  <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{saveSuccess}</span>
                  </div>
                )}
                {logoError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{logoError}</span>
                  </div>
                )}

                {/* Logo Section */}
                <div className="org-logo-section">
                  <span className="org-info-label">Logo</span>
                  <div className="org-logo-container">
                    {orgData?.logo_url ? (
                      <img
                        src={orgData.logo_url}
                        alt={`Logo ${orgData.name}`}
                        className="org-logo-preview"
                      />
                    ) : (
                      <div className="org-logo-placeholder">
                        <span>{orgData?.name?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    {isOrgOwner() && (
                      <div className="org-logo-actions">
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="logo-upload"
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? 'Envoi...' : (orgData?.logo_url ? 'Changer' : 'Ajouter')}
                        </button>
                        {orgData?.logo_url && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={handleDeleteLogo}
                            disabled={isUploadingLogo}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="org-logo-hint">Format: JPG, PNG, GIF. Max 500KB</span>
                </div>

                <div className="org-info-item">
                  <span className="org-info-label">Nom</span>
                  <span className="org-info-value">{orgData?.name}</span>
                </div>
                <div className="org-info-item">
                  <span className="org-info-label">Identifiant (slug)</span>
                  <span className="org-info-value org-slug">{orgData?.slug}</span>
                </div>
                {orgData?.description && (
                  <div className="org-info-item">
                    <span className="org-info-label">Description</span>
                    <span className="org-info-value">{orgData?.description}</span>
                  </div>
                )}
                <div className="org-info-item">
                  <span className="org-info-label">Membres</span>
                  <span className="org-info-value">{orgData?.member_count || 0}</span>
                </div>
                <div className="org-info-item">
                  <span className="org-info-label">Projets</span>
                  <span className="org-info-value">{orgData?.project_count || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Invite Member Card */}
          {isOrgAdmin() && (
            <div className="org-card">
              <h2>Inviter un membre</h2>
              <form onSubmit={handleInviteMember} className="org-form">
                {inviteError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{inviteError}</span>
                  </div>
                )}
                {inviteSuccess && (
                  <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{inviteSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="inviteEmail">Email</label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-input"
                    placeholder="email@exemple.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inviteRole">Rôle</label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isInviting}
                >
                  {isInviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                </button>
              </form>
            </div>
          )}

          {/* Members List Card */}
          <div className="org-card org-card-full">
            <h2>Membres ({members.length})</h2>
            {loadingMembers ? (
              <div className="loading-state">Chargement des membres...</div>
            ) : members.length === 0 ? (
              <div className="empty-state">Aucun membre dans l'organisation</div>
            ) : (
              <div className="members-list">
                {members.map((member) => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <span className="member-email">{member.user?.email}</span>
                        {getRoleBadge(member.role)}
                      </div>
                    </div>
                    <div className="member-actions">
                      {isOrgAdmin() && member.role !== 'owner' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="member">Membre</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.id, member.user?.email)}
                          >
                            Retirer
                          </button>
                        </>
                      )}
                      {member.role === 'owner' && (
                        <span className="owner-badge">Propriétaire</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations Card */}
          {isOrgAdmin() && invitations.length > 0 && (
            <div className="org-card org-card-full">
              <h2>Invitations en attente ({invitations.length})</h2>
              <div className="invitations-list">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="invitation-item">
                    <div className="invitation-info">
                      <span className="invitation-email">{invitation.email}</span>
                      {getRoleBadge(invitation.role)}
                      <span className="invitation-expires">
                        Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                    >
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Organization;
