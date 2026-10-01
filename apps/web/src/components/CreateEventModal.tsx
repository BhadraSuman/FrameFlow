import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, KeyRound, Calendar, Mail, User, Heart, Briefcase, GraduationCap, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (newEvent: any) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [pin, setPin] = useState('0000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const randomizePin = () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const eventTypes = [
    { label: 'Wedding', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { label: 'Pre-Wedding', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { label: 'Sangeet', icon: PartyPopper, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { label: 'Corporate', icon: Briefcase, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { label: 'School / College', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !clientEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          eventType,
          eventDate,
          clientName,
          clientEmail,
          pin
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create event');
      }

      const newEvent = await res.json();
      if (onEventCreated) {
        onEventCreated(newEvent);
      }
      onClose();
      navigate(`/events/${newEvent.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col lg:flex-row">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        {/* Form Column */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Project</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create Client Gallery</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Priya & Rohan Wedding"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition"
              />
            </div>

            {/* Event Category Pills */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = eventType === t.label;
                  return (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setEventType(t.label)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isSelected
                          ? `${t.color} shadow-sm font-semibold scale-105`
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Client Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Client Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Event Date & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Security PIN
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold text-rose-400 tracking-widest outline-none transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={randomizePin}
                    title="Generate Random PIN"
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Creating...' : 'Launch Studio & Upload'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column (Editorial Card) */}
        <div className="hidden lg:flex w-80 bg-zinc-950 p-8 border-l border-zinc-800 flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
              Live Invitation Preview
            </span>

            {/* Simulated Client Card */}
            {(() => {
              const activeType = eventTypes.find((t) => t.label === eventType) || eventTypes[0];
              const ActiveIcon = activeType.icon;
              return (
                <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-xl relative overflow-hidden text-center">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-3 ${activeType.color}`}>
                    <ActiveIcon className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">
                    {eventType}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1 font-serif">
                    {title || 'Couple / Event Name'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    For {clientName || 'Honored Client'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                    <span>Access PIN:</span>
                    <span className="font-mono font-bold text-rose-400 tracking-wider">
                      {pin || '••••'}
                    </span>
                  </div>
                </div>
              );
            })()}


            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Once created, you can instantly drag & drop hundreds of photos. The client will use this PIN to access their proofing gallery.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
