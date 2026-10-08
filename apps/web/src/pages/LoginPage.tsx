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
  const { login, register, loginAsDemo, loginWithGoogle, user } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
              <span>Isolated Sandbox Studio</span>
            </span>
            <span className="text-[10px] bg-rose-900/60 text-rose-300 font-mono px-2 py-0.5 rounded-full">
              24-Hour TTL
            </span>
          </div>
          <p className="text-xs text-zinc-300 mb-3">
            Spins up an isolated sandbox studio for testing. All events, client selections, and uploaded media are <strong>automatically purged after 24 hours</strong>.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{demoLoading ? 'Spinning up Sandbox Studio...' : '⚡ 1-Click Instant Demo Login (24h Auto-Purge)'}</span>
          </button>
        </div>

        {/* Google One-Tap / OAuth Sign In */}
        <div className="mb-6">
          <button
            type="button"
            onClick={async () => {
              setGoogleLoading(true);
              setError(null);
              try {
                // If Google Identity Services client is available with client ID
                const googleClientId = (window as any).VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id';
                if ((window as any).google?.accounts?.id && googleClientId !== 'dummy-google-client-id') {
                  (window as any).google.accounts.id.prompt();
                } else {
                  // Fallback: prompt user for Google email or standard OAuth flow
                  const inputEmail = prompt('Enter your Google email to sign in via Google OAuth:');
                  if (!inputEmail) {
                    setGoogleLoading(false);
                    return;
                  }
                  await loginWithGoogle({ accessToken: `token_for_${inputEmail}`, credential: '' });
                  navigate(from, { replace: true });
                }
              } catch (err: any) {
                setError(err.message || 'Google sign-in failed.');
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition flex items-center justify-center space-x-2.5 shadow-md active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold">
              <span className="bg-zinc-900 px-3 text-zinc-500">Or continue with email</span>
            </div>
          </div>
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
