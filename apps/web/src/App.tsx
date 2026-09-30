import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  Eye,
  KeyRound,
  Sparkles,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Send,
  Lock,
  Layers
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  clientName: string;
  pin?: string;
  status: string;
  photoCount: number;
}

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

interface UploadProgressItem {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: 'presigning' | 'uploading' | 'processing' | 'ready' | 'failed';
  error?: string;
  thumbnailUrl?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'agency' | 'client'>('agency');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);

  // Agency Uploader State
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client Gallery State
  const [clientPin, setClientPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoItem[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [clientRoundStatus, setClientRoundStatus] = useState('OPEN');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Load events
  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !currentEvent) {
          setCurrentEvent(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Poll for current event photos when in agency tab
  useEffect(() => {
    if (!currentEvent) return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/events/${currentEvent.id}`);
        if (res.ok) {
          const data = await res.json();
          // Map to uploadQueue statuses
          if (data.mediaItems) {
            setUploadQueue((prev) => {
              const updated = [...prev];
              data.mediaItems.forEach((item: any) => {
                const existingIdx = updated.findIndex((u) => u.id === item.id);
                if (existingIdx !== -1) {
                  if (item.status === 'READY') {
                    updated[existingIdx].status = 'ready';
                    updated[existingIdx].progress = 100;
                  } else if (item.status === 'PROCESSING') {
                    updated[existingIdx].status = 'processing';
                  }
                }
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPhotos();
    const interval = setInterval(fetchPhotos, 3000);
    return () => clearInterval(interval);
  }, [currentEvent]);

  // Create Sample Event
  const createNewEvent = async () => {
    const title = `Wedding Event #${events.length + 1}`;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          eventType: 'Wedding',
          clientName: 'Aarav & Meera',
          clientEmail: 'aarav@example.com'
        })
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents((prev) => [newEvent, ...prev]);
        setCurrentEvent(newEvent);
        // Switch to client tab automatically prepared
        setClientPin(newEvent.pin);
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  // Direct-to-Storage Upload Pipeline
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentEvent) return;

    setIsUploading(true);
    const newItems: UploadProgressItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      filename: f.name,
      size: f.size,
      progress: 0,
      status: 'presigning'
    }));

    setUploadQueue((prev) => [...newItems, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const trackerId = newItems[i].id;

      try {
        // Step 1: Request presigned direct upload URL from API
        const presignRes = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: currentEvent.id,
            filename: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'image/jpeg'
          })
        });

        if (!presignRes.ok) throw new Error('Failed to get presigned URL');
        const presignData = await presignRes.json();
        const { mediaId, key, uploadUrl } = presignData;

        // Update with real mediaId
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === trackerId
              ? { ...item, id: mediaId, status: 'uploading', progress: 25 }
              : item
          )
        );

        // Step 2: Direct-to-storage PUT upload (Bypassing API server bandwidth!)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'image/jpeg'
          },
          body: file
        });

        if (!uploadRes.ok) throw new Error('Direct upload to storage failed');

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === mediaId
              ? { ...item, status: 'processing', progress: 75 }
              : item
          )
        );

        // Step 3: Inform API that upload completed -> API dispatches to Image Worker microservice
        const completeRes = await fetch('/api/uploads/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            key,
            eventId: currentEvent.id
          })
        });

        if (!completeRes.ok) throw new Error('Failed to notify upload completion');

        // Worker takes over in background (resizing to 400px thumbnail & 1600px preview)
        // Polling will update status to 'ready'
      } catch (err: any) {
        console.error(`Upload failed for ${file.name}:`, err);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === trackerId
              ? { ...item, status: 'failed', error: err.message }
              : item
          )
        );
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Client Portal: Load Gallery Photos
  const loadGalleryPhotos = async (slug: string) => {
    try {
      const res = await fetch(`/api/galleries/${slug}/photos`);
      if (res.ok) {
        const data = await res.json();
        setGalleryPhotos(data.photos || []);
        setSelectedPhotoIds(data.selectedMediaIds || []);
        setClientRoundStatus(data.event.roundStatus || 'OPEN');
      }
    } catch (err) {
      console.error('Failed to load gallery photos:', err);
    }
  };

  // Client Portal: Verify PIN
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !clientPin) return;

    setPinError('');
    try {
      const res = await fetch(`/api/galleries/${currentEvent.slug}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clientPin })
      });

      if (res.ok) {
        setIsUnlocked(true);
        loadGalleryPhotos(currentEvent.slug);
      } else {
        const data = await res.json();
        setPinError(data.error || 'Invalid PIN');
      }
    } catch (err) {
      setPinError('Connection error. Please try again.');
    }
  };

  // Client Portal: Toggle selection
  const togglePhotoSelection = (photoId: string) => {
    if (clientRoundStatus === 'SUBMITTED') return; // Locked
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Client Portal: Submit selection
  const handleSubmitSelection = async () => {
    if (!currentEvent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/galleries/${currentEvent.slug}/selections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMediaIds: selectedPhotoIds,
          clientNotes: 'Selected favorite photos for the main album'
        })
      });

      if (res.ok) {
        setClientRoundStatus('SUBMITTED');
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error submitting selections:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-600 p-2 rounded-xl text-white shadow-lg shadow-rose-900/40">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">FrameFlow</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">
                MVP Prototype
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('agency')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'agency'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Photographer Studio</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('client');
                if (currentEvent) {
                  loadGalleryPhotos(currentEvent.slug);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'client'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Client Selection Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ========================================================================= */}
        {/* TAB 1: PHOTOGRAPHER STUDIO & DIRECT-TO-STORAGE UPLOADER */}
        {/* ========================================================================= */}
        {activeTab === 'agency' && (
          <div className="space-y-6">
            {/* Event Header & Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Current Event Project</span>
                </div>
                <h1 className="text-2xl font-bold text-white mt-1">
                  {currentEvent ? currentEvent.title : 'No event created yet'}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Client: {currentEvent?.clientName || 'N/A'} • PIN:{' '}
                  <span className="font-mono font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                    {currentEvent?.pin || '••••'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={createNewEvent}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium border border-slate-700 transition flex items-center space-x-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>New Event</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('client');
                    if (currentEvent) {
                      setClientPin(currentEvent.pin || '');
                      setIsUnlocked(true);
                      loadGalleryPhotos(currentEvent.slug);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-rose-900/30 transition flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Client View</span>
                </button>
              </div>
            </div>

            {/* Architecture Explainer Badge */}
            <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-indigo-950/30 border border-rose-900/30 rounded-2xl p-4 flex items-start space-x-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">Direct-to-Storage & Microservice Architecture in Action:</span> Photos selected below bypass API server memory completely using direct presigned storage upload. Once uploaded, the dedicated <code className="text-rose-300 font-mono bg-rose-950/40 px-1 py-0.5 rounded">image-worker</code> microservice uses Sharp to generate 400px WebP thumbnails & 1600px previews in the background.
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500 bg-slate-900/50 hover:bg-slate-900 rounded-2xl p-8 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                className="hidden"
              />
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">Click or drag & drop photos here</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Select JPEG, PNG, or RAW photos from your computer to test the direct upload and Sharp resizing worker.
              </p>
              <div className="mt-4 inline-flex items-center text-xs text-rose-400 font-medium bg-rose-950/50 px-3 py-1 rounded-full border border-rose-800/40">
                Direct Cloudflare R2 / Storage Multipart Presigned Flow
              </div>
            </div>

            {/* Upload & Processing Queue Tracker */}
            {uploadQueue.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">Upload & Microservice Queue</h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      {uploadQueue.length} files
                    </span>
                  </div>
                  {isUploading && (
                    <span className="flex items-center space-x-1.5 text-xs text-rose-400 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading directly to storage...</span>
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-850/50 transition">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                          {item.status === 'ready' ? (
                            <img
                              src={`/api/storage/files?key=thumbnails/${currentEvent?.id}/${item.id}.webp`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-5 h-5" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate">{item.filename}</p>
                          <p className="text-xs text-slate-400">
                            {(item.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {item.status === 'presigning' && (
                          <span className="text-xs text-slate-400">Presigning...</span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-xs text-amber-400 font-medium flex items-center space-x-1">
                            <Upload className="w-3.5 h-3.5 animate-pulse" />
                            <span>Direct Uploading</span>
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-xs text-indigo-400 font-medium flex items-center space-x-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sharp Worker Processing</span>
                          </span>
                        )}
                        {item.status === 'ready' && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Ready (WebP 400 & 1600)</span>
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-xs text-rose-400 font-medium">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CLIENT SELECTION PORTAL */}
        {/* ========================================================================= */}
        {activeTab === 'client' && (
          <div className="space-y-6">
            {/* PIN Challenge Screen (if locked) */}
            {!isUnlocked ? (
              <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-900/30">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Private Client Gallery</h2>
                <p className="text-sm text-slate-400 mt-2">
                  Please enter the 4-digit PIN provided by your photographer to view and select your event photos.
                </p>

                <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={6}
                      value={clientPin}
                      onChange={(e) => setClientPin(e.target.value)}
                      placeholder="Enter PIN (e.g. 1234)"
                      className="w-full text-center text-2xl tracking-widest font-mono bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-white outline-none transition"
                    />
                    {pinError && <p className="text-xs text-rose-400 mt-1.5">{pinError}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-rose-900/30 transition flex items-center justify-center space-x-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Unlock Gallery</span>
                  </button>
                </form>

                {currentEvent?.pin && (
                  <div className="mt-6 text-xs text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    💡 <span className="text-slate-400">Demo Hint:</span> Current event PIN is{' '}
                    <span className="font-mono text-rose-400 font-semibold">{currentEvent.pin}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Unlocked Gallery View */
              <div className="space-y-6">
                {/* Gallery Header & Live Counter Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 z-30 shadow-lg backdrop-blur">
                  <div>
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Proofing Gallery
                    </span>
                    <h1 className="text-2xl font-bold text-white mt-0.5">
                      {currentEvent?.title || 'Event Gallery'}
                    </h1>
                    <p className="text-xs text-slate-400">
                      Select photos by tapping the checkmark. Click on any photo to preview in high resolution.
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        <span className="text-rose-400 text-lg font-bold">{selectedPhotoIds.length}</span> /{' '}
                        {galleryPhotos.length} Selected
                      </div>
                      <div className="text-xs text-slate-400">
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            clientRoundStatus === 'SUBMITTED' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {clientRoundStatus === 'SUBMITTED' ? 'Selections Submitted' : 'Selection Open'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitSelection}
                      disabled={isSubmitting || clientRoundStatus === 'SUBMITTED' || selectedPhotoIds.length === 0}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-900/30 transition flex items-center space-x-2 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>{clientRoundStatus === 'SUBMITTED' ? 'Submitted' : 'Submit Selections'}</span>
                    </button>
                  </div>
                </div>

                {/* Submission Success Toast */}
                {submissionSuccess && (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl flex items-center space-x-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Your selection of {selectedPhotoIds.length} photos has been sent to the photographer!</span>
                  </div>
                )}

                {/* Empty State */}
                {galleryPhotos.length === 0 && (
                  <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-300">No photos in this gallery yet</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Switch to the "Photographer Studio" tab to upload your first batch of photos.
                    </p>
                  </div>
                )}

                {/* Responsive Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {galleryPhotos.map((photo, index) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                          isSelected ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {/* 400px WebP Thumbnail */}
                        {photo.thumbnailUrl ? (
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.originalFilename}
                            loading="lazy"
                            onClick={() => setLightboxIndex(index)}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                            Processing...
                          </div>
                        )}

                        {/* Selection Checkmark Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo.id);
                          }}
                          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition ${
                            isSelected
                              ? 'bg-rose-600 text-white scale-110'
                              : 'bg-black/60 text-white/70 hover:bg-black/80 hover:text-white'
                          }`}
                        >
                          <CheckCircle className={`w-4 h-4 ${isSelected ? 'stroke-[2.5]' : ''}`} />
                        </button>

                        {/* Photo Name Label */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition">
                          <p className="text-[11px] text-white truncate font-medium">{photo.originalFilename}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox Modal (High-Res 1600px WebP Preview) */}
      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev Photo */}
          {lightboxIndex > 0 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Photo */}
          {lightboxIndex < galleryPhotos.length - 1 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image & Selection Toggle in Lightbox */}
          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center">
            <img
              src={galleryPhotos[lightboxIndex].previewUrl || galleryPhotos[lightboxIndex].thumbnailUrl || ''}
              alt=""
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm text-slate-300 font-medium">
                {galleryPhotos[lightboxIndex].originalFilename} ({lightboxIndex + 1} of {galleryPhotos.length})
              </span>
              <button
                onClick={() => togglePhotoSelection(galleryPhotos[lightboxIndex].id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  selectedPhotoIds.includes(galleryPhotos[lightboxIndex].id)
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {selectedPhotoIds.includes(galleryPhotos[lightboxIndex].id) ? 'Selected' : 'Select Photo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
