import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Music, Ticket, Users, Play, ExternalLink, Megaphone, X, Loader2, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';
import AppImage from '@/components/shared/AppImage';

function AnnounceModal({ business, user, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handlePost = async () => {
    setSaving(true);
    let mediaUrls = [];
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      mediaUrls = [file_url];
    }
    await base44.entities.Post.create({
      author_id: user.id, author_name: business.name, author_avatar: business.image_url,
      author_type: 'business', page_id: business.id, page_type: 'business',
      content, media_urls: mediaUrls, media_type: mediaUrls.length ? 'image' : 'text',
      post_type: 'announcement', visibility: 'public',
      neighborhood_id: business.neighborhood_id, neighborhood_name: business.neighborhood_name,
    });
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Post Announcement</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
          placeholder={`New show, event, or update from ${business.name}…`}
          value={content} onChange={e => setContent(e.target.value)} />
        {imagePreview && <img src={imagePreview} alt="" className="w-full h-36 object-cover rounded-xl" />}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <ImageIcon className="w-4 h-4" /> Add flyer / photo
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <Button onClick={handlePost} disabled={!content || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : <><Megaphone className="w-4 h-4" />Post Announcement</>}
        </Button>
      </div>
    </div>
  );
}

export default function EntertainmentHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAnnounce, setShowAnnounce] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    queryClient.invalidateQueries({ queryKey: ['business-posts'] });
    setShowAnnounce(false);
  };

  const ticketUrl = business.hub_data?.ticket_url;
  const capacity = business.hub_data?.capacity;
  const ageRestriction = business.hub_data?.age_restriction;
  const dresscode = business.hub_data?.dresscode;
  const showcaseUrls = business.hub_data?.showcase_urls || [];
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());
  const pastEvents = events.filter(e => e.date && new Date(e.date) <= new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <button onClick={() => setShowAnnounce(true)} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
          <Megaphone className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-accent">Post Show / Event Announcement</span>
        </button>
      )}

      {ticketUrl && (
        <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
          <Ticket className="w-4 h-4" /> Get Tickets
        </a>
      )}

      {/* Venue Info */}
      {(capacity || ageRestriction || dresscode) && (
        <div className="grid grid-cols-3 gap-3">
          {capacity && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted-foreground">Capacity</span>
              <span className="text-sm font-bold text-foreground">{capacity}</span>
            </div>
          )}
          {ageRestriction && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl">
              <span className="text-lg font-bold text-accent">{ageRestriction}</span>
              <span className="text-xs text-muted-foreground">Age</span>
            </div>
          )}
          {dresscode && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl text-center">
              <Music className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted-foreground">Dress Code</span>
              <span className="text-xs font-semibold text-foreground">{dresscode}</span>
            </div>
          )}
        </div>
      )}

      {/* Showcase / Gallery */}
      {showcaseUrls.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Play className="w-4 h-4 text-accent" /> Showcase</h2>
          <div className="grid grid-cols-2 gap-2">
            {showcaseUrls.slice(0, 4).map((url, i) => (
              <AppImage key={i} src={url} className="w-full aspect-video rounded-xl" aspectRatio="16:9" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /> Upcoming Shows & Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">No upcoming events posted yet.</p>
        ) : (
          <div className="space-y-3">{upcomingEvents.slice(0, 5).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        )}
      </div>

      {showAnnounce && user && <AnnounceModal business={business} user={user} onClose={() => setShowAnnounce(false)} onSaved={refresh} />}
    </div>
  );
}