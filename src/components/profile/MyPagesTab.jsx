import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Users, Palette, Building2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function PageCard({ page, type, editPath, viewPath, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${page.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await onDelete(page.id);
  };

  const typeColors = {
    artist: 'bg-purple-100 text-purple-700',
    business: 'bg-blue-100 text-blue-700',
    community: 'bg-green-100 text-green-700',
  };

  const typeLabels = {
    artist: 'Artist Page',
    business: 'Business Page',
    community: 'Community',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-all group">
      <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
        <AvatarImage src={page.image_url} className="object-cover" />
        <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold text-lg">
          {page.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-foreground truncate">{page.name}</p>
          <Badge className={`text-[10px] border-0 ${typeColors[type]}`}>{typeLabels[type]}</Badge>
          {(page.is_verified || page.is_official) && (
            <Badge variant="secondary" className="text-[10px]">Verified</Badge>
          )}
        </div>
        {page.category && (
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{page.category?.replace('_', ' ')}</p>
        )}
        {(page.members_count || page.followers_count) ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {page.members_count ? `${page.members_count} members` : `${page.followers_count} followers`}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link to={viewPath}>
          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="View page">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </Link>
        <Link to={editPath}>
          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors" title="Edit page">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete page"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MyPagesTab({ userId }) {
  const queryClient = useQueryClient();

  const { data: artistPages = [], isLoading: loadingArtist } = useQuery({
    queryKey: ['my-artist-pages', userId],
    queryFn: () => base44.entities.ArtistPage.filter({ owner_id: userId }),
    enabled: !!userId,
  });

  const { data: businessPages = [], isLoading: loadingBiz } = useQuery({
    queryKey: ['my-business-pages', userId],
    queryFn: () => base44.entities.BusinessPage.filter({ owner_id: userId }),
    enabled: !!userId,
  });

  const { data: communities = [], isLoading: loadingComm } = useQuery({
    queryKey: ['my-communities', userId],
    queryFn: () => base44.entities.Community.filter({ owner_id: userId }),
    enabled: !!userId,
  });

  const deleteArtist = async (id) => {
    await base44.entities.ArtistPage.delete(id);
    queryClient.invalidateQueries({ queryKey: ['my-artist-pages', userId] });
  };

  const deleteBusiness = async (id) => {
    await base44.entities.BusinessPage.delete(id);
    queryClient.invalidateQueries({ queryKey: ['my-business-pages', userId] });
  };

  const deleteCommunity = async (id) => {
    await base44.entities.Community.delete(id);
    queryClient.invalidateQueries({ queryKey: ['my-communities', userId] });
  };

  const isLoading = loadingArtist || loadingBiz || loadingComm;
  const hasAny = artistPages.length > 0 || businessPages.length > 0 || communities.length > 0;

  return (
    <div className="space-y-5 pb-6">
      {/* Create buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Link to="/create-artist" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:border-purple-400 hover:bg-purple-50 transition-all group text-center">
          <Palette className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-purple-600 transition-colors leading-tight">Artist Page</span>
        </Link>
        <Link to="/create-business" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:border-blue-400 hover:bg-blue-50 transition-all group text-center">
          <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors leading-tight">Business</span>
        </Link>
        <Link to="/create-community" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:border-green-400 hover:bg-green-50 transition-all group text-center">
          <Users className="w-5 h-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-green-600 transition-colors leading-tight">Community</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      ) : !hasAny ? (
        <div className="text-center py-12">
          <p className="text-sm font-semibold text-foreground mb-1">No pages yet</p>
          <p className="text-xs text-muted-foreground">Create an artist page, business, or community above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {artistPages.map(page => (
            <PageCard
              key={page.id}
              page={page}
              type="artist"
              viewPath={`/artists/${page.id}`}
              editPath={`/create-artist?id=${page.id}`}
              onDelete={deleteArtist}
            />
          ))}
          {businessPages.map(page => (
            <PageCard
              key={page.id}
              page={page}
              type="business"
              viewPath={`/businesses/${page.id}`}
              editPath={`/create-business?id=${page.id}`}
              onDelete={deleteBusiness}
            />
          ))}
          {communities.map(page => (
            <PageCard
              key={page.id}
              page={page}
              type="community"
              viewPath={`/communities/${page.id}`}
              editPath={`/create-community?id=${page.id}`}
              onDelete={deleteCommunity}
            />
          ))}
        </div>
      )}
    </div>
  );
}