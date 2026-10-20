import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AtSign, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuth,
    login,
    signup,
    googleLogin,
    forgotPassword,
    resetPassword
  } = useAuth();

  // Mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState(authModalTab || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (authModalTab) {
      setMode(authModalTab);
      setError('');
      setSuccess('');
    }
  }, [authModalTab]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      console.warn('Google response missing credential token:', response);
      setError('No credential received from Google. Please try again.');
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      await googleLogin(response.credential);
      closeAuth();
    } catch (err) {
      console.error('[Google Login Diagnostic]', {
        error: err,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        details: err.data || err.message
      });
      const errorMsg = err.data?.error || err.message || 'Google sign-in verification failed.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authModalOpen || !googleClientId || typeof window === 'undefined') return;
    const checkGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredential,
            error_callback: (err) => {
              console.error('Google GIS client error:', err);
              if (err?.type === 'popup_closed') {
                setError('Google sign-in window was closed.');
              } else {
                setError(`Google Sign-In: ${err?.type || 'Configuration or authorization error.'}`);
              }
            }
          });
          const btn = document.getElementById('google-signin-btn');
          if (btn) {
            window.google.accounts.id.renderButton(btn, {
              theme: 'filled_black',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill'
            });
          }
        } catch (e) {
          console.warn('GIS error:', e);
        }
      }
    };
    checkGoogle();
    const t = setTimeout(checkGoogle, 600);
    return () => clearTimeout(t);
  }, [authModalOpen, mode, googleClientId]);

  if (!authModalOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await login(identifier, password);
      closeAuth();
    } catch (err) {
      setError(err.message || 'Invalid email/username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessages();

    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        email,
        password,
        username: cleanUser,
        display_name: displayName || cleanUser
      });
      closeAuth();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!email) {
      setError('Please provide your account email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccess(data.message || 'Password reset instructions have been sent.');
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode('login');
    setIdentifier('demo@audira.io');
    setPassword('password123');
    resetMessages();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-[#282828] rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header (1:1 Spotify Layout) */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4 shadow-lg">
            <img src="/brand/logo.svg" alt="Linear" className="w-7 h-7 object-contain" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {mode === 'login' && 'Log in to Linear'}
            {mode === 'signup' && 'Sign up to start listening'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Unlimited free music streaming. No subscriptions.
          </p>

          {/* Quick Demo Fill Shortcut (only in login) */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition"
            >
              <Sparkles size={13} className="text-[#1DB954]" />
              Fill Demo credentials (demo@audira.io)
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="px-8">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2 mb-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2 mb-3">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 space-y-4">
          {/* Google Sign-in Section (Login & Signup modes) */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex justify-center">
                <div id="google-signin-btn" className="flex justify-center min-h-[44px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleClientId) {
                        setError('Google Sign-In is not configured yet. Set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.');
                        return;
                      }
                      if (window.google?.accounts?.id) {
                        window.google.accounts.id.prompt();
                      } else {
                        setError('Loading Google services. Please try again.');
                      }
                    }}
                    className="w-full max-w-[320px] py-2.5 px-4 rounded-full border border-[#727272] hover:border-white text-xs font-bold text-white flex items-center justify-center gap-3 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#282828]" />
                <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-[#282828]" />
              </div>
            </>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  Email or username
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={loading}
                  placeholder="Email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetMessages(); }}
                    className="text-xs text-slate-400 hover:text-white underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  disabled={loading}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Signature Spotify Green Round CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-sm bg-[#1DB954] text-black hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>

              <div className="border-t border-[#282828] pt-4 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); resetMessages(); }}
                    className="text-white font-bold hover:underline"
                  >
                    Sign up for Linear
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  What's your email?
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  disabled={loading}
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Create a username (min 3 chars)
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  disabled={loading}
                  placeholder="cool_listener"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  disabled={loading}
                  placeholder="What should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Create a password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  disabled={loading}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-sm bg-[#1DB954] text-black hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Sign Up</span>
                )}
              </button>

              <div className="border-t border-[#282828] pt-4 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); resetMessages(); }}
                    className="text-white font-bold hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  Enter your email address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  disabled={loading}
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] rounded-md px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-sm bg-[#1DB954] text-black hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetMessages(); }}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
