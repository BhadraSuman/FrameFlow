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
  const { authFetch, user } = useAuth();
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [pin, setPin] = useState('0000');
  const [maxSelections, setMaxSelections] = useState('');
  const [enableWatermark, setEnableWatermark] = useState(Boolean(user?.defaultWatermark));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const randomizePin = () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const eventTypes = [
    { label: 'Wedding', icon: Heart, color: 'text-zinc-200 bg-zinc-800 border-zinc-700' },
    { label: 'Pre-Wedding', icon: Sparkles, color: 'text-iris-300 bg-iris-500/10 border-iris-500/30' },
    { label: 'Sangeet', icon: PartyPopper, color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    { label: 'Corporate', icon: Briefcase, color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' },
    { label: 'School / College', icon: GraduationCap, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
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
          pin,
          maxSelections: maxSelections ? parseInt(maxSelections, 10) : null,
          enableWatermark
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
      <div className="w-full max-w-4xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col lg:flex-row">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-iris-600/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        {/* Form Column */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-iris-300 font-medium uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Gallery Wizard</span>
              </div>
              <h2 className="text-2xl font-normal font-serif text-white tracking-tight">Create Client Gallery</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-850/60 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Priya & Rohan Wedding"
                className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
              />
            </div>

            {/* Event Category Pills */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
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
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition ${
                        isSelected
                          ? `${t.color} shadow-sm font-medium`
                          : 'bg-[#18181B] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
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
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Client Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Client Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Event Date & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Security PIN
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-medium text-zinc-100 tracking-widest outline-none transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={randomizePin}
                    title="Generate Random PIN"
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selection Limits & Watermarking Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Max Photos to Select <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50 (empty for unlimited)"
                  value={maxSelections}
                  onChange={(e) => setMaxSelections(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-800 focus:border-iris-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Clients will see a real-time selection quota tracker.
                </p>
              </div>

              <div className="flex flex-col justify-start">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Proofing Watermark
                </label>
                <label className="flex items-center space-x-3 bg-[#18181B] border border-zinc-800 hover:border-zinc-700 rounded-lg px-3.5 py-2 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                    className="w-4 h-4 rounded text-iris-600 focus:ring-iris-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-zinc-200 block">Apply Studio Watermark</span>
                    <span className="text-[11px] text-zinc-500">Watermark 1600px preview images</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 text-white text-xs font-medium shadow-sm shadow-iris-600/30 transition disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Creating...' : 'Launch Gallery & Upload'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column (Editorial Card) */}
        <div className="hidden lg:flex w-80 bg-[#09090B] p-8 border-l border-zinc-800 flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest block">
              Live Invitation Preview
            </span>

            {/* Simulated Client Card */}
            {(() => {
              const activeType = eventTypes.find((t) => t.label === eventType) || eventTypes[0];
              const ActiveIcon = activeType.icon;
              return (
                <div className="rounded-xl bg-[#121214] border border-zinc-800 p-5 shadow-lg relative overflow-hidden text-center">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mx-auto mb-3 ${activeType.color}`}>
                    <ActiveIcon className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider">
                    {eventType}
                  </span>
                  <h4 className="text-base font-normal text-white mt-1 font-serif">
                    {title || 'Couple / Event Name'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    For {clientName || 'Honored Client'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span>Access PIN:</span>
                    <span className="font-mono font-medium text-zinc-200 tracking-wider">
                      {pin || '••••'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Once created, you can drag & drop photos. Clients enter this PIN to access their private proofing gallery.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium border border-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
