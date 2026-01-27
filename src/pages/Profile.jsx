import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { organizationsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const { user, organization, changePassword, changeEmail, deleteAccount, isOrganization, isIndividual, refreshUser } = useAuth();

  // Upgrade to organization state
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (result.success) {
      setPasswordSuccess('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    // Validation
    if (!newEmail || !emailPassword) {
      setEmailError('Tous les champs sont obligatoires');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Format d\'email invalide');
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('Le nouvel email doit être différent de l\'actuel');
      return;
    }

    setIsChangingEmail(true);
    const result = await changeEmail(newEmail, emailPassword);
    setIsChangingEmail(false);

    if (result.success) {
      setEmailSuccess('Email modifié avec succès');
      setNewEmail('');
      setEmailPassword('');
    } else {
      setEmailError(result.message || 'Erreur lors du changement d\'email');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Veuillez entrer votre mot de passe pour confirmer');
      return;
    }

    setIsDeleting(true);
    const result = await deleteAccount(deletePassword);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.message || 'Erreur lors de la suppression du compte');
    }
    // Si succès, l'utilisateur sera déconnecté automatiquement
  };

  const handleUpgradeToOrganization = async (e) => {
    e.preventDefault();
    setUpgradeError('');
    setUpgradeSuccess('');

    if (!orgName.trim()) {
      setUpgradeError('Le nom de l\'organisation est obligatoire');
      return;
    }

    setIsUpgrading(true);
    try {
      await organizationsAPI.create({ name: orgName.trim(), description: orgDescription.trim() });
      setUpgradeSuccess('Votre compte a été converti en organisation avec succès !');
      setShowUpgradeForm(false);
      setOrgName('');
      setOrgDescription('');
      await refreshUser();
    } catch (error) {
      setUpgradeError(error.message || 'Erreur lors de la conversion du compte');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getRoleBadge = () => {
    if (!user?.role || user.role === 'user') return null;

    const roleLabels = {
      admin: 'Administrateur',
      super_admin: 'Super Administrateur'
    };

    return (
      <span className={`profile-role-badge ${user.role === 'super_admin' ? 'super' : ''}`}>
        {roleLabels[user.role] || user.role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="profile-container">
      <Navbar />
      <main className="profile-main">
        <div className="profile-header">
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles et la sécurité de votre compte</p>
        </div>

        <div className="profile-grid">
          {/* Informations du compte */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{user?.email}</h2>
                {getRoleBadge()}
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Membre depuis</span>
                <span className="detail-value">{formatDate(user?.created_at)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Dernière connexion</span>
                <span className="detail-value">{formatDate(user?.last_login)}</span>
              </div>
            </div>
          </div>

          {/* Type de compte */}
          <div className="profile-card account-type-card">
            <h3>Type de compte</h3>
            {isOrganization() ? (
              /* Cas 1 : Propriétaire d'une organisation (account_type = 'organization') */
              <div className="account-type-info">
                <div className="account-type-badge org-badge">
                  <span className="account-type-icon">🏢</span>
                  <span>Compte Organisation</span>
                </div>
                {organization && (
                  <div className="account-type-details">
                    <div className="profile-detail-item">
                      <span className="detail-label">Organisation</span>
                      <span className="detail-value">{organization.name}</span>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">Votre rôle</span>
                      <span className="detail-value">
                        {organization.my_role === 'owner' ? 'Propriétaire' :
                         organization.my_role === 'admin' ? 'Administrateur' : 'Membre'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : organization ? (
              /* Cas 2 : Individuel invité dans une organisation */
              <div className="account-type-info">
                <div className="account-type-badge individual-badge">
                  <span className="account-type-icon">👤</span>
                  <span>Compte Individuel</span>
                </div>
                <div className="org-membership-info">
                  <div className="profile-detail-item">
                    <span className="detail-label">Membre de l'organisation</span>
                    <span className="detail-value">{organization.name}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">Votre rôle</span>
                    <span className="detail-value">
                      {organization.my_role === 'admin' ? 'Administrateur' : 'Membre'}
                    </span>
                  </div>
                </div>
                <p className="org-membership-note">
                  Vous avez été invité dans cette organisation. Votre compte reste individuel.
                </p>
              </div>
            ) : (
              /* Cas 3 : Individuel pur, peut upgrader */
              <div className="account-type-info">
                <div className="account-type-badge individual-badge">
                  <span className="account-type-icon">👤</span>
                  <span>Compte Individuel</span>
                </div>

                {upgradeSuccess && (
                  <div className="alert alert-success">
                    <span className="alert-icon">✓</span>
                    <span>{upgradeSuccess}</span>
                  </div>
                )}

                <div className="org-advantages">
                  <h4>Avantages du compte Organisation</h4>
                  <ul className="advantages-list">
                    <li>Invitez des membres dans votre organisation</li>
                    <li>Gérez les rôles et permissions de vos collaborateurs</li>
                    <li>Partagez des projets au sein de votre équipe</li>
                    <li>Assignez directement des membres à vos projets</li>
                    <li>Page de gestion d'organisation dédiée</li>
                  </ul>
                </div>

                {!showUpgradeForm ? (
                  <button
                    className="btn btn-upgrade"
                    onClick={() => setShowUpgradeForm(true)}
                  >
                    Passer en compte Organisation
                  </button>
                ) : (
                  <form onSubmit={handleUpgradeToOrganization} className="upgrade-form">
                    {upgradeError && (
                      <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{upgradeError}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="orgName">Nom de l'organisation *</label>
                      <input
                        type="text"
                        id="orgName"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="form-input"
                        placeholder="Nom de votre organisation"
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="orgDescription">Description (optionnel)</label>
                      <input
                        type="text"
                        id="orgDescription"
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                        className="form-input"
                        placeholder="Brève description de votre organisation"
                      />
                    </div>

                    <div className="upgrade-form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowUpgradeForm(false);
                          setOrgName('');
                          setOrgDescription('');
                          setUpgradeError('');
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-upgrade"
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? 'Conversion...' : 'Confirmer la conversion'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Changer le mot de passe */}
          <div className="profile-card">
            <h3>Changer le mot de passe</h3>
            <form onSubmit={handleChangePassword} className="profile-form">
              {passwordError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="alert alert-success">
                  <span className="alert-icon">✓</span>
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Au moins 6 caractères"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Répétez le nouveau mot de passe"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </form>
          </div>

          {/* Changer l'email */}
          <div className="profile-card">
            <h3>Changer l'adresse email</h3>
            <p className="form-hint">
              La vérification par email sera disponible prochainement.
            </p>
            <form onSubmit={handleChangeEmail} className="profile-form">
              {emailError && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{emailError}</span>
                </div>
              )}
              {emailSuccess && (
                <div className="alert alert-success">
                  <span className="alert-icon">✓</span>
                  <span>{emailSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="currentEmail">Email actuel</label>
                <input
                  type="email"
                  id="currentEmail"
                  value={user?.email || ''}
                  className="form-input"
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="newEmail">Nouvel email</label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  placeholder="Entrez votre nouvel email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emailPassword">Mot de passe (pour confirmer)</label>
                <input
                  type="password"
                  id="emailPassword"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="form-input"
                  placeholder="Entrez votre mot de passe"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChangingEmail}
              >
                {isChangingEmail ? 'Modification...' : 'Modifier l\'email'}
              </button>
            </form>
          </div>

          {/* Zone dangereuse */}
          <div className="profile-card danger-zone">
            <h3>Zone dangereuse</h3>
            <p className="danger-warning">
              Attention : La suppression de votre compte est irréversible.
              Toutes vos données, articles et projets seront définitivement supprimés.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-danger-solid"
              >
                Supprimer mon compte
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="delete-form">
                {deleteError && (
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠️</span>
                    <span>{deleteError}</span>
                  </div>
                )}

                <p className="delete-confirm-text">
                  Pour confirmer la suppression, entrez votre mot de passe :
                </p>

                <div className="form-group">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="form-input"
                    placeholder="Votre mot de passe"
                    autoFocus
                  />
                </div>

                <div className="delete-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger-solid"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
