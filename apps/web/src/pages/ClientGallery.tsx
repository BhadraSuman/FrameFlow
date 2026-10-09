import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
  X,
  Grid3X3,
  LayoutGrid,
  Maximize2
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

interface StudioInfo {
  studioName: string;
  studioLogoUrl?: string | null;
  brandColor?: string | null;
  instagramHandle?: string | null;
  websiteUrl?: string | null;
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
  maxSelections?: number | null;
  enableWatermark?: boolean;
  studio?: StudioInfo;
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
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Gallery state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5>(4);
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
        setPinError(data.error || 'Incorrect PIN. Try 0000 for test access.');
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

  // Toggle selection with micro-interaction and limit enforcement
  const toggleSelection = (photoId: string) => {
    if (submitted) return; // Locked after submission

    setSelectedIds((prev) => {
      const isAlreadySelected = prev.includes(photoId);
      if (isAlreadySelected) {
        return prev.filter((id) => id !== photoId);
      }

      // Check max limit
      if (eventMeta?.maxSelections && prev.length >= eventMeta.maxSelections) {
        setLimitNotice(`Package limit reached! You can select up to ${eventMeta.maxSelections} photos.`);
        setTimeout(() => setLimitNotice(null), 3500);
        return prev;
      }

      return [...prev, photoId];
    });
  };

