import React, { useState } from 'react';
import { X, Mail, Lock, User, AtSign, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuth, login, signup } = useAuth();
  const [tab, setTab] = useState(authModalTab || 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(identifier, password);
      } else {
        await signup({
          email,
          password,
          username,
          display_name: displayName
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setTab('login');
    setIdentifier('demo@audira.io');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-audira-card border border-audira-border rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-audira-hover transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] mb-3 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-[#0D0E15] rounded-[14px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 text-2xl">A</span>
            </div>
          </div>
          <h2 className="text-xl font-black tracking-wide text-white">
            {tab === 'login' ? 'Welcome Back to Audira' : 'Join Audira Music'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Unlimited free music streaming. No subscriptions.</p>

          {/* Quick Demo Fill Shortcut */}
          <button
            type="button"
            onClick={fillDemo}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-900/30 text-purple-300 border border-purple-500/30 hover:bg-purple-900/50 transition"
          >
            <Sparkles size={13} />
            Click to fill Demo credentials (demo@audira.io)
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-audira-border px-8">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'login'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              tab === 'signup'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {tab === 'signup' && (
            <>
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
                    className="w-full bg-[#0D0E15] border border-audira-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
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
                    className="w-full bg-[#0D0E15] border border-audira-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
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
                    className="w-full bg-[#0D0E15] border border-audira-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'login' && (
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
                  className="w-full bg-[#0D0E15] border border-audira-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D0E15] border border-audira-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Log In' : 'Create Account'}
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
