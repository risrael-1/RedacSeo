import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.users || []);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="admin-container">
          <div className="loading">Chargement des utilisateurs...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title">
            <h1>Gestion des Utilisateurs</h1>
            <span className="admin-subtitle">
              {isSuperAdmin() ? 'Super Admin' : 'Admin'} - {users.length} utilisateur(s)
            </span>
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

        {error && <div className="admin-error">{error}</div>}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
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
                  <td className="user-date">
                    {new Date(u.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="user-actions">
                    {u.id !== user?.id && (
                      <button
                        className="btn-edit-role"
                        onClick={() => openRoleModal(u)}
                        disabled={u.role === 'super_admin' && !isSuperAdmin()}
                      >
                        Modifier le rôle
                      </button>
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
      </div>
    </div>
  );
};

export default Admin;
