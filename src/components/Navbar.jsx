import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import { UnsavedChangesPopup } from './common';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isOrganization, organization, isOrgAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnsavedChanges, requestNavigation } = useUnsavedChanges();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      const confirmed = requestNavigation(() => {
        logout();
        navigate('/');
      });
      if (confirmed) {
        logout();
        navigate('/');
      }
    } else {
      logout();
      navigate('/');
    }
  };

  const handleNavigation = (e, path) => {
    // Si on est déjà sur cette page, ne rien faire
    if (location.pathname === path) return;

    // Vérifier s'il y a des modifications non sauvegardées
    if (hasUnsavedChanges) {
      e.preventDefault();
      requestNavigation(() => navigate(path));
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <h1 className="navbar-logo">RedacSEO</h1>
            <div className="navbar-links">
              <a
                href="/dashboard"
                onClick={(e) => { e.preventDefault(); handleNavigation(e, '/dashboard'); if (!hasUnsavedChanges) navigate('/dashboard'); }}
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Tableau de bord
              </a>
              <a
                href="/projects"
                onClick={(e) => { e.preventDefault(); handleNavigation(e, '/projects'); if (!hasUnsavedChanges) navigate('/projects'); }}
                className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
              >
                Projets
              </a>
              <a
                href="/redaction"
                onClick={(e) => { e.preventDefault(); handleNavigation(e, '/redaction'); if (!hasUnsavedChanges) navigate('/redaction'); }}
                className={`nav-link ${isActive('/redaction') ? 'active' : ''}`}
              >
                Rédaction
              </a>
              <a
                href="/regles"
                onClick={(e) => { e.preventDefault(); handleNavigation(e, '/regles'); if (!hasUnsavedChanges) navigate('/regles'); }}
                className={`nav-link ${isActive('/regles') ? 'active' : ''}`}
              >
                Règles SEO
              </a>
              {isAdmin() && (
                <a
                  href="/admin"
                  onClick={(e) => { e.preventDefault(); handleNavigation(e, '/admin'); if (!hasUnsavedChanges) navigate('/admin'); }}
                  className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  Admin
                </a>
              )}
              {(isOrganization() || isOrgAdmin()) && (
                <a
                  href="/organization"
                  onClick={(e) => { e.preventDefault(); handleNavigation(e, '/organization'); if (!hasUnsavedChanges) navigate('/organization'); }}
                  className={`nav-link org-link ${isActive('/organization') ? 'active' : ''}`}
                >
                  Organisation
                </a>
              )}
            </div>
          </div>
          <div className="navbar-right" ref={menuRef}>
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</span>
              <span className="user-menu-arrow">{showUserMenu ? '▲' : '▼'}</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                  <div className="user-dropdown-info">
                    <span className="user-dropdown-email">{user?.email}</span>
                    {user?.role && user.role !== 'user' && (
                      <span className={`user-dropdown-role ${user.role === 'super_admin' ? 'super' : ''}`}>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    )}
                  </div>
                </div>

                {organization && (
                  <div className="user-dropdown-org">
                    <span className="user-dropdown-org-label">Organisation</span>
                    <span className="user-dropdown-org-name">{organization.name}</span>
                    <span className="user-dropdown-org-role">
                      {organization.my_role === 'owner' ? 'Propriétaire' :
                       organization.my_role === 'admin' ? 'Admin' : 'Membre'}
                    </span>
                  </div>
                )}

                <div className="user-dropdown-links">
                  <a
                    href="/profile"
                    className="user-dropdown-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowUserMenu(false);
                      handleNavigation(e, '/profile');
                      if (!hasUnsavedChanges) navigate('/profile');
                    }}
                  >
                    Mon profil
                  </a>
                </div>

                <div className="user-dropdown-footer">
                  <button onClick={() => { setShowUserMenu(false); handleLogout(); }} className="user-dropdown-logout">
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <UnsavedChangesPopup />
    </>
  );
};

export default Navbar;
