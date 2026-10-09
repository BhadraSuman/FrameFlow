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

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      const stateFrom = (location.state as any)?.from?.pathname;
      const destination = stateFrom && stateFrom !== '/' ? stateFrom : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const stateFrom = (location.state as any)?.from?.pathname;
  const from = stateFrom && stateFrom !== '/' ? stateFrom : '/dashboard';

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
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-iris-600 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-iris-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <div className="pt-6 sm:pt-10 text-center relative z-10 max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center space-x-3 mb-4 group">
          <div className="w-11 h-11 rounded-lg bg-iris-600 flex items-center justify-center text-white shadow-sm shadow-iris-600/20 group-hover:bg-iris-700 transition-colors">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-2xl font-normal tracking-tight text-zinc-900 font-serif">FrameFlow</span>
        </Link>

        <div>
          <div className="inline-flex items-center space-x-2 text-zinc-700 text-xs font-medium px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-iris-600" />
            <span>Photography Studio Portal</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-zinc-900 font-serif">
          {mode === 'LOGIN' ? 'Welcome Back, Photographer' : 'Create Your Studio Portal'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mt-2 max-w-md mx-auto">
          High-resolution photo proofing, streaming zero-egress ingestion, and client selection management.
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10 my-8">
        {/* 1-Click Fast Demo Login Banner */}
        <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-iris-700 uppercase flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Sandbox Studio</span>
            </span>
            <span className="text-[10px] bg-zinc-200/80 text-zinc-700 font-mono px-2 py-0.5 rounded-full font-medium">
              24h TTL
            </span>
          </div>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Spins up an isolated sandbox studio for testing. All events and uploaded media are <strong className="text-zinc-900">automatically purged after 24 hours</strong>.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="w-full py-2.5 px-4 rounded-lg bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white font-medium text-xs shadow-sm shadow-iris-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{demoLoading ? 'Spinning up Sandbox Studio...' : '⚡ 1-Click Demo Studio (24h Auto-Purge)'}</span>
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
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition flex items-center justify-center space-x-2.5 border border-zinc-200 shadow-sm active:scale-[0.99]"
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
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold">
              <span className="bg-white px-3 text-zinc-400">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'LOGIN'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
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
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
              mode === 'REGISTER'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Create Studio
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
                  Studio Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="e.g. Royal Weddings Photography"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider">
                Email Address
              </label>
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={autofillDemo}
                  className="text-[10px] text-iris-600 hover:text-iris-700 hover:underline font-semibold"
                >
                  Use Demo Credentials
                </button>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="photographer@frameflow.test"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
              Password {mode === 'REGISTER' && '(Min. 6 characters)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : mode === 'LOGIN' ? 'Sign In to Studio' : 'Create Studio Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-xs text-zinc-400 relative z-10">
        FrameFlow Photography Platform • Monochrome interface with Iris accent
      </div>
    </div>
  );
};
