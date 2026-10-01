import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  Zap,
  AlertCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginAsDemo, user } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to home
  React.useEffect(() => {
    if (user) {
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          fullName,
          studioName,
          phone: phone || undefined
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await loginAsDemo();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const autofillDemo = () => {
    setEmail('photographer@frameflow.test');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="pt-6 sm:pt-10 text-center relative z-10 max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center space-x-3 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-rose-900/40 group-hover:scale-105 transition-transform duration-300">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-serif">FrameFlow</span>
        </Link>

        <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-widest px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agency Studio Portal</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
          {mode === 'LOGIN' ? 'Welcome Back, Photographer' : 'Create Your Studio Portal'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          High-resolution photo proofing, streaming zero-egress ingestion, and client selection management.
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 my-8">
        {/* 1-Click Fast Demo Login Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-zinc-900 to-amber-950/50 border border-rose-800/40 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Instant Test Mode</span>
            </span>
            <span className="text-[10px] bg-rose-900/60 text-rose-300 font-mono px-2 py-0.5 rounded-full">
              Zero Setup
            </span>
          </div>
          <p className="text-xs text-zinc-300 mb-3">
            Test the entire agency portal immediately as <strong>Rahul Sharma (Royal Weddings)</strong> with existing demo photos and selections.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{demoLoading ? 'Signing in as Demo...' : '⚡ 1-Click Instant Demo Login'}</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              mode === 'LOGIN'
                ? 'bg-zinc-850 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              mode === 'REGISTER'
                ? 'bg-zinc-850 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Studio
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Studio Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="e.g. Royal Weddings Photography"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={autofillDemo}
                  className="text-[10px] text-rose-400 hover:underline font-medium"
                >
                  Use Demo Credentials
                </button>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="photographer@frameflow.test"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Password {mode === 'REGISTER' && '(Min. 6 characters)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 border border-zinc-700 shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : mode === 'LOGIN' ? 'Sign In to Studio' : 'Create Studio Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-xs text-zinc-500 relative z-10">
        FrameFlow Agency Studio • Private & Secure SaaS Portal for Event Photographers
      </div>
    </div>
  );
};
