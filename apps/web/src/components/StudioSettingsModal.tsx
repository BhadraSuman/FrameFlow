import React, { useState } from 'react';
import { X, Building, Globe, Camera, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudioSettingsModal: React.FC<StudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [studioName, setStudioName] = useState(user?.studioName || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [studioLogoUrl, setStudioLogoUrl] = useState(user?.studioLogoUrl || '');
  const [brandColor, setBrandColor] = useState(user?.brandColor || '#f43f5e');
  const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.websiteUrl || '');
  const [defaultWatermark, setDefaultWatermark] = useState(Boolean(user?.defaultWatermark));

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({
        studioName,
        fullName,
        studioLogoUrl,
        brandColor,
        instagramHandle,
        websiteUrl,
        defaultWatermark
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update studio branding');
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    { name: 'Signature Iris', color: '#4F46E5' },
    { name: 'Royal Gold', color: '#eab308' },
    { name: 'Emerald Class', color: '#10b981' },
    { name: 'Rose Luxury', color: '#f43f5e' },
    { name: 'Modern Amber', color: '#f59e0b' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-iris-50 border border-iris-100 text-iris-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-serif">Studio Branding & White-Label</h3>
              <p className="text-xs text-zinc-500">Customize how your client galleries look to couples</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Studio branding updated successfully!</span>
            </div>
          )}

          {/* Studio Name & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Studio / Brand Name
              </label>
              <input
                type="text"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. Royal Weddings Studio"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Lead Photographer
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition"
              />
            </div>
          </div>

          {/* Studio Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
              Studio Logo Image URL
            </label>
            <input
              type="url"
              value={studioLogoUrl}
              onChange={(e) => setStudioLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Displays on the client PIN unlock screen, gallery navigation header, and proofs.
            </p>
          </div>

          {/* Instagram & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Instagram Handle
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@royalweddings"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Website Portfolio
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="royalweddings.com"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Brand Accent Color */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1">
              Brand Accent Color
            </label>
            <div className="flex items-center space-x-2">
              {presetColors.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setBrandColor(p.color)}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                  className={`w-7 h-7 rounded-full transition transform hover:scale-110 flex items-center justify-center ${
                    brandColor === p.color ? 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-105' : ''
                  }`}
                >
                  {brandColor === p.color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-24 bg-zinc-50 border border-zinc-200 focus:border-iris-600 focus:bg-white rounded-lg px-2.5 py-1 text-xs text-zinc-900 font-mono uppercase outline-none ml-2"
              />
            </div>
          </div>

          {/* Default Watermark Toggle */}
          <div className="pt-2">
            <label className="flex items-center space-x-3 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg p-3.5 cursor-pointer transition">
              <input
                type="checkbox"
                checked={defaultWatermark}
                onChange={(e) => setDefaultWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-iris-600 focus:ring-iris-500 bg-white border-zinc-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-zinc-900 block">Enable Proof Watermarking by Default</span>
                <span className="text-[11px] text-zinc-500">
                  New events will automatically have proof watermarks enabled on 1600px preview images.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-iris-600 hover:bg-iris-700 active:bg-iris-800 text-white text-xs font-semibold transition shadow-sm shadow-iris-600/20 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Studio Branding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
