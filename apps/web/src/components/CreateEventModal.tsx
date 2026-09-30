import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, KeyRound, Calendar, Mail, User, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [pin, setPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const randomizePin = () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !clientEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          eventType,
          eventDate,
          clientName,
          clientEmail
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Create New Event Gallery</span>
              <Sparkles className="w-4 h-4 text-rose-400" />
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Set up a private proofing gallery for your client
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Priya & Rohan Wedding"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          {/* Event Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Event Type
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none transition"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Pre-Wedding">Pre-Wedding</option>
                  <option value="Sangeet">Sangeet / Mehendi</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Corporate">Corporate Event</option>
                  <option value="School / College">School / College</option>
                  <option value="Maternity / Baby">Maternity / Baby</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Event Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Client Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Client Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 4-Digit Security PIN */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Client Access PIN</p>
                  <p className="text-lg font-mono font-bold text-white tracking-widest">{pin}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={randomizePin}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 transition flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Randomize</span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-900/40 transition disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Launch Event Studio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
