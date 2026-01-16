import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    // Simulation d'envoi d'email de réinitialisation
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.find(u => u.email === email);

    if (userExists) {
      setMessage('Un email de réinitialisation a été envoyé à votre adresse email.');
    } else {
      setError('Aucun compte trouvé avec cette adresse email.');
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>Mot de passe oublié</h1>
        <p className="forgot-password-subtitle">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
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

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" className="reset-button">
            Envoyer le lien de réinitialisation
          </button>
        </form>

        <div className="back-link">
          <Link to="/">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
