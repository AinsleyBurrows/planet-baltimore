import React from 'react';
import { LAYERS } from '@/pages/CityMap';
import { Search, X } from 'lucide-react';

export default function MapFilterBar({ activeLayers, onToggleLayer, search, onSearch }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-3 bg-card border-b border-border flex-shrink-0">
      {/* Search */}
      <div className="relative flex-shrink-0 sm:w-52">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search the map…"
          className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Layer toggles */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(LAYERS).map(([key, layer]) => {
          const active = activeLayers.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-secondary text-muted-foreground border-border opacity-60 hover:opacity-80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-background/60' : 'bg-foreground/40'}`} />
              {layer.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}