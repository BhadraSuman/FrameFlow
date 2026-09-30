import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Plus, HardDrive } from 'lucide-react';

interface NavbarProps {
  onNewEventClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewEventClick }) => {
  const location = useLocation();
  const isClientView = location.pathname.startsWith('/gallery');

  if (isClientView) {
    return null; // Client view has its own dedicated editorial header
  }

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform duration-200">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">FrameFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Agency Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 -mt-0.5">Royal Weddings & Events</p>
          </div>
        </Link>

        {/* Studio Storage & Quick Action */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            <div className="text-zinc-300">
              <span className="font-semibold text-white">Cloudflare R2</span>
              <span className="text-zinc-500 mx-1.5">•</span>
              <span className="text-emerald-400 font-medium">Active (Zero Egress)</span>
            </div>
          </div>

          {onNewEventClick && (
            <button
              onClick={onNewEventClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-900/30 transition hover:shadow-rose-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
