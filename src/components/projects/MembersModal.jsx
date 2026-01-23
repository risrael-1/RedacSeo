const MembersModal = ({
  isOpen,
  project,
  members,
  loading,
  onClose,
  inviteEmail,
  onInviteEmailChange,
  inviteRole,
  onInviteRoleChange,
  onInvite,
  inviteError,
  inviteSuccess,
  onChangeMemberRole,
  onRemoveMember
}) => {
  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Membres de "{project.name}"</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Formulaire d'invitation */}
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
