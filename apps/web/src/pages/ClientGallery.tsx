import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  KeyRound,
  Lock,
  Send,
  Sparkles,
  X
} from 'lucide-react';

interface PhotoItem {
  id: string;
  originalFilename: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  status: string;
  width: number | null;
  height: number | null;
  fileSizeBytes: number;
}

interface EventMeta {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  clientName: string;
  status: string;
  roundStatus: string;
}

export const ClientGallery: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // State
  const [eventMeta, setEventMeta] = useState<EventMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [shake, setShake] = useState(false);

  // Gallery state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Submit modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Refs for 4-digit PIN auto-advance
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Load public event info
  useEffect(() => {
    if (!slug) return;
    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/galleries/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setEventMeta(data);
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, [slug]);

  // Load photos once unlocked
  const loadPhotos = async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/galleries/${slug}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        setSelectedIds(data.selectedMediaIds || []);
        if (data.event) {
          setEventMeta(data.event);
          if (data.event.roundStatus === 'SUBMITTED') {
            setSubmitted(true);
          }
        }
      }
    } catch (err) {
      console.error('Error loading gallery photos:', err);
    }
  };

  // Handle PIN digit input with auto-advance
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...pinDigits];
    newDigits[index] = char;
    setPinDigits(newDigits);
    setPinError('');

    if (char && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    // Auto submit if all 4 digits entered
    if (char && index === 3 && newDigits.every((d) => d !== '')) {
      verifyPin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = async (pinValue?: string) => {
    const pin = pinValue || pinDigits.join('');
    if (pin.length !== 4) {
      setPinError('Please enter all 4 digits');
      return;
    }

    setVerifyingPin(true);
    setPinError('');

    try {
      const res = await fetch(`/api/galleries/${slug}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (res.ok) {
        setIsUnlocked(true);
        loadPhotos();
      } else {
        const data = await res.json();
        setPinError(data.error || 'Incorrect PIN. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPinDigits(['', '', '', '']);
        pinInputRefs[0].current?.focus();
      }
    } catch (err) {
      setPinError('Unable to connect. Please check your internet connection.');
    } finally {
      setVerifyingPin(false);
    }
  };

  // Toggle selection
  const toggleSelection = (photoId: string) => {
    if (submitted) return; // Locked after submission
    setSelectedIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Submit selections
  const handleSubmitSelections = async () => {
    if (!slug) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${slug}/selections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMediaIds: selectedIds,
          clientNotes
        })
      });

      if (res.ok) {
        setSubmitted(true);
        setIsSubmitModalOpen(false);
      }
    } catch (err) {
      console.error('Error submitting selections:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDownNav = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      } else if (e.key === 'ArrowRight' && lightboxIndex < filteredPhotos.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      } else if (e.key === ' ' || e.key === 's') {
        e.preventDefault();
        const currentPhoto = filteredPhotos[lightboxIndex];
        if (currentPhoto) toggleSelection(currentPhoto.id);
      }
    };

    window.addEventListener('keydown', handleKeyDownNav);
    return () => window.removeEventListener('keydown', handleKeyDownNav);
  }, [lightboxIndex, photos, selectedIds, filterMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400 font-medium">Opening your private gallery...</p>
      </div>
    );
  }

  if (!eventMeta) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
        <Camera className="w-12 h-12 text-zinc-600 mb-3" />
        <h2 className="text-xl font-bold text-white">Gallery Not Found</h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-sm">
          The link you followed may be incorrect, expired, or removed by the studio.
        </p>
      </div>
    );
  }

  const filteredPhotos =
    filterMode === 'selected'
      ? photos.filter((p) => selectedIds.includes(p.id))
      : photos;

  // =========================================================================
  // VIEW 1: PIN CHALLENGE SCREEN (CINEMATIC LUXURY WEDDING THEME)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center p-6 relative overflow-hidden selection:bg-rose-500 selection:text-white">
        {/* Subtle Ambient Backlight Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Studio Watermark */}
        <div className="pt-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Royal Weddings Photography</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
            {eventMeta.title}
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Curated for <span className="text-white font-medium">{eventMeta.clientName}</span> •{' '}
            {new Date(eventMeta.eventDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Center PIN Authentication Card */}
        <div
          className={`w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center transition ${
            shake ? 'animate-shake' : ''
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-900/20">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">Enter Gallery PIN</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Please enter the 4-digit security PIN provided in your invitation to view your photos.
          </p>

          {/* 4 Digit Boxes */}
          <div className="mt-8 flex justify-center space-x-3 sm:space-x-4">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={pinInputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-mono font-extrabold bg-zinc-950 border-2 border-zinc-800 focus:border-rose-500 rounded-2xl text-white outline-none transition shadow-inner"
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 font-medium mt-3 animate-fadeIn">
              {pinError}
            </p>
          )}

          <button
            onClick={() => verifyPin()}
            disabled={verifyingPin}
            className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm shadow-xl shadow-rose-900/40 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{verifyingPin ? 'Unlocking...' : 'Unlock Private Gallery'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pb-6 text-center text-xs text-zinc-500 relative z-10">
          Private Client Selection Portal • Protected by FrameFlow
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNLOCKED EDITORIAL CLIENT GALLERY
  // =========================================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Gallery Header Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate mr-4">
            <div className="w-9 h-9 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold text-white truncate tracking-tight">
                {eventMeta.title}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                {eventMeta.clientName} • {photos.length} Photos
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterMode === 'all'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({photos.length})
            </button>
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                filterMode === 'selected'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${selectedIds.length > 0 ? 'fill-current' : ''}`} />
              <span>Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-32">
        {/* Submitted Status Toast */}
        {submitted && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 flex items-center justify-between text-xs sm:text-sm shadow-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Selections Submitted!</strong> You chose {selectedIds.length} photos. Your photographer has been notified and is preparing the final album.
              </span>
            </div>
          </div>
        )}

        {/* Empty Filter State */}
        {filteredPhotos.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800/80">
            <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No photos match your filter</h3>
            <p className="text-xs text-zinc-400 mt-1">
              {filterMode === 'selected'
                ? "You haven't selected any favorite photos yet. Tap the heart on photos to add them to your selection."
                : 'No photos have been uploaded to this gallery yet.'}
            </p>
            {filterMode === 'selected' && (
              <button
                onClick={() => setFilterMode('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition"
              >
                Browse All Photos
              </button>
            )}
          </div>
        )}

        {/* Responsive Photo Grid (Masonry feel) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredPhotos.map((photo, index) => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                className={`group relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer shadow-lg ${
                  isSelected
                    ? 'border-rose-500 ring-4 ring-rose-500/20 scale-[0.98]'
                    : 'border-zinc-800/80 hover:border-zinc-600'
                }`}
              >
                {/* 400px WebP Thumbnail */}
                {photo.thumbnailUrl ? (
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.originalFilename}
                    loading="lazy"
                    onClick={() => setLightboxIndex(index)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 bg-zinc-950">
                    Processing...
                  </div>
                )}

                {/* Heart / Selection Toggle Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(photo.id);
                  }}
                  disabled={submitted}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-xl transition transform active:scale-90 ${
                    isSelected
                      ? 'bg-rose-600 text-white scale-110 shadow-rose-900/50'
                      : 'bg-black/60 text-white/80 hover:bg-black/80 hover:text-white'
                  }`}
                  title={isSelected ? 'Remove from selection' : 'Select this photo'}
                >
                  <Heart className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                </button>

                {/* Filename Overlay on Hover */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  <p className="text-[11px] text-white font-medium truncate">
                    {photo.originalFilename}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Glass Action Dock (Bottom Bar) */}
      <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40">
        <div className="bg-zinc-900/90 border border-zinc-700/60 rounded-3xl p-3 px-5 shadow-2xl backdrop-blur-xl flex items-center justify-between space-x-6 min-w-[320px] sm:min-w-[440px]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-rose-400 font-extrabold text-base sm:text-lg">
                {selectedIds.length}
              </span>
              <span className="text-xs text-zinc-300 font-semibold">
                of {photos.length} Photos Selected
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {submitted ? 'Selection locked & submitted' : 'Tap photos to add or remove'}
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={selectedIds.length === 0 || submitted}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-900/40 transition hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitted ? 'Submitted' : 'Submit Selection'}</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal (High-Res 1600px WebP Preview + Filmstrip) */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-4 py-2">
            <span className="font-medium text-white">
              {filteredPhotos[lightboxIndex].originalFilename}
            </span>
            <div className="flex items-center space-x-4">
              <span>
                {lightboxIndex + 1} of {filteredPhotos.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div className="relative flex-1 flex items-center justify-center p-2">
            {/* Prev Button */}
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition z-20 shadow-xl border border-zinc-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {lightboxIndex < filteredPhotos.length - 1 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition z-20 shadow-xl border border-zinc-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <img
              src={
                filteredPhotos[lightboxIndex].previewUrl ||
                filteredPhotos[lightboxIndex].thumbnailUrl ||
                ''
              }
              alt=""
              className="max-h-[70vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Lightbox Bottom Controls & Filmstrip */}
          <div className="py-2 flex flex-col items-center space-y-3">
            {/* Selection Toggle Button */}
            <button
              onClick={() => toggleSelection(filteredPhotos[lightboxIndex].id)}
              disabled={submitted}
              className={`px-5 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition shadow-xl ${
                selectedIds.includes(filteredPhotos[lightboxIndex].id)
                  ? 'bg-rose-600 text-white shadow-rose-900/50'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  selectedIds.includes(filteredPhotos[lightboxIndex].id) ? 'fill-current' : ''
                }`}
              />
              <span>
                {selectedIds.includes(filteredPhotos[lightboxIndex].id)
                  ? 'Selected for Album'
                  : 'Add to Selection'}
              </span>
            </button>

            {/* Mini Filmstrip */}
            <div className="flex items-center space-x-2 overflow-x-auto max-w-2xl px-4 py-1">
              {filteredPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    idx === lightboxIndex
                      ? 'border-rose-500 scale-105'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={p.thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white tracking-tight">Submit Your Selection</h3>
            <p className="text-xs text-zinc-400 mt-1">
              You are submitting <strong>{selectedIds.length} chosen photos</strong> to your photographer.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Notes for the Photographer (Optional)
              </label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="e.g. Please use photo #12 for the full double spread..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSelections}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-lg shadow-rose-900/30 flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
