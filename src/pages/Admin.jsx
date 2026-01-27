import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, organizationsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('stats');

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');

  // Stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // General state
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadUsers(),
      loadOrganizations(),
      loadStats()
    ]);
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersAPI.getAll();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadOrganizations = async () => {
    if (!isSuperAdmin()) {
      setLoadingOrgs(false);
      return;
    }
    try {
      setLoadingOrgs(true);
      const response = await organizationsAPI.getAll();
      setOrganizations(response.organizations || []);
    } catch (err) {
      console.error('Error loading organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadStats = async () => {
    if (!isSuperAdmin()) {
      setLoadingStats(false);
      return;
    }
    try {
      setLoadingStats(true);
      const response = await usersAPI.getAdminStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!selectedUser) return;

    try {
      await usersAPI.updateRole(selectedUser.id, newRole);
      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      alert('Erreur lors de la modification du rôle: ' + err.message);
    }
  };

  const openRoleModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setShowRoleModal(true);
  };

  const openDeleteModal = (userToDel) => {
    setUserToDelete(userToDel);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await usersAPI.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      alert('Erreur lors de la suppression: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_admin': return 'role-badge super-admin';
      case 'admin': return 'role-badge admin';
      default: return 'role-badge user';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      default: return 'Utilisateur';
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o =>
    o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
    o.slug.toLowerCase().includes(orgSearchQuery.toLowerCase())
  );

  // Render Stats Tab
  const renderStatsTab = () => {
    if (loadingStats) {
      return <div className="loading">Chargement des statistiques...</div>;
    }

    if (!stats) {
      return <div className="admin-error">Impossible de charger les statistiques</div>;
    }

    return (
      <div className="stats-container">
        {/* Main Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon users-icon">👥</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.totals.users}</div>
              <div className="admin-stat-label">Utilisateurs</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon orgs-icon">🏢</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.totals.organizations}</div>
              <div className="admin-stat-label">Organisations</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon projects-icon">📁</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.totals.projects}</div>
              <div className="admin-stat-label">Projets</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon articles-icon">📝</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stats.totals.articles}</div>
              <div className="admin-stat-label">Articles</div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="stats-details-grid">
          {/* Users by Role */}
          <div className="stats-card">
            <h3>Utilisateurs par rôle</h3>
            <div className="stats-bars">
              <div className="stat-bar-item">
                <div className="stat-bar-label">
                  <span>Super Admins</span>
                  <span>{stats.usersByRole.super_admin}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill super-admin"
                    style={{ width: `${(stats.usersByRole.super_admin / stats.totals.users * 100) || 0}%` }}
                  />
                </div>
              </div>
              <div className="stat-bar-item">
                <div className="stat-bar-label">
                  <span>Admins</span>
                  <span>{stats.usersByRole.admin}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill admin"
                    style={{ width: `${(stats.usersByRole.admin / stats.totals.users * 100) || 0}%` }}
                  />
                </div>
              </div>
              <div className="stat-bar-item">
                <div className="stat-bar-label">
                  <span>Utilisateurs</span>
                  <span>{stats.usersByRole.user}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill user"
                    style={{ width: `${(stats.usersByRole.user / stats.totals.users * 100) || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Users by Account Type */}
          <div className="stats-card">
            <h3>Type de compte</h3>
            <div className="stats-bars">
              <div className="stat-bar-item">
                <div className="stat-bar-label">
                  <span>Comptes individuels</span>
                  <span>{stats.usersByAccountType.individual}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill individual"
                    style={{ width: `${(stats.usersByAccountType.individual / stats.totals.users * 100) || 0}%` }}
                  />
                </div>
              </div>
              <div className="stat-bar-item">
                <div className="stat-bar-label">
                  <span>Comptes organisation</span>
                  <span>{stats.usersByAccountType.organization}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill organization"
                    style={{ width: `${(stats.usersByAccountType.organization / stats.totals.users * 100) || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="stats-card">
            <h3>Activité des 30 derniers jours</h3>
            <div className="recent-stats">
              <div className="recent-stat-item">
                <span className="recent-stat-value">{stats.recent30Days.newUsers}</span>
                <span className="recent-stat-label">Nouveaux utilisateurs</span>
              </div>
              <div className="recent-stat-item">
                <span className="recent-stat-value">{stats.recent30Days.newArticles}</span>
                <span className="recent-stat-label">Articles créés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Organizations Tab
  const renderOrganizationsTab = () => {
    if (!isSuperAdmin()) {
      return (
        <div className="admin-error">
          Seuls les Super Admins peuvent voir les organisations.
        </div>
      );
    }

    if (loadingOrgs) {
      return <div className="loading">Chargement des organisations...</div>;
    }

    return (
      <div className="orgs-container">
        <div className="orgs-header">
          <div className="orgs-count">
            {organizations.length} organisation(s)
          </div>
          <div className="admin-search">
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={orgSearchQuery}
              onChange={(e) => setOrgSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            {orgSearchQuery && (
              <button
                className="admin-search-clear"
                onClick={() => setOrgSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <div className="no-orgs">
            {orgSearchQuery
              ? `Aucune organisation trouvée pour "${orgSearchQuery}"`
              : 'Aucune organisation'}
          </div>
        ) : (
          <div className="orgs-grid">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="org-admin-card">
                <div className="org-admin-card-header">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="org-admin-card-logo" />
                  ) : (
                    <div className="org-admin-card-logo-placeholder">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="org-admin-card-info">
                    <h3>{org.name}</h3>
                    <span className="org-admin-card-slug">@{org.slug}</span>
                  </div>
                </div>
                <div className="org-admin-card-stats">
                  <div className="org-admin-stat">
                    <span className="org-admin-stat-value">{org.member_count || 0}</span>
                    <span className="org-admin-stat-label">Membres</span>
                  </div>
                  <div className="org-admin-stat">
                    <span className="org-admin-stat-value">{org.project_count || 0}</span>
                    <span className="org-admin-stat-label">Projets</span>
                  </div>
                </div>
                <div className="org-admin-card-footer">
                  <span className="org-admin-card-owner">
                    Propriétaire: {org.owner?.email || 'N/A'}
                  </span>
                  <span className="org-admin-card-date">
                    Créée le {new Date(org.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Users Tab
  const renderUsersTab = () => {
    if (loadingUsers) {
      return <div className="loading">Chargement des utilisateurs...</div>;
    }

    return (
      <div className="users-container">
        <div className="users-header">
          <div className="users-count">
            {users.length} utilisateur(s)
          </div>
          <div className="admin-search">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            {searchQuery && (
              <button
                className="admin-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Compte</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className={u.id === user?.id ? 'current-user' : ''}>
                  <td className="user-email">
                    {u.email}
                    {u.id === user?.id && <span className="you-badge">Vous</span>}
                  </td>
                  <td>
                    <span className={getRoleBadgeClass(u.role)}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`account-type-tag ${u.account_type === 'organization' ? 'account-org' : 'account-individual'}`}>
                      {u.account_type === 'organization' ? 'Organisation' : 'Individuel'}
                    </span>
                  </td>
                  <td className="user-date">
                    {new Date(u.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="admin-user-actions">
                    {u.id !== user?.id && (
                      <>
                        <button
                          className="btn-edit-role"
                          onClick={() => openRoleModal(u)}
                          disabled={u.role === 'super_admin' && !isSuperAdmin()}
                        >
                          Modifier le rôle
                        </button>
                        {isSuperAdmin() && (
                          <button
                            className="btn-delete-user"
                            onClick={() => openDeleteModal(u)}
                          >
                            Supprimer
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-users">
              {searchQuery
                ? `Aucun utilisateur trouvé pour "${searchQuery}"`
                : 'Aucun utilisateur'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title">
            <h1>Administration</h1>
            <span className="admin-subtitle">
              {isSuperAdmin() ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* Tabs */}
        <div className="admin-tabs">
          {isSuperAdmin() && (
            <button
              className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <span className="tab-icon">📊</span>
              Statistiques
            </button>
          )}
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="tab-icon">👥</span>
            Utilisateurs
          </button>
          {isSuperAdmin() && (
            <button
              className={`admin-tab ${activeTab === 'organizations' ? 'active' : ''}`}
              onClick={() => setActiveTab('organizations')}
            >
              <span className="tab-icon">🏢</span>
              Organisations
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="admin-tab-content">
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'organizations' && renderOrganizationsTab()}
        </div>

        {/* Role Modal */}
        {showRoleModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
            <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Modifier le rôle</h2>
                <button className="modal-close" onClick={() => setShowRoleModal(false)}>
                  ×
                </button>
              </div>
              <div className="role-modal-body">
                <p className="role-modal-user">
                  Utilisateur: <strong>{selectedUser.email}</strong>
                </p>
                <p className="role-modal-current">
                  Rôle actuel: <span className={getRoleBadgeClass(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </p>
                <div className="role-options">
                  <button
                    className={`role-option ${selectedUser.role === 'user' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('user')}
                  >
                    <span className="role-option-icon">👤</span>
                    <span className="role-option-name">Utilisateur</span>
                    <span className="role-option-desc">Accès basique, peut voir ses projets</span>
                  </button>
                  <button
                    className={`role-option ${selectedUser.role === 'admin' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('admin')}
                  >
                    <span className="role-option-icon">👑</span>
                    <span className="role-option-name">Admin</span>
                    <span className="role-option-desc">Gère ses projets et peut inviter des utilisateurs</span>
                  </button>
                  {isSuperAdmin() && (
                    <button
                      className={`role-option super ${selectedUser.role === 'super_admin' ? 'active' : ''}`}
                      onClick={() => handleRoleChange('super_admin')}
                    >
                      <span className="role-option-icon">⭐</span>
                      <span className="role-option-name">Super Admin</span>
                      <span className="role-option-desc">Accès total à tous les projets et utilisateurs</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && userToDelete && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Supprimer l'utilisateur</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  ×
                </button>
              </div>
              <div className="delete-modal-body">
                <div className="delete-warning">
                  <span className="delete-warning-icon">⚠️</span>
                  <p>
                    Vous êtes sur le point de supprimer définitivement l'utilisateur
                    <strong> {userToDelete.email}</strong>.
                  </p>
                </div>
                <p className="delete-details">
                  Cette action est irréversible et entraînera la suppression de :
                </p>
                <ul className="delete-consequences">
                  <li>Tous ses articles</li>
                  <li>Ses projets et leurs contenus</li>
                  <li>Ses appartenances aux projets et organisations</li>
                  <li>Son organisation (s'il en est propriétaire)</li>
                </ul>
                <div className="admin-delete-actions">
                  <button
                    className="admin-btn-cancel"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Annuler
                  </button>
                  <button
                    className="admin-btn-confirm-delete"
                    onClick={handleDeleteUser}
                    disabled={deleting}
                  >
                    {deleting ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
