import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <h1 className="navbar-logo">RedacSEO</h1>
          <div className="navbar-links">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              Tableau de bord
            </Link>
            <Link
              to="/projects"
              className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
            >
              Projets
            </Link>
            <Link
              to="/redaction"
              className={`nav-link ${isActive('/redaction') ? 'active' : ''}`}
            >
              Rédaction
            </Link>
            <Link
              to="/regles"
              className={`nav-link ${isActive('/regles') ? 'active' : ''}`}
            >
              Règles SEO
            </Link>
          </div>
        </div>
        <div className="navbar-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
