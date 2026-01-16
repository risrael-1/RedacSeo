import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

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

    // Re-vérifier la confirmation si elle existe
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError('');
    setError('');

    if (value && password && value !== password) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

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

    if (!confirmPassword) {
      setConfirmPasswordError('Veuillez confirmer le mot de passe');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const result = await register(email, password);
      if (result.success) {
        setSuccess('Compte créé avec succès! Redirection...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Une erreur est survenue lors de la création du compte');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Créer un compte</h1>
        <p className="register-subtitle">RedacSEO - Gestion de rédaction SEO</p>

        <form onSubmit={handleSubmit} className="register-form">
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
              placeholder="Minimum 6 caractères"
              className={passwordError ? 'input-error' : ''}
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="••••••••"
              className={confirmPasswordError ? 'input-error' : ''}
            />
            {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="login-link">
          <p>Vous avez déjà un compte? <Link to="/">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
