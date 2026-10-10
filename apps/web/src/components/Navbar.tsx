import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Plus, HardDrive, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNewEventClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewEventClick }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isClientView = location.pathname.startsWith('/gallery');
  const isAuthView = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingView = location.pathname === '/';

  if (isClientView || isAuthView || isLandingView) {
    return null; // Client view, Auth view, and Landing page have their own bespoke layouts
  }

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FF';

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-lg bg-iris-600 flex items-center justify-center text-white shadow-sm shadow-iris-600/30 group-hover:bg-iris-500 transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base text-zinc-900 tracking-tight">FrameFlow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-iris-50 text-iris-700 border border-iris-200">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 -mt-0.5 truncate max-w-[200px] sm:max-w-xs font-normal">
              {user?.studioName || 'Royal Weddings Photography'}
            </p>
          </div>
        </Link>

        {/* Studio Storage & User Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <div className="text-zinc-700 flex items-center space-x-1.5">
              <span className="font-medium text-zinc-900">Storage</span>
              <span className="text-zinc-300">•</span>
              <span className="text-emerald-600 font-medium">AWS S3 / R2</span>
            </div>
          </div>

          {onNewEventClick && user && (
            <button
              onClick={onNewEventClick}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 text-white text-xs font-medium shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Event</span>
            </button>
          )}

          {/* User Profile Pill & Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200">
              <div
                title={`${user.fullName} (${user.email})`}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center text-xs font-medium font-mono"
              >
                {initials}
              </div>

              <button
                onClick={logout}
                title="Log Out of Studio"
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium border border-zinc-200 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
