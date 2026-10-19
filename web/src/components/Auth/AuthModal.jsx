import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AtSign, ArrowRight, Sparkles, KeyRound, Clock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuth,
    login,
    signup,
    verifyCode,
    resendCode,
    forgotPassword,
    resetPassword
  } = useAuth();

  // Mode: 'login' | 'signup' | 'verify' | 'forgot' | 'reset'
  const [mode, setMode] = useState(authModalTab || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (authModalTab) {
      setMode(authModalTab);
      setError('');
      setSuccess('');
    }
  }, [authModalTab]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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
      const data = await login(identifier, password);
      if (data?.requires_verification) {
        setEmail(data.email);
        setCooldown(data.cooldown || 60);
        setMode('verify');
        setSuccess('Please enter the 6-digit code sent to your email.');
      }
    } catch (err) {
      if (err.data?.requires_verification) {
        setEmail(err.data.email || identifier);
        setCooldown(err.data.cooldown || 60);
        setMode('verify');
        setError(err.message || 'Your email is not verified yet. We sent a 6-digit code.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const data = await signup({
        email,
        password,
        username,
        display_name: displayName
      });
      if (data?.requires_verification) {
        setCooldown(data.cooldown || 60);
        setMode('verify');
        setSuccess('Verification code sent! Please check your email.');
      }
    } catch (err) {
      if (err.data?.requires_verification) {
        setCooldown(err.data.cooldown || 60);
        setMode('verify');
        setError(err.message);
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await verifyCode(email, otpCode.trim());
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (type = 'verification') => {
    if (cooldown > 0) return;
    resetMessages();
    setLoading(true);

    try {
      const data = await resendCode(email, type);
      setCooldown(data.cooldown || 60);
      setSuccess(data.message || 'A new 6-digit code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again later.');
      if (err.data?.cooldown) {
        setCooldown(err.data.cooldown);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setCooldown(data.cooldown || 60);
      setMode('reset');
      setSuccess('If an account exists, a 6-digit reset code was sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
      if (err.data?.cooldown) {
        setCooldown(err.data.cooldown);
        setMode('reset');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(email, otpCode.trim(), newPassword);
      setSuccess(data.message || 'Password reset successfully! Please log in.');
      setMode('login');
      setPassword('');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Password reset failed.');
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11121C] border border-[#23263B] rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-3 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] mb-3 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-[#0D0E15] rounded-[14px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 text-2xl">A</span>
            </div>
          </div>
          <h2 className="text-xl font-black tracking-wide text-white">
            {mode === 'login' && 'Welcome Back to Audira'}
            {mode === 'signup' && 'Join Audira Music'}
            {mode === 'verify' && 'Verify Your Email'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Create New Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'verify' ? `Enter the 6-digit code sent to ${email || 'your email'}` : 'Unlimited free music streaming. No subscriptions.'}
          </p>

          {/* Quick Demo Fill Shortcut (only in login) */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-900/30 text-purple-300 border border-purple-500/30 hover:bg-purple-900/50 transition"
            >
              <Sparkles size={13} />
              Fill Demo credentials (demo@audira.io)
            </button>
          )}
        </div>

        {/* Tabs for Login / Signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex border-b border-[#23263B] px-8">
            <button
              onClick={() => { setMode('login'); resetMessages(); }}
              className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                mode === 'login'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); resetMessages(); }}
              className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
                mode === 'signup'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <div className="p-8 pt-5 space-y-4">
          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email or Username</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="demo@audira.io or audiophile"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetMessages(); }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* 2. SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Display Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivers"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Username Handle</label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. audiophile"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account & Get 6-Digit Code'}
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* 3. 6-DIGIT EMAIL VERIFICATION FORM */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
                <Clock size={16} className="text-purple-400 shrink-0" />
                <span>Code expires in <b>10 minutes</b> (max 5 attempts).</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-10 pr-4 py-3 text-center text-lg font-mono font-bold tracking-[8px] text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Verifying code...' : 'Verify & Enter Audira'}
                <ArrowRight size={15} />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetMessages(); }}
                  className="text-slate-400 hover:text-white transition"
                >
                  ← Back to Log In
                </button>

                <button
                  type="button"
                  onClick={() => handleResend('verification')}
                  disabled={cooldown > 0 || loading}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition disabled:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Sending code...' : 'Send 6-Digit Reset Code'}
                <ArrowRight size={15} />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetMessages(); }}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* 5. RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
                <Clock size={16} className="text-purple-400 shrink-0" />
                <span>Code expires in <b>10 minutes</b> (max 5 attempts).</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[8px] text-purple-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0B0C14] border border-[#23263B] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6 || newPassword.length < 6}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? 'Resetting password...' : 'Set New Password & Log In'}
                <ArrowRight size={15} />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetMessages(); }}
                  className="text-slate-400 hover:text-white transition"
                >
                  ← Back to Log In
                </button>

                <button
                  type="button"
                  onClick={() => handleResend('reset')}
                  disabled={cooldown > 0 || loading}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition disabled:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
