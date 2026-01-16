import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>RedacSEO</h1>
        <p className="login-subtitle">Gestion de rédaction SEO</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password" className="forgot-link">Mot de passe oublié?</Link>
          <p className="register-link">
            Pas encore de compte? <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
