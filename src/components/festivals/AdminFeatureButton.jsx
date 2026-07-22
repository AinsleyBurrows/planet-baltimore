import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Admin-only button to toggle the `featured` flag on a festival.
 * Only renders for admins and for DB-backed festivals (those with an id).
 */
export default function AdminFeatureButton({ festival, className = '' }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  if (!user || user.role !== 'admin' || !festival?.id) return null;

  const featured = !!festival.featured;

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await base44.entities.Festival.update(festival.id, { featured: !featured });
      queryClient.invalidateQueries({ queryKey: ['festivals'] });
      queryClient.invalidateQueries({ queryKey: ['festival', festival.slug] });
      window.dispatchEvent(new Event('pb_festival_feature_change'));
    } catch (err) {
      // ignore — admin can retry
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={featured ? 'Unfeature this festival' : 'Feature this festival'}
      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${featured ? 'border-[#d4580a] text-white bg-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'} ${className}`}
    >
      <Star className={`w-3.5 h-3.5 ${featured ? 'fill-current' : ''}`} />
      {featured ? 'Featured' : 'Feature'}
    </button>
  );
}