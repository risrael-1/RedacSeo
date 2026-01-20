import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount and refresh their data
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData.user);
          setIsAuthenticated(true);

          // Refresh user data from API to get latest role
          try {
            const response = await authAPI.getCurrentUser();
            if (response.user) {
              setUser(response.user);
              sessionStorage.setItem('user', JSON.stringify({
                token: userData.token,
                user: response.user
              }));
            }
          } catch (refreshError) {
            console.error('Failed to refresh user data:', refreshError);
            // If refresh fails (e.g., token expired), keep using stored data
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (email, password) => {
    try {
      const response = await authAPI.register(email, password);

      // Store token and user info in sessionStorage (per-tab, cleared on close)
      sessionStorage.setItem('user', JSON.stringify({
        token: response.token,
        user: response.user
      }));

      setUser(response.user);
      setIsAuthenticated(true);

      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      // Store token and user info in sessionStorage (per-tab, cleared on close)
      sessionStorage.setItem('user', JSON.stringify({
        token: response.token,
        user: response.user
      }));

      setUser(response.user);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const response = await authAPI.resetPassword(email, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Refresh user data from API (useful after role change)
  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.user) {
        // Update user in state
        setUser(response.user);

        // Update sessionStorage (keep the token, update user data)
        const storedData = sessionStorage.getItem('user');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          sessionStorage.setItem('user', JSON.stringify({
            token: parsed.token,
            user: response.user
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return false;
    }
  };

  // Helper functions for role checking
  const isSuperAdmin = () => user?.role === 'super_admin';
  const isAdmin = () => user?.role === 'admin' || user?.role === 'super_admin';
  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      logout,
      register,
      resetPassword,
      refreshUser,
      isSuperAdmin,
      isAdmin,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
