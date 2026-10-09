import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Heart,
  Sliders,
  HardDrive,
  Copy,
  Check,
  Shield,
  Smartphone,
  ChevronDown,
  FileSpreadsheet,
  XCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAsDemo } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'client'>('studio');
  const [copiedFilenames, setCopiedFilenames] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  const sampleFilenames = 'PR_WED_0142.JPG, PR_WED_0148.JPG, PR_WED_0162.JPG, PR_WED_0199.JPG, PR_WED_0204.JPG';

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleFilenames);
    setCopiedFilenames(true);
    setTimeout(() => setCopiedFilenames(false), 2000);
  };

  const faqs = [
    {
      q: 'How does client photo selection work?',
      a: 'You send your client a private gallery link and a 4-digit PIN. The couple opens the gallery on any phone, tablet, or laptop without needing an account or app. They tap the heart icon on their favorite photos. A live counter displays their progress against your quota (e.g. 48 of 50 photos). Once satisfied, they click "Submit Selection", which locks the gallery to prevent changes and instantly notifies your studio.'
    },
    {
      q: 'How do I export selected photos into Adobe Lightroom Classic?',
      a: 'Once your client submits their choices, your Studio dashboard gives you a 1-click "Copy Lightroom Filenames" button. Open Adobe Lightroom, press Library Filter > Text > Filename > Contains, and simply paste. Lightroom immediately isolates only the chosen photos for editing, saving hours of manual filename searching.'
    },
    {
      q: 'Where are photos stored and how fast is the upload?',
      a: 'FrameFlow uses zero-egress direct cloud storage (AWS S3 and Cloudflare R2). When you drop photos into your studio, they stream directly to high-speed cloud storage via secure presigned URLs without bogging down your application server. Client previews are generated at optimized WebP resolutions so mobile loading is blazing fast.'
    },
    {
      q: 'Can I try FrameFlow right now without creating an account?',
      a: 'Yes! Click "⚡ 1-Click Interactive Demo" anywhere on this page. FrameFlow instantly spins up an isolated sandbox studio loaded with real wedding photos and client selections so you can experience the full workflow in seconds. All demo sandbox media automatically purges after 24 hours.'
    },
    {
      q: 'Can I apply my own studio watermark and branding?',
      a: 'Absolutely. On the Starter and Pro plans, you can upload your studio logo, set your custom brand accent color, link your Instagram portfolio, and enable automated proof watermarking on client preview images while keeping your high-resolution master files secure.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-iris-600 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-iris-600 flex items-center justify-center text-white shadow-sm shadow-iris-600/30 group-hover:bg-iris-700 transition">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-normal text-zinc-900 tracking-tight">FrameFlow</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-iris-50 text-iris-700 border border-iris-200">
                PRO STUDIO
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition">Features</a>
            <a href="#preview" className="hover:text-zinc-900 transition">Interactive Demo</a>
            <a href="#workflow" className="hover:text-zinc-900 transition">How It Works</a>
            <a href="#pricing" className="hover:text-zinc-900 transition">Pricing</a>
            <a href="#faq" className="hover:text-zinc-900 transition">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition"
              >
                <span>Studio Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleLaunchDemo}
                  disabled={demoLoading}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-iris-50 hover:bg-iris-100 text-iris-700 text-xs font-medium border border-iris-200 transition"
                  title="Try without signing up"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{demoLoading ? 'Launching...' : '1-Click Demo'}</span>
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-zinc-700 hover:text-zinc-900 text-xs font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-iris-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm text-xs text-zinc-700 font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-iris-600" />
            <span>The Modern Photo Proofing Standard for Photography Studios</span>
            <span className="text-zinc-300">•</span>
            <span className="text-iris-600 font-semibold">v2.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal font-serif text-zinc-900 tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Deliver wedding galleries clients actually love to select.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            No more WhatsApp screenshots, messy Google Drive folders, or endless filename lists.
            FrameFlow provides private branded client proofing with PIN security, quota controls, and 1-click Lightroom exports.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white font-medium text-sm shadow-md shadow-iris-600/25 transition flex items-center justify-center space-x-2"
            >
              <span>Create Free Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-medium text-sm border border-zinc-300 shadow-sm transition flex items-center justify-center space-x-2.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-iris-600 fill-current" />
              <span>{demoLoading ? 'Spinning Up Demo...' : '⚡ 1-Click Interactive Demo (No Sign-Up)'}</span>
            </button>
          </div>

          {/* Trust Value Badges */}
          <div className="mt-10 pt-6 border-t border-zinc-200/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>5 GB Free Storage</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct AWS S3 / R2 Ingestion</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mobile-First Client Proofing</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click Lightroom Export</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Product Showcase */}
      <section id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden">
          {/* Top Window Bar with View Switcher */}
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <div className="w-3 h-3 rounded-full bg-zinc-300" />
              <span className="text-xs font-mono text-zinc-500 ml-3">
                {activeTab === 'studio' ? 'studio.frameflow.app/events/priya-rohan' : 'gallery.frameflow.app/priya-rohan-wedding'}
              </span>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex items-center p-1 bg-zinc-200/80 rounded-xl border border-zinc-300">
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'studio'
                    ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-iris-600" />
                <span>Photographer Studio View</span>
              </button>
              <button
                onClick={() => setActiveTab('client')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'client'
                    ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Client Proofing View</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-6 sm:p-10 bg-[#FAFAFA]">
            {activeTab === 'studio' ? (
              /* Studio Experience Mock */
              <div className="space-y-6">
                {/* Event Header Card */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-iris-700 bg-iris-50 px-2 py-0.5 rounded-full border border-iris-200">
                        WEDDING GALLERY
                      </span>
                      <span className="text-xs text-zinc-400">•</span>
                      <span className="text-xs text-zinc-500">December 14, 2026</span>
                    </div>
                    <h3 className="text-2xl font-normal font-serif text-zinc-900">
                      Priya & Rohan — Royal Palace Wedding
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Client: Priya Sharma (priya.sharma@example.com) • PIN: <span className="font-mono font-medium text-zinc-800">4821</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopySample}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition"
                    >
                      {copiedFilenames ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFilenames ? 'Filenames Copied!' : 'Copy Lightroom Query'}</span>
                    </button>
                    <button className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium border border-zinc-200 transition">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>

                {/* Client Submission Status Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-950">
                        Client Selection Submitted & Locked
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Couple locked 48 out of 50 requested photos. Ready for album retouching.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                    48 / 50 Selected
                  </span>
                </div>

                {/* Photo Grid Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {[
                    { id: '0142', heart: true, name: 'PR_WED_0142.JPG' },
                    { id: '0143', heart: false, name: 'PR_WED_0143.JPG' },
                    { id: '0148', heart: true, name: 'PR_WED_0148.JPG' },
                    { id: '0151', heart: false, name: 'PR_WED_0151.JPG' },
                    { id: '0162', heart: true, name: 'PR_WED_0162.JPG' },
                    { id: '0199', heart: true, name: 'PR_WED_0199.JPG' },
                  ].map((photo, i) => (
                    <div
                      key={photo.id}
                      className={`relative aspect-[3/2] rounded-[6px] border overflow-hidden group bg-zinc-100 ${
                        photo.heart ? 'border-iris-600 ring-2 ring-iris-600/30' : 'border-zinc-200'
                      }`}
                    >
                      {/* Gradient Mock Photo */}
                      <div className={`w-full h-full flex flex-col items-center justify-center p-2 text-center ${
                        i % 2 === 0 ? 'bg-gradient-to-tr from-zinc-200 to-zinc-100' : 'bg-gradient-to-br from-amber-50 to-rose-50'
                      }`}>
                        <Camera className="w-5 h-5 text-zinc-400 mb-1" />
                        <span className="text-[9px] font-mono text-zinc-500 truncate w-full">{photo.name}</span>
                      </div>

                      {photo.heart && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-iris-600 text-white flex items-center justify-center shadow-sm">
                          <Heart className="w-3 h-3 fill-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Client Experience Mock */
              <div className="space-y-6">
                {/* Client Welcome Cover */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
                  <div className="inline-flex items-center space-x-1.5 text-xs text-iris-700 font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Royal Weddings Photography Studio</span>
                  </div>
                  <h2 className="text-3xl font-normal font-serif text-zinc-900">Priya & Rohan</h2>
                  <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                    Welcome to your private wedding gallery. Please heart your favorite 50 photos for your handcrafted print album.
                  </p>

                  <div className="mt-4 inline-flex items-center space-x-2 text-xs bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full text-zinc-700">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>PIN Protected Gallery</span>
                  </div>
                </div>

                {/* Floating Selection Dock Preview */}
                <div className="bg-white/95 border border-zinc-200 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-iris-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-iris-600/30">
                      48
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">
                        Album Selection Quota
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        48 of 50 photos chosen (2 slots remaining)
                      </div>
                    </div>
                  </div>

                  <button className="px-4 py-2 rounded-lg bg-iris-600 hover:bg-iris-700 text-white text-xs font-medium shadow-sm transition">
                    Submit Selection to Studio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. The Pain vs. The Solution */}
      <section className="py-20 bg-white border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-iris-700 tracking-wider uppercase">
              WHY STUDIOS SWITCH TO FRAMEFLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal font-serif text-zinc-900 mt-2 tracking-tight">
              Stop losing 10+ hours per wedding to selection chaos.
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base mt-3">
              Couples want an effortless experience on their smartphones. You want a clean list of filenames ready for editing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center space-x-2.5 text-rose-700 font-semibold text-xs tracking-wider uppercase mb-4">
                <XCircle className="w-4 h-4" />
                <span>The Frustrating Old Way</span>
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-4">
                Drive folders, WhatsApp screenshots & Excel lists
              </h3>
              <ul className="space-y-3.5 text-xs text-zinc-600">
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Couples screenshotting photos on phones and sending 80 compressed, blurry WhatsApp images.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Handwritten paper notes or messy spreadsheets with typos like <code>IMG_4021.JPG</code>.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Couples over-selecting 140 photos instead of their 50-photo package, forcing awkward negotiation calls.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Spending 3 hours searching for raw filenames manually in Adobe Lightroom Classic.</span>
                </li>
              </ul>
            </div>

            {/* The FrameFlow Way */}
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-2.5 text-emerald-700 font-semibold text-xs tracking-wider uppercase mb-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>The FrameFlow Standard</span>
              </div>
              <h3 className="text-xl font-medium text-zinc-900 mb-4">
                Branded proofing with 1-click Lightroom exports
              </h3>
              <ul className="space-y-3.5 text-xs text-zinc-600">
                <li className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Private branded link with 4-digit security PIN that couples can browse smoothly on any phone.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Real-time quota counter guides couples to choose exactly their allotted photo count (e.g. 50 photos).</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1-click client submission locks selections so both parties are strictly aligned on album contents.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1-click "Copy Lightroom Query" pastes directly into Lightroom filter to isolate chosen RAWs instantly.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (4 Simple Steps) */}
      <section id="workflow" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold text-iris-700 tracking-wider uppercase">
            THE 4-STEP PRODUCTION WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-5xl font-normal font-serif text-zinc-900 mt-2 tracking-tight">
            How FrameFlow works for your studio
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base mt-3">
            Designed specifically for high-volume wedding, event, and portrait photographers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Ingest to Cloud',
              desc: 'Drag & drop hundreds of photos. Direct-to-S3 presigned uploads bypass server bottlenecks with zero egress fees.'
            },
            {
              step: '02',
              title: 'Set PIN & Quotas',
              desc: 'Configure a 4-digit security PIN and set your selection quota (e.g. 50 photos). Enable proof watermarks with one toggle.'
            },
            {
              step: '03',
              title: 'Client Hearts & Locks',
              desc: 'The couple opens the gallery on their phone, hearts their favorite photos against the quota, and submits their final selection.'
            },
            {
              step: '04',
              title: 'Export to Lightroom',
              desc: 'Click "Copy Lightroom Query", paste into Lightroom Library Filter, and immediately start retouching only the selected files.'
            }
          ].map((item) => (
            <div key={item.step} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative">
              <span className="text-2xl font-serif text-iris-600 font-normal block mb-3">{item.step}</span>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">{item.title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Studio Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-iris-700 tracking-wider uppercase">
              STUDIO-GRADE CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-normal font-serif text-zinc-900 mt-2 tracking-tight">
              Built for speed, privacy, and client delight
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Zero-Egress Direct S3 Storage</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Connect your AWS S3 or Cloudflare R2 bucket. Photos stream directly from your browser to storage with zero egress bandwidth charges.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">4-Digit PIN Security</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Family moments remain strictly private. Clients access their proofing portal with a simple 4-digit PIN without needing an account.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Proof Watermark Protection</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Protect your intellectual property. Automated watermark overlays on 1600px preview images prevent unauthorized downloading.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Mobile-First Touch Proofing</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Over 85% of couples select photos on their phone. FrameFlow is built with a responsive bottom action dock and swipeable fullscreen lightbox.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Selection Locking & Audits</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                When a client confirms their selection, the gallery is locked. No sneaky post-submission replacements or shifting goalposts.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">24h Sandbox Studio</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Test everything instantly with 1-click sandbox access. Sample events and uploads are automatically cleaned up after 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Transparent Studio Pricing */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold text-iris-700 tracking-wider uppercase">
            TRANSPARENT STUDIO PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-normal font-serif text-zinc-900 mt-2 tracking-tight">
            Simple plans for every studio size
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base mt-3">
            Start free, upgrade as your wedding season expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free Tier */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                FREE SANDBOX
              </span>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-serif font-normal text-zinc-900">₹0</span>
                <span className="text-xs text-zinc-500">/ forever</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                Perfect for trying out FrameFlow on your first couple shoot.
              </p>

              <ul className="space-y-3 text-xs text-zinc-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>5 GB</strong> Cloud Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1 Active Client Gallery</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4-Digit PIN Security</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>24-Hour Sandbox Purge</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className="mt-8 w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold text-center transition block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Starter Tier */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                STARTER
              </span>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-serif font-normal text-zinc-900">₹299</span>
                <span className="text-xs text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                For solo portrait & pre-wedding photographers.
              </p>

              <ul className="space-y-3 text-xs text-zinc-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>20 GB</strong> Cloud Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlimited Active Events</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quota Tracker & Selection Lock</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lightroom Query Filename Export</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className="mt-8 w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold text-center transition block"
            >
              Start Starter Plan
            </Link>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="bg-white border-2 border-iris-600 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-iris-600 text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-sm">
              MOST POPULAR ⭐
            </div>

            <div>
              <span className="text-xs font-semibold text-iris-700 uppercase tracking-wider block mb-2">
                PRO STUDIO
              </span>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-serif font-normal text-zinc-900">₹699</span>
                <span className="text-xs text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                The standard choice for busy wedding photography teams.
              </p>

              <ul className="space-y-3 text-xs text-zinc-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-iris-600" />
                  <span><strong>100 GB</strong> Cloud Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-iris-600" />
                  <span>Custom Studio Logo & Branding</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-iris-600" />
                  <span>Automated Proof Watermarking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-iris-600" />
                  <span>Selection Audit & Lock Controls</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-iris-600" />
                  <span>Priority WhatsApp & Email Support</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className="mt-8 w-full py-2.5 rounded-lg bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white text-xs font-semibold text-center transition block shadow-sm shadow-iris-600/30"
            >
              Start Pro Studio
            </Link>
          </div>

          {/* Studio Tier */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                ENTERPRISE STUDIO
              </span>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-3xl font-serif font-normal text-zinc-900">₹1,499</span>
                <span className="text-xs text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                For established multi-crew production studios.
              </p>

              <ul className="space-y-3 text-xs text-zinc-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>500 GB</strong> Cloud Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>White-Label Custom Domain</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-User Assistant Access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VIP Dedicated Ingestion Bandwidth</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className="mt-8 w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold text-center transition block"
            >
              Start Studio Plan
            </Link>
          </div>
        </div>

        {/* One-Time Pass Callout */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-100 border border-zinc-200 text-center max-w-xl mx-auto flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-900 block">Don't shoot every month?</span>
            <span className="text-[11px] text-zinc-500">Single Event Passes available at ₹199 / wedding. Pay as you go.</span>
          </div>
          <Link to="/login" className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-medium text-zinc-800 hover:bg-zinc-50 transition">
            View Passes
          </Link>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section id="faq" className="py-20 bg-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-iris-700 tracking-wider uppercase">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl font-normal font-serif text-zinc-900 mt-2">
              Everything you need to know about FrameFlow
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className="border border-zinc-200 rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left bg-zinc-50/50 hover:bg-zinc-50 flex items-center justify-between font-medium text-xs sm:text-sm text-zinc-900 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 bg-white border-t border-zinc-100 text-xs text-zinc-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Final High-Conversion CTA Banner */}
      <section className="py-20 bg-[#FAFAFA] border-t border-zinc-200 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-iris-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-iris-600/30">
            <Camera className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-normal font-serif text-zinc-900 tracking-tight">
            Ready to upgrade your studio's client proofing?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-600 max-w-xl mx-auto">
            Join hundreds of photography studios delivering branded client galleries that save hours of editing time every week.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-iris-600 hover:bg-iris-700 text-white text-sm font-semibold shadow-md shadow-iris-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 text-sm font-semibold border border-zinc-300 shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 text-iris-600 fill-current" />
              <span>⚡ Try 1-Click Sandbox</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md bg-iris-600 text-white flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif text-base text-zinc-900 font-normal">FrameFlow</span>
            <span className="text-zinc-300">•</span>
            <span>Monochrome studio proofing platform</span>
          </div>

          <div className="flex items-center space-x-6 text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition">Features</a>
            <a href="#workflow" className="hover:text-zinc-900 transition">Workflow</a>
            <a href="#pricing" className="hover:text-zinc-900 transition">Pricing</a>
            <Link to="/login" className="hover:text-zinc-900 transition">Studio Portal</Link>
          </div>

          <div>
            © {new Date().getFullYear()} FrameFlow Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
