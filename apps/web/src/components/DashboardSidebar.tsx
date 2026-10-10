import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  CheckCircle,
  Settings,
  HardDrive,
  Plus,
  LogOut,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Layers,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardSidebarProps {
  onNewEventClick: () => void;
  onOpenSettings: () => void;
  storageMB?: number;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  onNewEventClick,
  onOpenSettings,
  storageMB = 0,
  activeFilter = 'ALL',
  onFilterChange
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboard';

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FF';

  const storageGB = storageMB / 1024;
  const storagePercentage = Math.min(100, Math.max(3, (storageMB / 5120) * 100));

  const handleNavFilter = (filterKey: string) => {
    if (!isDashboard) {
      navigate('/dashboard');
    }
    if (onFilterChange) {
      onFilterChange(filterKey);
    }
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
        <NavLink
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-iris-600 flex items-center justify-center text-white shadow-sm shadow-iris-600/30 group-hover:bg-iris-500 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-base text-zinc-900 tracking-tight font-sans">FrameFlow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-iris-50 text-iris-700 border border-iris-100">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate max-w-[145px] font-normal">
              {user?.studioName || 'Photographer Studio'}
            </p>
          </div>
        </NavLink>

        {/* Mobile close toggle */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 pb-2">
        <button
          onClick={() => {
            setMobileOpen(false);
            onNewEventClick();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white font-medium text-xs shadow-sm shadow-iris-600/20 transition group"
        >
          <Plus className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* Core Navigation */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavFilter('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isDashboard && activeFilter === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>All Galleries</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 opacity-60 ${
                  isDashboard && activeFilter === 'ALL' ? 'text-zinc-400' : 'text-zinc-400'
                }`}
              />
            </button>

            <button
              onClick={() => handleNavFilter('SUBMITTED')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isDashboard && activeFilter === 'SUBMITTED'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Selections Received</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isDashboard && activeFilter === 'SUBMITTED'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Ready
              </span>
            </button>

            <button
              onClick={() => handleNavFilter('ACTIVE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isDashboard && activeFilter === 'ACTIVE'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-iris-500" />
                <span>Active Proofing</span>
              </div>
            </button>

            <button
              onClick={() => handleNavFilter('WEDDING')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isDashboard && activeFilter === 'WEDDING'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Weddings</span>
              </div>
            </button>
          </div>
        </div>

        {/* Studio Branding & Settings */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Studio Controls
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-zinc-500" />
                <span>Studio Branding</span>
              </div>
              <span className="text-[10px] text-iris-600 bg-iris-50 px-1.5 py-0.5 rounded font-mono border border-iris-100">
                White-label
              </span>
            </button>

            <NavLink
              to="/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              <div className="flex items-center space-x-2.5">
                <ExternalLink className="w-4 h-4 text-zinc-400" />
                <span>Public Portal</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Sandbox Notice (if demo user) */}
        {user?.isDemo && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl">
            <div className="flex items-center space-x-1.5 text-amber-800 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>24h Demo Sandbox</span>
            </div>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Files and events automatically purge 24 hours after creation.
            </p>
          </div>
        )}

        {/* Storage Meter Widget */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-700 flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              <span>Cloud Storage</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {storageMB < 1024 ? `${storageMB.toFixed(0)} MB` : `${storageGB.toFixed(2)} GB`} / 5 GB
            </span>
          </div>

          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-iris-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
            <span className="text-emerald-600 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero-Egress S3/R2</span>
            </span>
            <span>Free Tier</span>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            {user?.studioLogoUrl ? (
              <img
                src={user.studioLogoUrl}
                alt="Studio Logo"
                className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-mono font-medium shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 truncate">
                {user?.fullName || 'Photographer'}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {user?.email || 'photographer@frameflow.test'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out of Studio"
            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar with Toggle Button */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-iris-600 flex items-center justify-center text-white">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm text-zinc-900">FrameFlow</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNewEventClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-iris-600 text-white text-xs font-medium shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg border border-zinc-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideRight">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
