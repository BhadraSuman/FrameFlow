import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Star,
  Check,
  X
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginAsDemo, loginWithGoogle, user } = useAuth();

  // Determine mode from initialMode prop or URL path
  const isSignupPath = location.pathname === '/signup';
  const defaultMode = initialMode || (isSignupPath ? 'REGISTER' : 'LOGIN');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(defaultMode);

  // Sync mode with route path changes
  useEffect(() => {
    if (location.pathname === '/signup' && mode !== 'REGISTER') {
      setMode('REGISTER');
    } else if (location.pathname === '/login' && mode !== 'LOGIN') {
      setMode('LOGIN');
    }
  }, [location.pathname]);

  // Update document title
  useEffect(() => {
    document.title =
      mode === 'LOGIN'
        ? 'Sign In — FrameFlow Studio'
        : 'Create Studio Portal — FrameFlow';
  }, [mode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [isStudioNameAuto, setIsStudioNameAuto] = useState(true);
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Dev Account Picker Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [savedClientId, setSavedClientId] = useState(
    localStorage.getItem('frameflow_google_client_id') || ''
  );

  // If already logged in, redirect to destination
  useEffect(() => {
    if (user) {
      const stateFrom = (location.state as any)?.from?.pathname;
      const destination = stateFrom && stateFrom !== '/' ? stateFrom : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const stateFrom = (location.state as any)?.from?.pathname;
  const from = stateFrom && stateFrom !== '/' ? stateFrom : '/dashboard';

  const switchMode = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    setError(null);
    const newPath = newMode === 'REGISTER' ? '/signup' : '/login';
    navigate(newPath, { replace: true, state: location.state });
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFullName(name);
    if (isStudioNameAuto) {
      setStudioName(name.trim() ? `${name.trim()} Photography` : '');
    }
  };

  const handleStudioNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudioName(e.target.value);
    setIsStudioNameAuto(false);
  };

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
          studioName: studioName.trim() || `${fullName.trim()} Studio`,
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

  // Robust Google Authentication
  const triggerGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const googleClientId =
        (window as any).VITE_GOOGLE_CLIENT_ID ||
        (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
        localStorage.getItem('frameflow_google_client_id');

      // Check if real Google Client ID is configured and Google GIS is ready
      if (
        (window as any).google?.accounts?.oauth2 &&
        googleClientId &&
        googleClientId !== 'dummy-google-client-id' &&
        !googleClientId.includes('your-google-client-id')
      ) {
        // Real Google OAuth2 Popup flow
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (resp: any) => {
            if (resp.error) {
              setError(`Google Sign-In error: ${resp.error_description || resp.error}`);
              setGoogleLoading(false);
              return;
            }
            if (resp.access_token) {
              try {
                await loginWithGoogle({ accessToken: resp.access_token });
                navigate(from, { replace: true });
              } catch (err: any) {
                setError(err.message || 'Failed to authenticate with Google token.');
              } finally {
                setGoogleLoading(false);
              }
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // If GIS One-Tap client is available
      if (
        (window as any).google?.accounts?.id &&
        googleClientId &&
        googleClientId !== 'dummy-google-client-id' &&
        !googleClientId.includes('your-google-client-id')
      ) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              try {
                await loginWithGoogle({ credential: response.credential });
                navigate(from, { replace: true });
              } catch (err: any) {
                setError(err.message || 'Google verification failed.');
              } finally {
                setGoogleLoading(false);
              }
            }
          }
        });
        (window as any).google.accounts.id.prompt();
        return;
      }

      // Otherwise, open our interactive Google Account Selector Dialog
      setShowGoogleModal(true);
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not be initiated.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSelectMockGoogleUser = async (userEmail: string, _userName?: string) => {
    setGoogleLoading(true);
    setError(null);
    setShowGoogleModal(false);

    try {
      await loginWithGoogle({ accessToken: `dev_token_${userEmail}` });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex selection:bg-iris-600 selection:text-white">
      {/* LEFT COLUMN: Editorial Studio Visual & Social Proof (Visible on Desktop lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Atmospheric Background with Subtle Photography Tone */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80")'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/90 pointer-events-none" />

        {/* Ambient Iris Radial Glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-iris-600/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Brand Top Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-iris-600 flex items-center justify-center text-white shadow-md shadow-iris-600/40 group-hover:bg-iris-500 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-2xl font-normal tracking-tight text-white font-serif">FrameFlow</span>
          </Link>

          <div className="inline-flex items-center space-x-2 text-zinc-300 text-xs font-medium px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-iris-400" />
            <span>Studio OS v2.0</span>
          </div>
        </div>

        {/* Center Editorial Showcase */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-iris-500/10 border border-iris-500/20 text-iris-300 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>Built for High-Volume Wedding & Event Studios</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-normal font-serif text-white tracking-tight leading-tight">
            "We cut our client album selection turnaround from 3 weeks to 48 hours."
          </h2>

          <p className="mt-6 text-sm text-zinc-300 leading-relaxed font-light">
            Couples tap hearts on their smartphones with live quota limits. You export ready-to-filter filenames straight into Adobe Lightroom Classic in one click.
          </p>

          {/* Testimonial Author */}
          <div className="mt-8 flex items-center space-x-4 pt-6 border-t border-zinc-800/80">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-iris-600 to-indigo-400 p-0.5">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-semibold text-white">
                KM
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-white flex items-center space-x-2">
                <span>Karan & Meera Visuals</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-zinc-400">Luxury Wedding Photography Studio, Mumbai</div>
            </div>
          </div>
        </div>

        {/* Bottom Platform Metrics */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 text-left">
          <div>
            <div className="text-xl font-serif text-white">100k+</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Photos Selected</div>
          </div>
          <div>
            <div className="text-xl font-serif text-white">1-Click</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Lightroom Export</div>
          </div>
          <div>
            <div className="text-xl font-serif text-white">Zero</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Egress Fees</div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form (Mobile & Desktop) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        {/* Top Header Link */}
        <div className="flex items-center justify-between pb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition"
          >
            <span>← Back to frameflow.app</span>
          </Link>

          <div className="lg:hidden flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-iris-600 flex items-center justify-center text-white">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif text-lg text-zinc-900">FrameFlow</span>
          </div>
        </div>

        {/* Center Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {/* Headline */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-normal font-serif text-zinc-900 tracking-tight">
              {mode === 'LOGIN' ? 'Welcome back to your studio' : 'Create your photographer studio'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5">
              {mode === 'LOGIN'
                ? 'Sign in to manage client galleries, view selections, and export.'
                : 'Start your studio with 5 GB free cloud storage and PIN proofing.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 mb-6">
            <button
              type="button"
              onClick={() => switchMode('LOGIN')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                mode === 'LOGIN'
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('REGISTER')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                mode === 'REGISTER'
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Create Studio
            </button>
          </div>

          {/* 1-Click Fast Sandbox Demo Studio Banner */}
          <div className="mb-6 p-4 rounded-xl bg-iris-50/50 border border-iris-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-iris-700 uppercase flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>1-Click Sandbox Fast-Pass</span>
              </span>
              <span className="text-[10px] bg-white border border-iris-200 text-iris-700 font-mono px-2 py-0.5 rounded-full font-medium">
                24h TTL
              </span>
            </div>
            <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
              Test FrameFlow instantly with sample events. All uploaded media auto-purges in 24 hours.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="w-full py-2.5 px-4 rounded-lg bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white font-medium text-xs shadow-sm shadow-iris-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{demoLoading ? 'Spinning up Sandbox...' : '⚡ Launch 1-Click Demo Studio'}</span>
            </button>
          </div>

          {/* Robust Google Sign-In Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={triggerGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-medium text-xs transition flex items-center justify-center space-x-3 border border-zinc-300 shadow-sm disabled:opacity-50"
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
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : mode === 'LOGIN'
                  ? 'Sign in with Google'
                  : 'Sign up with Google'}
              </span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-[#FAFAFA] px-3 text-zinc-400">Or continue with email</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={handleFullNameChange}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white border border-zinc-200 focus:border-iris-600 focus:ring-1 focus:ring-iris-600 rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider">
                      Studio / Brand Name *
                    </label>
                    {isStudioNameAuto && fullName.trim() && (
                      <span className="text-[10px] text-iris-600 font-medium">Auto-generated</span>
                    )}
                  </div>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={handleStudioNameChange}
                      placeholder="e.g. Royal Weddings Studio"
                      className="w-full bg-white border border-zinc-200 focus:border-iris-600 focus:ring-1 focus:ring-iris-600 rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Email Address *
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
                  className="w-full bg-white border border-zinc-200 focus:border-iris-600 focus:ring-1 focus:ring-iris-600 rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
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
                    className="w-full bg-white border border-zinc-200 focus:border-iris-600 focus:ring-1 focus:ring-iris-600 rounded-lg pl-10 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Password * {mode === 'REGISTER' && '(Min. 6 chars)'}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-zinc-200 focus:border-iris-600 focus:ring-1 focus:ring-iris-600 rounded-lg pl-10 pr-10 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <span>
                {loading
                  ? mode === 'LOGIN'
                    ? 'Signing In...'
                    : 'Creating Studio...'
                  : mode === 'LOGIN'
                  ? 'Sign In to Studio Portal'
                  : 'Create Free Studio Account'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          </form>

          {/* Toggle mode footer */}
          <div className="mt-6 text-center text-xs text-zinc-500">
            {mode === 'LOGIN' ? (
              <p>
                Don't have a studio portal yet?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('REGISTER')}
                  className="text-iris-600 hover:underline font-semibold"
                >
                  Create one free
                </button>
              </p>
            ) : (
              <p>
                Already have a studio account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="text-iris-600 hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-[11px] text-zinc-400">
          By signing in, you agree to FrameFlow's Terms of Service and Privacy Policy.
        </div>
      </div>

      {/* Google Interactive Account Picker Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span className="font-semibold text-xs text-zinc-900">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 mb-4 p-3 rounded-xl bg-iris-50/60 border border-iris-100 text-[11px] text-zinc-600 leading-relaxed">
              <span className="font-semibold text-iris-800 block mb-0.5">Live Google OAuth Setup:</span>
              To open the genuine <strong>accounts.google.com</strong> popup, enter your Google Client ID below or add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code>.
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Your Google Client ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={savedClientId}
                  onChange={(e) => setSavedClientId(e.target.value)}
                  placeholder="e.g. 123456-abc.apps.googleusercontent.com"
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-iris-600 font-mono text-[10px]"
                />
                <button
                  type="button"
                  disabled={!savedClientId.trim()}
                  onClick={() => {
                    localStorage.setItem('frameflow_google_client_id', savedClientId.trim());
                    setShowGoogleModal(false);
                    setTimeout(() => triggerGoogleAuth(), 100);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-iris-600 hover:bg-iris-700 text-white text-xs font-medium disabled:opacity-40 transition whitespace-nowrap shadow-sm"
                >
                  Launch Popup
                </button>
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-white px-2.5 text-zinc-400">Or test with 1-click account</span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: 'Rahul Sharma',
                  email: 'rahul.sharma@gmail.com',
                  role: 'Lead Photographer'
                },
                {
                  name: 'Priya Sen',
                  email: 'priya.weddings@gmail.com',
                  role: 'Wedding Creative Director'
                }
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectMockGoogleUser(acc.email, acc.name)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 hover:border-iris-500 hover:bg-iris-50/40 text-left transition flex items-center space-x-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-iris-600 text-white font-medium text-xs flex items-center justify-center shrink-0">
                    {acc.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-900 group-hover:text-iris-700 transition">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{acc.email}</div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-iris-600 opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100">
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Or enter any Google email address:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="photographer@gmail.com"
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-iris-600"
                />
                <button
                  type="button"
                  disabled={!customGoogleEmail.includes('@')}
                  onClick={() => handleSelectMockGoogleUser(customGoogleEmail)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium disabled:opacity-40 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
