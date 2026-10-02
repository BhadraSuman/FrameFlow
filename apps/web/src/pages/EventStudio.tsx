import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Copy,
  Download,
  Eye,
  Heart,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Search,
  Share2,
  Upload,
  X,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  ExternalLink,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MediaItem {
  id: string;
  originalFilename: string;
  thumbnailKey: string | null;
  previewKey: string | null;
  storageKey?: string;
  status: string;
  width: number | null;
  height: number | null;
  fileSizeBytes: number;
  createdAt: string;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  pin?: string;
  status: string;
  photoCount: number;
  mediaItems: MediaItem[];
  selectionRounds: Array<{
    id: string;
    roundNumber: number;
    status: string;
    clientNotes?: string;
    selections: Array<{
      id: string;
      mediaItemId: string;
    }>;
  }>;
}

interface UploadProgressItem {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: 'presigning' | 'uploading' | 'processing' | 'ready' | 'failed';
  error?: string;
}

export const EventStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'SELECTED' | 'READY' | 'PROCESSING'>('ALL');
  const [gridCols, setGridCols] = useState<3 | 4 | 5>(4);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete event');
      }
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Could not delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEvent = async () => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    const interval = setInterval(loadEvent, 3000); // Polling for worker status updates
    return () => clearInterval(interval);
  }, [id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const startZipExport = async () => {
    if (!event) return;
    setZipLoading(true);
    try {
      const res = await authFetch(`/api/events/${event.id}/export/zip`, { method: 'POST' });
      if (res.ok) {
        const interval = setInterval(async () => {
          const statusRes = await authFetch(`/api/events/${event.id}/export/zip/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'COMPLETED' && statusData.downloadUrl) {
              clearInterval(interval);
              setZipLoading(false);
              setZipDownloadUrl(statusData.downloadUrl);
              window.open(statusData.downloadUrl, '_blank');
            } else if (statusData.status === 'FAILED') {
              clearInterval(interval);
              setZipLoading(false);
              alert(statusData.errorMessage || 'Failed to compile ZIP');
            }
          }
        }, 2000);
      } else {
        setZipLoading(false);
      }
    } catch (err) {
      console.error(err);
      setZipLoading(false);
    }
  };

  const copyLightroomQuery = async () => {
    if (!event) return;
    try {
      const res = await authFetch(`/api/events/${event.id}/export/lightroom`);
      if (res.ok) {
        const data = await res.json();
        navigator.clipboard.writeText(data.query);
        setCopiedKey('lightroom');
        setTimeout(() => setCopiedKey(null), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Direct-to-Storage Resumable Upload Flow
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || !event) return;

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
        // 1. Presign upload URL
        const presignRes = await authFetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            filename: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'image/jpeg'
          })
        });

        if (!presignRes.ok) throw new Error('Presigning failed');
        const presignData = await presignRes.json();
        const { mediaId, key, uploadUrl } = presignData;

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === trackerId
              ? { ...item, id: mediaId, status: 'uploading', progress: 30 }
              : item
          )
        );

        // 2. Direct upload to storage (R2/S3/Local)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
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

        // 3. Complete upload notification to API -> triggers Image Worker microservice
        const completeRes = await authFetch('/api/uploads/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            key,
            eventId: event.id
          })
        });

        if (!completeRes.ok) throw new Error('Failed to notify upload completion');

        // Polling will update status to 'READY'
      } catch (err: any) {
        console.error('Upload error:', err);
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
    loadEvent();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || !event) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        if (lightboxIndex < filteredPhotos.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (lightboxIndex > 0) {
          setLightboxIndex(lightboxIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, event]);

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-zinc-400">Loading Event Studio...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-bold text-white font-serif">Event not found</p>
        <Link to="/" className="text-rose-400 hover:underline text-sm mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const galleryUrl = `${window.location.origin}/gallery/${event.slug}`;
  const round1 = event.selectionRounds?.[0];
  const isSubmitted = event.status === 'SELECTION_SUBMITTED' || round1?.status === 'SUBMITTED';
  const selectedMediaIdSet = new Set(
    event.selectionRounds?.flatMap((r) => r.selections?.map((s) => s.mediaItemId) || []) || []
  );
  const selectedCount = selectedMediaIdSet.size;

  const totalEventBytes = event.mediaItems.reduce((acc, item) => acc + Number(item.fileSizeBytes || 0), 0);
  const totalEventMB = (totalEventBytes / (1024 * 1024)).toFixed(1);

  // Filter photos
  const filteredPhotos = event.mediaItems.filter((photo) => {
    if (searchQuery) {
      if (!photo.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    if (filterMode === 'SELECTED') return selectedMediaIdSet.has(photo.id);
    if (filterMode === 'READY') return photo.status === 'READY';
    if (filterMode === 'PROCESSING') return photo.status !== 'READY';
    return true;
  });

  const whatsappMessage = encodeURIComponent(
    `Hello ${event.clientName}! Your event photos for "${event.title}" are ready for selection on FrameFlow.\n\nGallery Link: ${galleryUrl}\nYour 4-Digit Access PIN: ${event.pin || '••••'}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  const getCategoryColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'wedding':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'pre-wedding':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'sangeet':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'corporate':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Editorial Studio Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
        <div className="flex items-start space-x-4">
          <Link
            to="/"
            title="Return to Dashboard"
            className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 transition shrink-0 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryColor(event.eventType)}`}>
                {event.eventType}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {new Date(event.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">
                Client: <strong className="text-zinc-200">{event.clientName}</strong>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-serif">
              {event.title}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Curated photoshoot proofing portal & background streaming ingestion engine.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={galleryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            <span>Open Client Gallery</span>
            <ExternalLink className="w-3 h-3 text-rose-200" />
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>WhatsApp Invite</span>
          </a>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-semibold transition"
            title="Delete this event and all uploaded photos"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Event</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Total Photos</span>
            <Camera className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{event.mediaItems.length}</p>
          <span className="text-[10px] text-zinc-500">In gallery catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Client Selections</span>
            <Heart className={`w-4 h-4 ${selectedCount > 0 ? 'text-rose-500 fill-current' : 'text-zinc-500'}`} />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">{selectedCount}</p>
          <span className="text-[10px] text-zinc-500">
            {isSubmitted ? 'Selection submitted' : 'Pending client pick'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Storage Used</span>
            <HardDrive className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalEventMB} MB</p>
          <span className="text-[10px] text-emerald-400 font-medium">Cloudflare R2 (0 Egress)</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Access PIN</span>
            <KeyRound className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-white font-mono tracking-widest">
              {event.pin || '••••'}
            </span>
            <button
              onClick={() => copyToClipboard(event.pin || '0000', 'stat-pin')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-medium transition"
            >
              {copiedKey === 'stat-pin' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <span className="text-[10px] text-zinc-500">Bcrypt hashed (0000 default)</span>
        </div>
      </div>

      {/* Client Submission Banner (if submitted) */}
      {isSubmitted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-700/80 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Client Selection Finalized
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 font-mono font-bold">
                  {selectedCount} photos picked
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1 font-serif">
                {event.clientName} has confirmed their album choices!
              </h3>
              {round1?.clientNotes && (
                <div className="mt-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 italic">
                  "{round1.clientNotes}"
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Background ZIP export */}
            {zipDownloadUrl ? (
              <a
                href={zipDownloadUrl}
                download
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Ready ZIP</span>
              </a>
            ) : (
              <button
                onClick={startZipExport}
                disabled={zipLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {zipLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Bundling Originals...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Originals (ZIP)</span>
                  </>
                )}
              </button>
            )}

            {/* CSV Filename List */}
            <a
              href={`/api/events/${event.id}/export/csv`}
              download
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center space-x-1.5"
              title="Download selected filenames as CSV"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>CSV</span>
            </a>

            {/* Copy Lightroom Search Query */}
            <button
              onClick={copyLightroomQuery}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center space-x-1.5"
              title="Copy comma-separated filenames for Adobe Lightroom or Capture One search bar"
            >
              {copiedKey === 'lightroom' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Query Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Lightroom Query</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Share & PIN Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Security PIN Card */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Client Security PIN
            </span>
            <KeyRound className="w-4 h-4 text-rose-400" />
          </div>

          <div className="my-4 flex items-center justify-between">
            <span className="font-mono text-3xl font-extrabold text-white tracking-widest">
              {event.pin || '••••'}
            </span>
            {event.pin && (
              <button
                onClick={() => copyToClipboard(event.pin!, 'pin')}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5"
              >
                {copiedKey === 'pin' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            Hashed with bcrypt. Fast test PIN <code className="text-rose-400">0000</code> is supported.
          </p>
        </div>

        {/* Gallery Share Link Card */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Client Proofing Portal Link
            </span>
            <Share2 className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="my-3 flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={galleryUrl}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-300 outline-none select-all"
            />
            <button
              onClick={() => copyToClipboard(galleryUrl, 'gallery-link')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition shrink-0 flex items-center space-x-1.5"
            >
              {copiedKey === 'gallery-link' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">
              Share link and PIN with {event.clientName}:
            </span>
            <div className="flex items-center space-x-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp Invite</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden ${
          isDraggingOver
            ? 'border-rose-500 bg-rose-950/20 scale-[1.01]'
            : 'border-zinc-800 hover:border-rose-500/80 bg-zinc-900/40 hover:bg-zinc-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-rose-500/20 transition duration-300 shadow-xl shadow-rose-950/20">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight font-serif">
          {isDraggingOver ? 'Drop Photos Now to Upload' : 'Drop Event Photos Here or Click to Browse'}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
          High-resolution camera RAW / JPEG exports stream directly to storage via presigned multipart URLs, bypassing server RAM.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            JPG, PNG, WebP supported
          </span>
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40">
            Sharp Microservice Resizing (400px + 1600px WebP)
          </span>
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-zinc-900 text-emerald-400 border border-emerald-900/50">
            Zero Egress Storage
          </span>
        </div>
      </div>

      {/* Live Upload Queue Tracker */}
      {uploadQueue.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Live Upload Queue</h3>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {uploadQueue.length} files
              </span>
            </div>
            {isUploading && (
              <span className="flex items-center space-x-2 text-xs text-rose-400 font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Streaming Direct to Storage...</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {uploadQueue.map((item) => (
              <div key={item.id} className="p-3.5 px-6 flex items-center justify-between text-xs hover:bg-zinc-850/50 transition">
                <div className="truncate max-w-sm">
                  <p className="font-medium text-white truncate">{item.filename}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{(item.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {item.status === 'presigning' && (
                    <span className="text-zinc-500 text-xs">Presigning URL...</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-amber-400 font-medium flex items-center space-x-1.5">
                      <Upload className="w-3.5 h-3.5 animate-pulse" />
                      <span>Direct Uploading ({item.progress}%)</span>
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="text-indigo-400 font-medium flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sharp Worker Resizing</span>
                    </span>
                  )}
                  {item.status === 'ready' && (
                    <span className="text-emerald-400 font-medium flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>WebP Ready</span>
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-rose-400 font-medium">{item.error || 'Failed'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Media Gallery Controls & Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white tracking-tight font-serif">Event Photos</h2>
            <span className="text-xs bg-zinc-850 text-zinc-300 px-3 py-1 rounded-full font-mono border border-zinc-700/60 font-semibold">
              {filteredPhotos.length} / {event.mediaItems.length} photos
            </span>
          </div>

          {/* Filter Pills, Search Bar, and Density Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search photo filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterMode === 'ALL'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({event.mediaItems.length})
              </button>
              <button
                onClick={() => setFilterMode('SELECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                  filterMode === 'SELECTED'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-3 h-3 ${selectedCount > 0 ? 'fill-current' : ''}`} />
                <span>Picked ({selectedCount})</span>
              </button>
            </div>

            {/* Grid density switcher (Desktop) */}
            <div className="hidden md:flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setGridCols(3)}
                title="3 Columns (Large)"
                className={`p-1.5 rounded-lg transition ${
                  gridCols === 3 ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                title="4 Columns"
                className={`p-1.5 rounded-lg transition ${
                  gridCols === 4 ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80">
            <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-base font-bold text-zinc-300 font-serif">
              {searchQuery ? 'No photos match your search' : 'No photos in this view'}
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with a different filename or clear the search query.'
                : 'Upload event photos above or change your selected filter.'}
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-4 ${
              gridCols === 3
                ? 'grid-cols-2 md:grid-cols-3'
                : gridCols === 4
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            }`}
          >
            {filteredPhotos.map((photo, idx) => {
              const isPicked = selectedMediaIdSet.has(photo.id);
              const thumbUrl = photo.thumbnailKey
                ? `/api/storage/files?key=${encodeURIComponent(photo.thumbnailKey)}`
                : null;

              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(idx)}
                  className={`group relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border cursor-pointer shadow-lg transition-all duration-300 hover:shadow-2xl ${
                    isPicked
                      ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                      : 'border-zinc-800/80 hover:border-zinc-600'
                  }`}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={photo.originalFilename}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-950">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mb-1.5" />
                      <span className="text-[10px] text-zinc-400">Sharp Processing...</span>
                    </div>
                  )}

                  {/* Client Selection Heart Badge */}
                  {isPicked && (
                    <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-950/60 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {photo.status === 'READY' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/75 text-emerald-400 backdrop-blur border border-emerald-500/20">
                        WebP
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/75 text-amber-400 backdrop-blur border border-amber-500/20">
                        {photo.status}
                      </span>
                    )}
                  </div>

                  {/* Info Overlay on Hover */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs font-medium text-white truncate font-mono">
                      {photo.originalFilename}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                      <span>
                        {photo.width && photo.height
                          ? `${photo.width} × ${photo.height}`
                          : `${(photo.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                      {isPicked && (
                        <span className="text-rose-400 font-semibold">Album Picked</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* High-Resolution Lightbox Modal */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-4 py-2 border-b border-zinc-900">
            <div className="flex items-center space-x-3 truncate max-w-md">
              <span className="font-medium text-white truncate font-mono">
                {filteredPhotos[lightboxIndex].originalFilename}
              </span>
              {selectedMediaIdSet.has(filteredPhotos[lightboxIndex].id) && (
                <span className="px-2 py-0.5 rounded bg-rose-600/80 text-white text-[10px] font-bold flex items-center space-x-1 shrink-0">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>Client Choice</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="font-mono text-[11px] text-zinc-400">
                {lightboxIndex + 1} of {filteredPhotos.length}
              </span>

              {/* Download original or high-res */}
              <a
                href={`/api/storage/files?key=${encodeURIComponent(
                  filteredPhotos[lightboxIndex].previewKey || filteredPhotos[lightboxIndex].thumbnailKey || ''
                )}&download=true&filename=${encodeURIComponent(filteredPhotos[lightboxIndex].originalFilename)}`}
                download={filteredPhotos[lightboxIndex].originalFilename}
                title="Download High-Res Preview"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <Download className="w-4 h-4" />
              </a>

              {/* Fullscreen Toggle */}
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

              {/* Close Button */}
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
                filteredPhotos[lightboxIndex].previewKey
                  ? `/api/storage/files?key=${encodeURIComponent(filteredPhotos[lightboxIndex].previewKey!)}`
                  : filteredPhotos[lightboxIndex].thumbnailKey
                  ? `/api/storage/files?key=${encodeURIComponent(filteredPhotos[lightboxIndex].thumbnailKey!)}`
                  : ''
              }
              alt={filteredPhotos[lightboxIndex].originalFilename}
              className="max-h-[72vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Mini Filmstrip Drawer */}
          <div className="py-2 flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 overflow-x-auto max-w-3xl px-4 py-1">
              {filteredPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition relative ${
                    idx === lightboxIndex
                      ? 'border-rose-500 scale-105 shadow-lg'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={p.thumbnailKey ? `/api/storage/files?key=${encodeURIComponent(p.thumbnailKey)}` : ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {selectedMediaIdSet.has(p.id) && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-red-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-serif mb-2">Delete Event Gallery?</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{event.title}"</strong>?
              This will permanently delete this event, all client selections, and all <strong className="text-white">{event.mediaItems.length} photos</strong> from your S3 storage bucket.
            </p>

            <div className="flex items-center space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/40 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event & Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
