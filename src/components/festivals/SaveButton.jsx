import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const KEY = 'pb_saved_festivals';

function getSaved() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

// localStorage-backed hook — used for curated (non-DB) festivals and as a
// fallback when the user is not signed in. DB festivals are persisted via the
// Follow entity (target_type = "saved_festival") so saves survive across
// devices and sync to the Profile "Saved" tab.
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
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('pb_saved_festivals_change'));
    setSaved(next);
  };
  const isSaved = (slug) => saved.includes(slug);
  return { saved, toggle, isSaved };
}

// DB-backed saved-festival ids for the signed-in user (Follow records).
export function useSavedFestivalIds(currentUserId) {
  const { data = [] } = useQuery({
    queryKey: ['saved_festivals', currentUserId],
    queryFn: () => base44.entities.Follow.filter({
      follower_id: currentUserId,
      target_type: 'saved_festival',
    }),
    enabled: !!currentUserId,
    staleTime: 30000,
  });
  return data.filter(f => f.target_id).map(f => f.target_id);
}

export default function SaveButton({ slug, festivalId, festivalName, size = 'sm', className = '' }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { isSaved: isLocalSaved, toggle: toggleLocal } = useSavedFestivals();

  const { data: savedFollows = [] } = useQuery({
    queryKey: ['saved_festivals', user?.id],
    queryFn: () => base44.entities.Follow.filter({
      follower_id: user.id,
      target_type: 'saved_festival',
    }),
    enabled: !!user?.id && !!festivalId,
    staleTime: 30000,
  });

  const dbSavedRecord = savedFollows.find(f => f.target_id === festivalId);
  const dbSaved = !!dbSavedRecord;
  const localSaved = isLocalSaved(slug);
  const saved = dbSaved || localSaved;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (dbSavedRecord) {
        await base44.entities.Follow.delete(dbSavedRecord.id);
      } else {
        await base44.entities.Follow.create({
          follower_id: user.id,
          target_type: 'saved_festival',
          target_id: festivalId,
          target_name: festivalName,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_festivals', user?.id] });
    },
  });

  const Icon = saved ? BookmarkCheck : Bookmark;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (festivalId && user) {
      toggleMutation.mutate();
    } else {
      toggleLocal(slug);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={toggleMutation.isPending}
      className={`flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${saved ? 'border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'} px-2.5 py-1.5 ${className}`}
      aria-label={saved ? 'Unsave festival' : 'Save festival'}
    >
      <Icon className="w-3.5 h-3.5" />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}