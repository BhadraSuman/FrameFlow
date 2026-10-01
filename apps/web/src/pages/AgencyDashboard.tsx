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
  HardDrive
} from 'lucide-react';
import { CreateEventModal } from '../components/CreateEventModal';
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
      {/* Studio Banner & Metric Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-rose-950/30 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user?.studioName || 'Royal Weddings & Events Studio'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Client Galleries & Proofing Portal
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
              Upload wedding photo batches directly to zero-egress cloud storage, deliver private PIN-locked client galleries, and receive client photo selections.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start lg:self-auto flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm shadow-xl shadow-rose-900/40 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Studio Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700/80 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Active Events</span>
              <FolderOpen className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-2xl font-bold text-white tracking-tight">{totalEvents}</p>
              <span className="text-[11px] text-zinc-500">projects</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700/80 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Processed Photos</span>
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-2xl font-bold text-white tracking-tight">{totalPhotos}</p>
              <span className="text-[11px] text-emerald-400">WebP 400 + 1600</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700/80 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Selections Done</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-2xl font-bold text-white tracking-tight">{submittedSelections}</p>
              <span className="text-[11px] text-zinc-400">ready for editing</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700/80 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Storage Usage</span>
              <HardDrive className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <p className="text-2xl font-bold text-white tracking-tight">
                {totalStorageMB < 1024
                  ? `${totalStorageMB.toFixed(1)} MB`
                  : `${(totalStorageMB / 1024).toFixed(2)} GB`}
              </p>
              <span className="text-[11px] text-zinc-500">/ 50 GB</span>
            </div>
            {/* Storage Progress Bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, (totalStorageMB / 50000) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event title, client name, or date..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedFilter === 'ALL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SUBMITTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1 ${
              selectedFilter === 'SUBMITTED'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Selections Done ({submittedSelections})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('WEDDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1 ${
              selectedFilter === 'WEDDING'
                ? 'bg-rose-600 text-white shadow-md'
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
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Loading your photography projects...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 shadow-inner">
          <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white tracking-tight">No event galleries found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No events match your search. Try changing the keywords.'
              : 'Create your first event project to begin uploading photos and sharing proofing galleries.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/30 transition"
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const galleryUrl = `${window.location.origin}/gallery/${event.slug}`;
            const isSubmitted = event.status === 'SELECTION_SUBMITTED';

            return (
              <div
                key={event.id}
                className="group bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${getCategoryColor(
                        event.eventType
                      )}`}
                    >
                      {event.eventType}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5 ${
                        isSubmitted
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{isSubmitted ? 'Selection Received' : 'Open for Selection'}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    to={`/events/${event.id}`}
                    className="block group-hover:text-rose-400 transition"
                  >
                    <h3 className="text-xl font-bold text-white tracking-tight truncate font-serif">
                      {event.title}
                    </h3>
                  </Link>

                  {/* Client & Date Info */}
                  <div className="mt-2.5 space-y-1 text-xs text-zinc-400">
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
                  <div className="mt-4 p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
                        Photos
                      </span>
                      <span className="text-sm font-bold text-white">
                        {event.photoCount || event._count?.mediaItems || 0}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
                        PIN Code
                      </span>
                      <div className="flex items-center space-x-1.5 font-mono text-sm font-extrabold text-rose-400">
                        <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                        <span>{event.pin || '0000'}</span>
                        <button
                          onClick={() => copyToClipboard(event.pin || '0000', `pin-${event.id}`)}
                          title="Copy PIN"
                          className="p-1 hover:text-white transition"
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
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold text-center transition flex items-center justify-center space-x-1.5 shadow"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-rose-400" />
                      <span>Studio & Upload</span>
                    </Link>

                    <a
                      href={`/gallery/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Client View</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(galleryUrl, `link-${event.id}`)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedKey === `link-${event.id}` ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Link Copied!</span>
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
                        className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-semibold transition flex items-center space-x-1"
                        title="Download selected filenames as CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
    </div>
  );
};
