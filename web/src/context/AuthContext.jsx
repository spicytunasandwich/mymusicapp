import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('audira_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'

  const applyUserTheme = (userData) => {
    if (!userData) return;
    if (userData.theme_accent) {
      document.documentElement.style.setProperty('--audira-accent', userData.theme_accent);
      document.documentElement.style.setProperty('--audira-accent-light', userData.theme_accent);
      document.documentElement.style.setProperty('--audira-accent-glow', `${userData.theme_accent}59`);
    }
    if (userData.gradient_top && userData.gradient_bottom) {
      document.documentElement.style.setProperty('--audira-gradient-top', userData.gradient_top);
      document.documentElement.style.setProperty('--audira-gradient-bottom', userData.gradient_bottom);
      document.documentElement.style.setProperty(
        '--audira-bg-gradient',
        `linear-gradient(180deg, ${userData.gradient_top} 0%, ${userData.gradient_bottom} 100%)`
      );
    }
  };

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
        applyUserTheme(data.user);
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
    if (data.token) {
      localStorage.setItem('audira_token', data.token);
      setToken(data.token);
      setUser(data.user);
      applyUserTheme(data.user);
      setAuthModalOpen(false);
    }
    return data;
  };

  const signup = async ({ email, password, username, display_name }) => {
    const data = await api.post('/auth/signup', { email, password, username, display_name });
    // User must verify 6-digit code before session token is granted
    return data;
  };

  const verifyCode = async (email, code) => {
    const data = await api.post('/auth/verify-code', { email, code });
    if (data.token) {
      localStorage.setItem('audira_token', data.token);
      setToken(data.token);
      setUser(data.user);
      applyUserTheme(data.user);
      setAuthModalOpen(false);
    }
    return data;
  };

  const resendCode = async (email, type = 'verification') => {
    return await api.post('/auth/resend-code', { email, type });
  };

  const forgotPassword = async (email) => {
    return await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email, code, newPassword) => {
    return await api.post('/auth/reset-password', {
      email,
      code,
      new_password: newPassword
    });
  };

  const googleLogin = async (idToken) => {
    const data = await api.post('/auth/google', { idToken });
    localStorage.setItem('audira_token', data.token);
    setToken(data.token);
    setUser(data.user);
    applyUserTheme(data.user);
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
      verifyCode,
      resendCode,
      forgotPassword,
      resetPassword,
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
