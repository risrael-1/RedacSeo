import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import { UnsavedChangesPopup } from './common';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnsavedChanges, requestNavigation } = useUnsavedChanges();

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
            </div>
          </div>
          <div className="navbar-right">
            <a
              href="/profile"
              onClick={(e) => { e.preventDefault(); handleNavigation(e, '/profile'); if (!hasUnsavedChanges) navigate('/profile'); }}
              className={`user-profile-link ${isActive('/profile') ? 'active' : ''}`}
              title="Mon profil"
            >
              <span className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</span>
              <span className="user-email">{user?.email}</span>
            </a>
            {user?.role && user.role !== 'user' && (
              <span className={`user-role-badge ${user.role === 'super_admin' ? 'super' : ''}`}>
                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            )}
            <button onClick={handleLogout} className="logout-button">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <UnsavedChangesPopup />
    </>
  );
};

export default Navbar;
