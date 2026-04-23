import React, { useState } from 'react';
import { Search, X, User, Palette, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const typeIcon = { user: User, artist: Palette, arts_org: Building2 };
const typeBadgeColor = { user: 'bg-blue-100 text-blue-700', artist: 'bg-purple-100 text-purple-700', arts_org: 'bg-orange-100 text-orange-700' };

export default function NewConversationModal({ onSelect, onClose, currentUserId }) {
  const [search, setSearch] = useState('');

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-msg'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 50),
  });
  const { data: orgs = [] } = useQuery({
    queryKey: ['arts-orgs-msg'],
    queryFn: () => base44.entities.ArtsOrganization.list('-created_date', 50),
  });

  const combined = [
    ...artists.map(a => ({ id: a.id, name: a.name, avatar: a.image_url, type: 'artist', subtitle: a.category?.replace('_', ' ') })),
    ...orgs.map(o => ({ id: o.id, name: o.name, avatar: o.image_url, type: 'arts_org', subtitle: o.org_type?.replace('_', ' ') })),
  ].filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">New Message</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artists & organizations..."
              className="pl-10 h-9 rounded-lg bg-secondary border-0 text-sm"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {combined.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
            )}
            {combined.map(person => {
              const Icon = typeIcon[person.type] || User;
              return (
                <button
                  key={`${person.type}-${person.id}`}
                  onClick={() => onSelect(person)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm">{person.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{person.subtitle}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${typeBadgeColor[person.type]}`}>
                    {person.type.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}