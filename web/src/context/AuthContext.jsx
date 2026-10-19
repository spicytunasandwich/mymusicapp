import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('audira_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const data = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('audira_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const signup = async ({ email, password, username, display_name }) => {
    const data = await api.post('/auth/signup', { email, password, username, display_name });
    localStorage.setItem('audira_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const googleLogin = async (idToken) => {
    const data = await api.post('/auth/google', { idToken });
    localStorage.setItem('audira_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('audira_token');
    setToken(null);
    setUser(null);
  };

  const openAuth = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      googleLogin,
      logout,
      updateUser,
      authModalOpen,
      authModalTab,
      openAuth,
      closeAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
