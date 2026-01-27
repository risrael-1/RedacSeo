import { useState } from 'react';

const MembersModal = ({
  isOpen,
  project,
  members,
  loading,
  onClose,
  // Pour invitation par email (projets non-org)
  inviteEmail,
  onInviteEmailChange,
  inviteRole,
  onInviteRoleChange,
  onInvite,
  inviteError,
  inviteSuccess,
  // Pour affectation org members
  isOrgProject,
  orgMembers,
  loadingOrgMembers,
  onAssignOrgMember,
  // Actions sur membres
  onChangeMemberRole,
  onRemoveMember
}) => {
  const [selectedOrgMember, setSelectedOrgMember] = useState('');
  const [assignRole, setAssignRole] = useState('member');

  if (!isOpen || !project) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedOrgMember) return;

    await onAssignOrgMember(selectedOrgMember, assignRole);
    setSelectedOrgMember('');
    setAssignRole('member');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Membres de "{project.name}"</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Formulaire d'ajout de membre */}
        {isOrgProject ? (
          // Mode Organisation: Affectation directe des membres de l'organisation
          <form onSubmit={handleAssign} className="invite-form">
            <h3>Affecter un membre de l'organisation</h3>
            {loadingOrgMembers ? (
              <div className="members-loading">Chargement des membres...</div>
            ) : orgMembers && orgMembers.length > 0 ? (
              <div className="invite-form-row">
                <select
                  value={selectedOrgMember}
                  onChange={(e) => setSelectedOrgMember(e.target.value)}
                  className="invite-email-input"
                >
                  <option value="">-- Sélectionner un membre --</option>
                  {orgMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.email} ({member.org_role === 'owner' ? 'Propriétaire' : member.org_role === 'admin' ? 'Admin' : 'Membre'})
                    </option>
                  ))}
                </select>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="invite-role-select"
                >
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn-invite" disabled={!selectedOrgMember}>
                  Affecter
                </button>
              </div>
            ) : (
              <div className="members-empty">
                Tous les membres de l'organisation sont déjà affectés à ce projet.
              </div>
            )}
            {inviteError && <div className="invite-error">{inviteError}</div>}
            {inviteSuccess && <div className="invite-success">{inviteSuccess}</div>}
          </form>
        ) : (
          // Mode classique: Invitation par email
          <form onSubmit={onInvite} className="invite-form">
            <h3>Inviter un utilisateur</h3>
            <div className="invite-form-row">
              <input
                type="email"
                placeholder="Email de l'utilisateur"
                value={inviteEmail}
                onChange={(e) => onInviteEmailChange(e.target.value)}
                className="invite-email-input"
              />
              <select
                value={inviteRole}
                onChange={(e) => onInviteRoleChange(e.target.value)}
                className="invite-role-select"
              >
                <option value="member">Membre</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn-invite">
                Inviter
              </button>
            </div>
            {inviteError && <div className="invite-error">{inviteError}</div>}
            {inviteSuccess && <div className="invite-success">{inviteSuccess}</div>}
          </form>
        )}

        {/* Liste des membres */}
        <div className="members-list">
          <h3>Membres actuels</h3>
          {loading ? (
            <div className="members-loading">Chargement...</div>
          ) : members.length === 0 ? (
            <div className="members-empty">Aucun membre</div>
          ) : (
            <div className="members-table">
              {members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-info">
                    <span className="member-email">{member.email}</span>
                    <span className={`member-role-badge ${member.role}`}>
                      {member.role === 'owner' ? 'Propriétaire' : member.role === 'admin' ? 'Admin' : 'Membre'}
                    </span>
                  </div>
                  {member.role !== 'owner' && (
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => onChangeMemberRole(member.id, e.target.value)}
                        className="member-role-select"
                      >
                        <option value="member">Membre</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn-remove-member"
                        onClick={() => onRemoveMember(member.id, member.email)}
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