  // Submit selections with Confetti celebration
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

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore
        }
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
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-center p-4">
        <div className="w-8 h-8 border-2 border-iris-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-zinc-500 font-normal">Opening your private gallery...</p>
      </div>
    );
  }

  if (!eventMeta) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center text-center p-4">
        <Camera className="w-10 h-10 text-zinc-400 mb-3" />
        <h2 className="text-xl font-normal text-zinc-900 font-serif">Gallery Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
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
  // VIEW 1: PIN CHALLENGE SCREEN (C1 · CLIENT PIN ENTRY / DESKTOP & MOBILE)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col justify-between items-center p-6 relative overflow-hidden selection:bg-iris-600 selection:text-white">
        {/* Subtle Ambient Backlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-iris-600/5 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Studio Watermark */}
        <div className="pt-10 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 text-zinc-700 text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 mb-3.5 shadow-xs">
            {eventMeta.studio?.studioLogoUrl ? (
              <img src={eventMeta.studio.studioLogoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-iris-600" />
            )}
            <span>{eventMeta.studio?.studioName || 'Royal Weddings Photography'}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-zinc-900 max-w-2xl mx-auto font-serif">
            {eventMeta.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2">
            Curated for <span className="text-zinc-800 font-medium">{eventMeta.clientName}</span> •{' '}
            {new Date(eventMeta.eventDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Center PIN Authentication Card */}
        <div
          className={`w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-8 sm:p-9 shadow-xl relative z-10 text-center transition ${
            shake ? 'animate-shake' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-5 h-5 text-zinc-500" />
          </div>

          <h2 className="text-2xl font-normal text-zinc-900 tracking-tight font-serif">Enter Gallery PIN</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Please enter the 4-digit security PIN provided in your invitation to view your photos.
          </p>

          {/* 4 Digit Boxes */}
          <div className="mt-7 flex justify-center space-x-3 sm:space-x-4">
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
                className="w-13 h-16 sm:w-16 sm:h-20 text-center text-3xl font-mono font-medium bg-zinc-50 border border-zinc-200 focus:border-iris-600 rounded-xl text-zinc-900 outline-none transition"
              />
            ))}
          </div>

          {/* Test PIN Quick Fill Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setPinDigits(['0', '0', '0', '0']);
                verifyPin('0000');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-normal bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-3 py-1 rounded-full transition inline-flex items-center space-x-1.5"
            >
              <span>⚡ Test Mode: Click to auto-fill 0000</span>
            </button>
          </div>

          {pinError && (
            <p className="text-xs text-red-500 font-medium mt-3.5 animate-fadeIn">
              {pinError}
            </p>
          )}

          <button
            onClick={() => verifyPin()}
            disabled={verifyingPin}
            className="w-full mt-6 py-2.5 px-5 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 text-white font-medium text-xs shadow-sm shadow-iris-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{verifyingPin ? 'Unlocking...' : 'Unlock Private Gallery'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pb-8 text-center text-xs text-zinc-400 relative z-10">
          Private Client Selection Portal • Protected by FrameFlow
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNLOCKED EDITORIAL CLIENT GALLERY
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col selection:bg-iris-600 selection:text-white">
      {/* Top Editorial Sticky Header */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate mr-4">
            {eventMeta.studio?.studioLogoUrl ? (
              <img
                src={eventMeta.studio.studioLogoUrl}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-zinc-500" />
              </div>
            )}
            <div className="truncate">
              <h2 className="text-base font-normal text-zinc-900 truncate tracking-tight font-serif">
                {eventMeta.title}
              </h2>
              <p className="text-[11px] text-zinc-500 truncate">
                {eventMeta.studio?.studioName ? `${eventMeta.studio.studioName} • ` : ''}Curated for {eventMeta.clientName}
              </p>
            </div>
          </div>

          {/* Controls: Filter Pills & Grid View Switcher */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Grid density toggle (Desktop) */}
            <div className="hidden md:flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button
                onClick={() => setGridColumns(3)}
                title="3 Columns (Large)"
                className={`p-1.5 rounded-md transition ${
                  gridColumns === 3 ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridColumns(4)}
                title="4 Columns"
                className={`p-1.5 rounded-md transition ${
                  gridColumns === 4 ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filterMode === 'all'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All ({photos.length})
              </button>
              <button
                onClick={() => setFilterMode('selected')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                  filterMode === 'selected'
                    ? 'bg-iris-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${selectedIds.length > 0 ? 'fill-current' : ''}`} />
                <span>Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-36">
        {/* Luxury Editorial Hero Cover Banner (C2 · Story Cover) */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-zinc-200 p-6 sm:p-10 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-iris-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 text-zinc-700 text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-iris-600" />
                <span>
                  {eventMeta.studio?.studioName ? `${eventMeta.studio.studioName} • ` : ''}
                  {eventMeta.eventType} Collection
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-normal text-zinc-900 tracking-tight font-serif">
                {eventMeta.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl leading-relaxed">
                Welcome to your private proofing gallery. Tap the heart icon on your favorite photos to curate your bespoke album.
                {eventMeta.maxSelections && (
                  <span className="block mt-1 text-iris-700 font-medium">
                    Package allowance: {eventMeta.maxSelections} photos included.
                  </span>
                )}
              </p>
            </div>

            {/* Selection Progress Pill */}
            <div className="flex flex-col sm:items-end space-y-2 shrink-0 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
              <span className="text-[11px] uppercase tracking-wider font-medium text-zinc-500">
                {eventMeta.maxSelections ? 'Package Allowance' : 'Album Selection Progress'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-normal font-mono text-iris-600">
                  {selectedIds.length}
                </span>
                <span className="text-xs text-zinc-500">
                  / {eventMeta.maxSelections ? `${eventMeta.maxSelections} allowed` : `${photos.length} photos`}
                </span>
              </div>
              {eventMeta.maxSelections && (
                <div className="text-[10px] text-zinc-500">
                  {eventMeta.maxSelections - selectedIds.length > 0 ? (
                    <span className="text-emerald-600 font-medium">
                      {eventMeta.maxSelections - selectedIds.length} remaining
                    </span>
                  ) : eventMeta.maxSelections - selectedIds.length === 0 ? (
                    <span className="text-amber-600 font-medium">Limit reached</span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      {Math.abs(eventMeta.maxSelections - selectedIds.length)} over limit
                    </span>
                  )}
                </div>
              )}
              <div className="w-36 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-iris-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      eventMeta.maxSelections
                        ? (selectedIds.length / eventMeta.maxSelections) * 100
                        : photos.length
                        ? (selectedIds.length / photos.length) * 100
                        : 0
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Status Toast */}
        {submitted && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs sm:text-sm shadow-xs">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Selections Submitted!</strong> You chose {selectedIds.length} photos. Your photographer has received your selection list and is preparing the final album design.
              </span>
            </div>
          </div>
        )}

        {/* Empty Filter State */}
        {filteredPhotos.length === 0 && (
          <div className="text-center py-24 bg-white rounded-xl border border-zinc-200 p-8 shadow-xs">
            <Heart className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="text-base font-normal text-zinc-900 font-serif">No photos match your filter</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {filterMode === 'selected'
                ? "You haven't selected any favorite photos yet. Tap the heart icon on any photo to add it to your selection."
                : 'No photos have been uploaded to this gallery yet.'}
            </p>
            {filterMode === 'selected' && (
              <button
                onClick={() => setFilterMode('all')}
                className="mt-4 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition"
              >
                Browse All Photos
              </button>
            )}
          </div>
        )}

        {/* Responsive Photo Grid with Dynamic Density (C3 · Selection Grid) */}
        <div
          className={`grid gap-3 sm:gap-4 ${
            gridColumns === 3
              ? 'grid-cols-2 md:grid-cols-3'
              : gridColumns === 5
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          }`}
        >
          {filteredPhotos.map((photo, index) => {
            const isSelected = selectedIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className={`group relative aspect-square bg-zinc-100 rounded-[6px] overflow-hidden border transition-all duration-200 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-iris-600 ring-2 ring-iris-600/30'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* 400px WebP Thumbnail */}
                {photo.thumbnailUrl ? (
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.originalFilename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 bg-zinc-100">
                    Processing...
                  </div>
                )}

                {/* Heart / Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(photo.id);
                  }}
                  disabled={submitted}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition transform active:scale-75 ${
                    isSelected
                      ? 'bg-iris-600 text-white scale-105 shadow-iris-600/40 animate-heartPop'
                      : 'bg-black/40 text-white/90 hover:bg-black/70 hover:text-white border border-white/20'
                  }`}
                  title={isSelected ? 'Remove from selection' : 'Select this photo'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSelected ? 'fill-current' : ''}`} />
                </button>

                {/* Filename & Dimension Label on Hover */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  <p className="text-[11px] text-white font-medium truncate font-mono">
                    {photo.originalFilename}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Limit Notice Toast */}
      {limitNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-2xl animate-bounce flex items-center space-x-2">
          <span>⚠️ {limitNotice}</span>
        </div>
      )}

      {/* Floating Glass Action Dock (C3 · Client Bottom Bar) */}
      <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40">
        <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-3 px-5 shadow-2xl backdrop-blur-xl flex items-center justify-between space-x-6 min-w-[320px] sm:min-w-[440px]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-iris-600 font-normal text-lg sm:text-xl font-mono">
                {selectedIds.length}
              </span>
              <span className="text-xs sm:text-sm text-zinc-800 font-medium">
                {eventMeta.maxSelections
                  ? `of ${eventMeta.maxSelections} Max Allowed`
                  : `of ${photos.length} Photos Selected`}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              {submitted
                ? 'Selection locked & confirmed'
                : eventMeta.maxSelections
                ? selectedIds.length > eventMeta.maxSelections
                  ? `Over limit by ${selectedIds.length - eventMeta.maxSelections} photos`
                  : `${eventMeta.maxSelections - selectedIds.length} photo slots remaining`
                : 'Tap the heart icon to add or remove'}
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={selectedIds.length === 0 || submitted}
            className="px-4 py-2 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium shadow-sm shadow-iris-600/30 transition flex items-center space-x-2 shrink-0"
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
          <div className="flex items-center justify-between text-xs text-zinc-400 px-4 py-2 border-b border-zinc-900">
            <span className="font-medium text-white truncate max-w-sm">
              {filteredPhotos[lightboxIndex].originalFilename}
            </span>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-[11px] text-zinc-400">
                {lightboxIndex + 1} of {filteredPhotos.length}
              </span>
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                title="Toggle Fullscreen"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
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
                className="absolute left-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition z-20 shadow-xl border border-zinc-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {lightboxIndex < filteredPhotos.length - 1 && (
              <button
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white transition z-20 shadow-xl border border-zinc-700"
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
              className="max-h-[70vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Lightbox Bottom Controls & Filmstrip */}
          <div className="py-2 flex flex-col items-center space-y-3">
            {/* Selection Toggle Button */}
            <button
              onClick={() => toggleSelection(filteredPhotos[lightboxIndex].id)}
              disabled={submitted}
              className={`px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition shadow-xl ${
                selectedIds.includes(filteredPhotos[lightboxIndex].id)
                  ? 'bg-iris-600 text-white shadow-iris-900/50'
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
                  className={`w-12 h-12 rounded-[6px] overflow-hidden shrink-0 border-2 transition ${
                    idx === lightboxIndex
                      ? 'border-iris-500 scale-105'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-2xl relative text-zinc-900">
            <h3 className="text-xl font-normal text-zinc-900 tracking-tight font-serif">Submit Your Selection</h3>
            <p className="text-xs text-zinc-500 mt-1">
              You are submitting <strong className="text-zinc-800">{selectedIds.length} chosen photos</strong> to your photographer.
            </p>

            {/* Selected Photos Visual Preview Strip */}
            <div className="mt-4">
              <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Selected Photos ({selectedIds.length})
              </label>
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                {photos
                  .filter((p) => selectedIds.includes(p.id))
                  .slice(0, 6)
                  .map((p) => (
                    <img
                      key={p.id}
                      src={p.thumbnailUrl || ''}
                      alt=""
                      className="w-12 h-12 rounded-[6px] object-cover shrink-0 border border-zinc-200 shadow-xs"
                    />
                  ))}
                {selectedIds.length > 6 && (
                  <div className="w-12 h-12 rounded-[6px] bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-xs font-mono font-medium text-zinc-700">
                    +{selectedIds.length - 6}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider mb-1.5">
                Notes for the Photographer (Optional)
              </label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="e.g. Please use photo #12 for the full double spread..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 rounded-lg p-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition"
              />
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSelections}
                disabled={submitting || (eventMeta.maxSelections ? selectedIds.length > eventMeta.maxSelections : false)}
                className="px-4 py-2 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 text-white text-xs font-medium transition shadow-sm shadow-iris-600/30 flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio Branding Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10 px-4 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-800">
            {eventMeta.studio?.studioLogoUrl ? (
              <img src={eventMeta.studio.studioLogoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <Camera className="w-4 h-4 text-iris-600" />
            )}
            <span>{eventMeta.studio?.studioName || 'Royal Weddings Photography'}</span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-zinc-500">
            {eventMeta.studio?.instagramHandle && (
              <a
                href={`https://instagram.com/${eventMeta.studio.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-iris-600 transition"
              >
                @{eventMeta.studio.instagramHandle.replace('@', '')}
              </a>
            )}
            {eventMeta.studio?.websiteUrl && (
              <a
                href={eventMeta.studio.websiteUrl.startsWith('http') ? eventMeta.studio.websiteUrl : `https://${eventMeta.studio.websiteUrl}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-iris-600 transition"
              >
                Visit Website
              </a>
            )}
          </div>

          <p className="text-[11px] text-zinc-400">
            Private Client Selection Gallery • Powered by FrameFlow
          </p>
        </div>
      </footer>
    </div>
  );
};
