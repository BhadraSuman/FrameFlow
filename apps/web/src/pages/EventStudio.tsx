import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Copy,
  Download,
  Eye,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Share2,
  Upload,
  X
} from 'lucide-react';

interface MediaItem {
  id: string;
  originalFilename: string;
  thumbnailKey: string | null;
  previewKey: string | null;
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
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEvent = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/${id}`);
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

  // Direct-to-Storage Resumable Upload Flow
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
        const presignRes = await fetch('/api/uploads/presign', {
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

        // 2. Direct upload to storage (R2/S3)
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
        const completeRes = await fetch('/api/uploads/complete', {
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

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Loading event studio...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-lg font-bold text-white">Event not found</p>
        <Link to="/" className="text-rose-400 hover:underline text-sm mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const galleryUrl = `${window.location.origin}/gallery/${event.slug}`;
  const round1 = event.selectionRounds?.[0];
  const isSubmitted = event.status === 'SELECTION_SUBMITTED' || round1?.status === 'SUBMITTED';
  const selectedCount = round1?.selections?.length || 0;

  const whatsappMessage = encodeURIComponent(
    `Hello ${event.clientName}! Your event photos for "${event.title}" are ready for selection on FrameFlow.\n\nGallery Link: ${galleryUrl}\nYour 4-Digit Access PIN: ${event.pin || '••••'}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-semibold text-rose-400 tracking-wider">
                {event.eventType}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">
                {new Date(event.eventDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={galleryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-900/30 transition"
          >
            <Eye className="w-4 h-4" />
            <span>Open Client Gallery</span>
          </a>
        </div>
      </div>

      {/* Client Submission Banner (if submitted) */}
      {isSubmitted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Client Selection Received
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-mono">
                  {selectedCount} photos chosen
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {event.clientName} has submitted their final choices!
              </h3>
              {round1?.clientNotes && (
                <p className="text-xs text-zinc-300 mt-1 italic">
                  "{round1.clientNotes}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={`/api/events/${event.id}/export/csv`}
              download
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/40 transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Selection CSV</span>
            </a>
          </div>
        </div>
      )}

      {/* Share & PIN Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PIN Card */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Client Security PIN
            </span>
            <KeyRound className="w-4 h-4 text-rose-400" />
          </div>

          <div className="my-3 flex items-center justify-between">
            <span className="font-mono text-3xl font-extrabold text-white tracking-widest">
              {event.pin || '••••'}
            </span>
            {event.pin && (
              <button
                onClick={() => copyToClipboard(event.pin!, 'pin')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5"
              >
                {copiedKey === 'pin' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
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
            Hashed using bcrypt. Client enters this to unlock the proofing portal.
          </p>
        </div>

        {/* Gallery Share Link Card */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Client Gallery Link
            </span>
            <Share2 className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="my-3 flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={galleryUrl}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none select-all"
            />
            <button
              onClick={() => copyToClipboard(galleryUrl, 'gallery-link')}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition shrink-0 flex items-center space-x-1.5"
            >
              {copiedKey === 'gallery-link' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">Share with {event.clientName}:</span>
            <div className="flex items-center space-x-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-zinc-800 hover:border-rose-500/80 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition group relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-rose-500/20 transition duration-300">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">
          Drop event photos here or click to browse
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          High-resolution photos bypass the API server memory and upload directly to Cloudflare R2 / storage via presigned multipart URLs.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            JPG, PNG, WebP supported
          </span>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40">
            Sharp Microservice Resizing (400px + 1600px)
          </span>
        </div>
      </div>

      {/* Live Upload Queue Tracker */}
      {uploadQueue.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Upload Queue</h3>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                {uploadQueue.length} files
              </span>
            </div>
            {isUploading && (
              <span className="flex items-center space-x-2 text-xs text-rose-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Direct Uploading to Storage...</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {uploadQueue.map((item) => (
              <div key={item.id} className="p-3.5 px-6 flex items-center justify-between text-xs hover:bg-zinc-850/50 transition">
                <div className="truncate max-w-sm">
                  <p className="font-medium text-white truncate">{item.filename}</p>
                  <p className="text-[11px] text-zinc-500">{(item.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {item.status === 'presigning' && (
                    <span className="text-zinc-500">Presigning...</span>
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
                    <span className="text-rose-400 font-medium">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Media Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Event Photos</h2>
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
              {event.mediaItems.length} photos
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            Click any thumbnail to preview in high resolution
          </span>
        </div>

        {event.mediaItems.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/80">
            <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-400">No photos uploaded to this gallery yet</p>
            <p className="text-xs text-zinc-500 mt-1">Use the upload box above to start uploading event photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {event.mediaItems.map((photo) => {
              const thumbUrl = photo.thumbnailKey
                ? `/api/storage/files?key=${encodeURIComponent(photo.thumbnailKey)}`
                : null;
              const previewUrl = photo.previewKey
                ? `/api/storage/files?key=${encodeURIComponent(photo.previewKey)}`
                : thumbUrl;

              return (
                <div
                  key={photo.id}
                  onClick={() => previewUrl && setLightboxUrl(previewUrl)}
                  className="group relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 cursor-pointer shadow-lg transition"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={photo.originalFilename}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-950">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mb-1" />
                      <span className="text-[10px] text-zinc-400">Sharp Processing...</span>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2 left-2">
                    {photo.status === 'READY' ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-emerald-400 backdrop-blur">
                        WebP
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-amber-400 backdrop-blur">
                        {photo.status}
                      </span>
                    )}
                  </div>

                  {/* Info Overlay on Hover */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <p className="text-[11px] font-medium text-white truncate">
                      {photo.originalFilename}
                    </p>
                    {photo.width && photo.height && (
                      <p className="text-[10px] text-zinc-400">
                        {photo.width} × {photo.height}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-50"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
