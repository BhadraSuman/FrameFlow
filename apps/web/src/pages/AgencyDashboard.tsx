import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Camera,
  CheckCircle,
  Copy,
  Download,
  Eye,
  FolderOpen,
  Heart,
  KeyRound,
  Plus,
  Search,
  Share2,
  Sparkles,
  Users,
  HardDrive,
  Trash2,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { CreateEventModal } from '../components/CreateEventModal';
import { StudioSettingsModal } from '../components/StudioSettingsModal';
import { useAuth } from '../context/AuthContext';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  eventType: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  pin?: string;
  status: string;
  photoCount: number;
  totalBytes: number;
  createdAt: string;
  _count?: {
    mediaItems: number;
  };
}

export const AgencyDashboard: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = async (event: EventItem) => {
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete event');
      }
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setEventToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Could not delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await authFetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === 'SUBMITTED') return ev.status === 'SELECTION_SUBMITTED';
    if (selectedFilter === 'WEDDING') return ev.eventType === 'Wedding' || ev.eventType === 'Pre-Wedding';
    if (selectedFilter === 'ACTIVE') return ev.status === 'ACTIVE';
    return true;
  });

  // Calculate quick stats
  const totalEvents = events.length;
  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const submittedSelections = events.filter((e) => e.status === 'SELECTION_SUBMITTED').length;
  const totalStorageMB = events.reduce((sum, e) => sum + Number(e.totalBytes || 0), 0) / (1024 * 1024);

  const getCategoryColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wedding':
        return 'text-zinc-200 bg-zinc-800/80 border-zinc-700/80';
      case 'pre-wedding':
        return 'text-iris-300 bg-iris-500/10 border-iris-500/30';
      case 'sangeet':
        return 'text-purple-300 bg-purple-500/10 border-purple-500/30';
      case 'corporate':
        return 'text-blue-300 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Studio Header & Metric Cards (S1 Dashboard) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121214] border border-zinc-800/90 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-iris-400" />
                <span>{user?.studioName || 'Royal Weddings & Events Studio'}</span>
              </div>
              {user?.isDemo && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <span>⏳ 24h Sandbox Studio</span>
                  <span className="text-[10px] text-amber-400/80">• Auto-purges in 24h</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-serif text-white tracking-tight">
              Client Galleries & Proofing Portal
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Upload event photo batches to zero-egress cloud storage, deliver private PIN-locked client galleries, and receive selections for album design.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start lg:self-auto">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Studio Branding</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-iris-600 hover:bg-iris-500 active:bg-iris-700 text-white font-medium text-xs shadow-sm shadow-iris-600/30 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Studio Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 pt-8 border-t border-zinc-800/80">
          {/* 1. Active Events */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Active Events
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-serif">
                {totalEvents}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Client proofing portals</span>
            </div>
          </div>

          {/* 2. Processed Photos */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Processed Photos
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-serif">
                {totalPhotos}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-iris-400 shrink-0" />
              <span>WebP 400px + 1600px Ready</span>
            </div>
          </div>

          {/* 3. Selections Done */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Selections Received
              </span>
              <div className="w-7 h-7 rounded-lg bg-iris-500/10 text-iris-400 border border-iris-500/20 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-serif">
                {submittedSelections}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-iris-300">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Ready for Lightroom export</span>
            </div>
          </div>

          {/* 4. Storage Usage (Quota Meter) */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Storage Usage
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="my-3 flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-serif">
                {totalStorageMB < 1024
                  ? totalStorageMB.toFixed(1)
                  : (totalStorageMB / 1024).toFixed(2)}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                {totalStorageMB < 1024 ? 'MB' : 'GB'}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="text-zinc-300 font-medium">Free Tier</span>
                <span className="font-mono text-zinc-400">5 GB Quota</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-iris-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, (totalStorageMB / 5120) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (S2 Galleries List) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event title, client name, or date..."
            className="w-full bg-[#121214] border border-zinc-800 focus:border-iris-500 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-[#121214] p-1 rounded-lg border border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              selectedFilter === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Galleries ({events.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SUBMITTED')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              selectedFilter === 'SUBMITTED'
                ? 'bg-iris-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Selection Received ({submittedSelections})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('WEDDING')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              selectedFilter === 'WEDDING'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Weddings</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-24">
          <div className="w-8 h-8 border-2 border-iris-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Loading your photography projects...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-[#121214] rounded-xl border border-zinc-800 p-8 shadow-sm">
          <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white tracking-tight">No event galleries found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No events match your search. Try changing the keywords.'
              : 'Create your first event project to begin uploading photos and sharing proofing galleries.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-iris-600 hover:bg-iris-500 text-white rounded-lg text-xs font-medium shadow-sm transition"
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const galleryUrl = `${window.location.origin}/gallery/${event.slug}`;
            const isSubmitted = event.status === 'SELECTION_SUBMITTED';

            return (
              <div
                key={event.id}
                className="group bg-[#121214] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(
                        event.eventType
                      )}`}
                    >
                      {event.eventType}
                    </span>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 ${
                        isSubmitted
                          ? 'bg-iris-500/10 text-iris-300 border border-iris-500/30'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{isSubmitted ? 'Selection Received' : 'Awaiting Selection'}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    to={`/events/${event.id}`}
                    className="block group-hover:text-iris-300 transition"
                  >
                    <h3 className="text-xl font-normal font-serif text-white tracking-tight truncate">
                      {event.title}
                    </h3>
                  </Link>

                  {/* Client & Date Info */}
                  <div className="mt-2 space-y-1 text-xs text-zinc-400">
                    <p className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Client: {event.clientName}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Date:{' '}
                        {new Date(event.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>

                  {/* PIN & Photo Count Pill Box */}
                  <div className="mt-4 p-3 rounded-lg bg-[#18181B] border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium block">
                        Photos
                      </span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {event.photoCount || event._count?.mediaItems || 0}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium block">
                        PIN Code
                      </span>
                      <div className="flex items-center space-x-1.5 font-mono text-sm font-semibold text-zinc-200">
                        <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{event.pin || '0000'}</span>
                        <button
                          onClick={() => copyToClipboard(event.pin || '0000', `pin-${event.id}`)}
                          title="Copy PIN"
                          className="p-1 hover:text-white text-zinc-400 transition"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/events/${event.id}`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium text-center transition flex items-center justify-center space-x-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Studio & Upload</span>
                    </Link>

                    <a
                      href={`/gallery/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-lg bg-iris-600/10 hover:bg-iris-600/20 text-iris-300 text-xs font-medium border border-iris-500/20 transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Client View</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(galleryUrl, `link-${event.id}`)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedKey === `link-${event.id}` ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy Client Link</span>
                        </>
                      )}
                    </button>

                    {isSubmitted && (
                      <a
                        href={`/api/events/${event.id}/export/csv`}
                        download
                        className="py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center space-x-1"
                        title="Download selected filenames as CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </a>
                    )}

                    <button
                      onClick={() => setEventToDelete(event)}
                      className="p-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 text-xs font-medium transition flex items-center justify-center shrink-0"
                      title="Delete event and all uploaded S3 photos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-red-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white font-serif mb-2">Delete Event Gallery?</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{eventToDelete.title}"</strong>?
              This will permanently remove the event, client selections, and all uploaded photos from your S3 storage bucket.
            </p>

            <div className="flex items-center space-x-3 justify-end">
              <button
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(eventToDelete)}
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

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventCreated={(newEvent) => {
          setEvents((prev) => [newEvent, ...prev]);
        }}
      />

      {/* Studio Settings & White-Label Modal */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
