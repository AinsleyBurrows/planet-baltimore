import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const ACCENT = '#d4580a';
const TYPE_LABELS = { artist: 'Artist', curator: 'Curator', art_organization: 'Art Organization' };

export default function ParticipantCard({ participant }) {
  const p = participant;
  return (
    <div className="bg-secondary/30 border border-border rounded-xl overflow-hidden flex flex-col">
      {p.image_url ? (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square w-full bg-secondary flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
        <span className="text-xs font-medium mt-0.5 inline-block" style={{ color: ACCENT }}>
          {TYPE_LABELS[p.participant_type] || p.participant_type}
        </span>
        {p.role && <p className="text-xs text-muted-foreground mt-1">{p.role}</p>}
      </div>
    </div>
  );
}