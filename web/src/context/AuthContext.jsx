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
    try {
      if (userData.theme_accent && typeof userData.theme_accent === 'string') {
        const cleanAccent = userData.theme_accent.trim();
        if (/^#[0-9a-fA-F]{6}$/i.test(cleanAccent)) {
          document.documentElement.style.setProperty('--audira-accent', cleanAccent);
          document.documentElement.style.setProperty('--audira-accent-light', cleanAccent);
          document.documentElement.style.setProperty('--audira-accent-glow', `${cleanAccent}59`);
        } else if (/^#[0-9a-fA-F]{3,8}$/i.test(cleanAccent)) {
          document.documentElement.style.setProperty('--audira-accent', cleanAccent);
          document.documentElement.style.setProperty('--audira-accent-light', cleanAccent);
        }
      }
      if (userData.gradient_top && userData.gradient_bottom) {
        const top = typeof userData.gradient_top === 'string' && userData.gradient_top.startsWith('#') ? userData.gradient_top : '#1A2E22';
        const bottom = typeof userData.gradient_bottom === 'string' && userData.gradient_bottom.startsWith('#') ? userData.gradient_bottom : '#121212';
        document.documentElement.style.setProperty('--audira-gradient-top', top);
        document.documentElement.style.setProperty('--audira-gradient-bottom', bottom);
        document.documentElement.style.setProperty(
          '--audira-bg-gradient',
          `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`
        );
      }
    } catch (e) {
      console.warn('Theme application notice:', e.message);
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
    if (data.token) {
      localStorage.setItem('audira_token', data.token);
      setToken(data.token);
      setUser(data.user);
      applyUserTheme(data.user);
      setAuthModalOpen(false);
    }
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
