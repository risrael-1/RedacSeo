import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const register = (email, password) => {
    // Récupérer les utilisateurs existants
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Vérifier si l'utilisateur existe déjà
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Un compte avec cet email existe déjà' };
    }

    // Ajouter le nouvel utilisateur
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, message: 'Compte créé avec succès' };
  };

  const login = (email, password) => {
    // Récupérer les utilisateurs du localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Vérifier les identifiants
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      setUser({ email: user.email });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
