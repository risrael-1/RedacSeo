import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setError('');

    if (value && !validateEmail(value)) {
      setEmailError('Format d\'email invalide');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError('');
    setError('');

    if (value && value.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;

    if (!email) {
      setEmailError('L\'email est requis');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Format d\'email invalide');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Le mot de passe est requis');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Email ou mot de passe incorrect. Veuillez réessayer.');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
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
              onChange={handleEmailChange}
              placeholder="votre@email.com"
              className={emailError ? 'input-error' : ''}
            />
            {emailError && <span className="field-error">{emailError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className={passwordError ? 'input-error' : ''}
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
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
