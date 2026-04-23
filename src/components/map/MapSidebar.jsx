import React from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { LAYERS } from '@/pages/CityMap';
import { Button } from '@/components/ui/button';

export default function MapSidebar({ pin, onClose }) {
  if (!pin) return null;
  const layer = LAYERS[pin.type];

  return (
    <aside className="w-72 flex-shrink-0 bg-card border-l border-border overflow-y-auto flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white capitalize"
          style={{ backgroundColor: layer.color }}
        >
          {layer.label}
        </span>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Image */}
      {pin.image && (
        <div className="aspect-[16/9] overflow-hidden flex-shrink-0">
          <img src={pin.image} alt={pin.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h2 className="font-bold text-foreground text-base leading-tight">{pin.title}</h2>
          {pin.subtitle && (
            <p className="text-sm capitalize mt-0.5" style={{ color: layer.color }}>{pin.subtitle}</p>
          )}
        </div>

        {pin.meta && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{pin.meta}</span>
          </div>
        )}

        {/* Extra fields per type */}
        {pin.type === 'events' && pin.raw?.date && (
          <div className="text-sm text-muted-foreground">
            📅 {new Date(pin.raw.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
        {pin.type === 'events' && pin.raw?.is_free !== undefined && (
          <div className="text-sm">
            {pin.raw.is_free
              ? <span className="text-green-600 font-medium">Free</span>
              : <span className="text-muted-foreground">{pin.raw.price_range || 'Paid'}</span>}
          </div>
        )}
        {pin.raw?.description && (
          <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{pin.raw.description}</p>
        )}
        {pin.raw?.bio && (
          <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{pin.raw.bio}</p>
        )}
        {pin.raw?.tagline && (
          <p className="text-sm text-muted-foreground italic">{pin.raw.tagline}</p>
        )}

        <div className="mt-auto pt-2">
          <Link to={pin.link}>
            <Button className="w-full gap-2" style={{ backgroundColor: layer.color, borderColor: layer.color }}>
              <ExternalLink className="w-4 h-4" />
              View Full Profile
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}