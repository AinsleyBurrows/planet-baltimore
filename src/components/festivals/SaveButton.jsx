import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

const KEY = 'pb_saved_festivals';

function getSaved() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function setSaved(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

// Subscribe to cross-component save changes (custom event)
window.addEventListener?.('pb_saved_festivals_change', () => {
  // placeholder for any global listeners
});

export function useSavedFestivals() {
  const [saved, setSaved] = useState(getSaved);
  useEffect(() => {
    const handler = () => setSaved(getSaved());
    window.addEventListener('pb_saved_festivals_change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('pb_saved_festivals_change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  const toggle = (slug) => {
    const cur = getSaved();
    const next = cur.includes(slug) ? cur.filter(s => s !== slug) : [...cur, slug];
    setSaved(next);
    window.dispatchEvent(new Event('pb_saved_festivals_change'));
  };
  const isSaved = (slug) => saved.includes(slug);
  return { saved, toggle, isSaved };
}

export default function SaveButton({ slug, size = 'sm', className = '' }) {
  const { isSaved, toggle } = useSavedFestivals();
  const saved = isSaved(slug);
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      className={`flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors ${saved ? 'border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'} px-2.5 py-1.5 ${className}`}
      aria-label={saved ? 'Unsave festival' : 'Save festival'}
    >
      <Icon className="w-3.5 h-3.5" />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}