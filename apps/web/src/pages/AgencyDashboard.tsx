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
  KeyRound,
  Plus,
  Search,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';
import { CreateEventModal } from '../components/CreateEventModal';

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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events');
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
    if (selectedFilter === 'ACTIVE') return ev.status === 'ACTIVE';
    return true;
  });

  // Calculate quick stats
  const totalEvents = events.length;
  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const submittedSelections = events.filter((e) => e.status === 'SELECTION_SUBMITTED').length;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Studio Banner & Metric Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/40 border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Event Galleries & Client Proofing
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Upload wedding & event photo batches directly to cloud storage, share private PIN-protected galleries, and receive client selections.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start md:self-auto flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm shadow-xl shadow-rose-900/40 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Total Events</span>
              <FolderOpen className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{totalEvents}</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Photos Uploaded</span>
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{totalPhotos}</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Selections Done</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{submittedSelections}</p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>Storage Architecture</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-2">
              <span className="text-emerald-400 font-semibold">Direct-to-R2</span>
              <br />Zero Server Memory Strain
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event title or client name..."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedFilter === 'ALL'
                ? 'bg-rose-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedFilter === 'SUBMITTED'
                ? 'bg-rose-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Submitted ({submittedSelections})
          </button>
          <button
            onClick={() => setSelectedFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedFilter === 'ACTIVE'
                ? 'bg-rose-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Active
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Loading studio events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8">
          <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No event projects found</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No events match your search query.'
              : 'Create your first event gallery to begin uploading photos and sharing with clients.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition"
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
                className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      {event.eventType}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 ${
                        isSubmitted
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{isSubmitted ? 'Selection Received' : 'Open for Selection'}</span>
                    </span>
                  </div>

                  {/* Title & Client */}
                  <Link to={`/events/${event.id}`} className="block group-hover:text-rose-400 transition">
                    <h3 className="text-lg font-bold text-white tracking-tight truncate">
                      {event.title}
                    </h3>
                  </Link>

                  <div className="mt-2 space-y-1 text-xs text-zinc-400">
                    <p className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Client: {event.clientName}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Date: {new Date(event.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>

                  {/* Photo Count & PIN Info Box */}
                  <div className="mt-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Photos</span>
                      <span className="text-sm font-bold text-white">
                        {event.photoCount || event._count?.mediaItems || 0}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Access PIN</span>
                      <div className="flex items-center space-x-1.5 font-mono text-sm font-bold text-rose-400">
                        <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                        <span>{event.pin || '••••'}</span>
                        {event.pin && (
                          <button
                            onClick={() => copyToClipboard(event.pin!, `pin-${event.id}`)}
                            title="Copy PIN"
                            className="p-1 hover:text-white transition"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-col space-y-2.5">
                  <div className="flex items-center space-x-2">
                    {/* Manage & Upload */}
                    <Link
                      to={`/events/${event.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold text-center transition flex items-center justify-center space-x-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Upload & Manage</span>
                    </Link>

                    {/* View as Client (New tab) */}
                    <a
                      href={`/gallery/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Client View</span>
                    </a>
                  </div>

                  {/* Share Client Link & Export CSV */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(galleryUrl, `link-${event.id}`)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center justify-center space-x-1.5"
                    >
                      {copiedKey === `link-${event.id}` ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Link Copied!</span>
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
                        className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-medium transition flex items-center space-x-1.5"
                        title="Download selection as CSV list"
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
