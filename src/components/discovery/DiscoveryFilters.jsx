import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DiscoveryFilters({ filters, onFilterChange, options, className = '' }) {
  const { sorts = [], categories = [] } = options;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Sort */}
      {sorts.length > 0 && (
        <div className="flex items-center gap-1.5 bg-secondary/60 rounded-xl px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={filters.sort || sorts[0].value}
            onChange={e => onFilterChange({ ...filters, sort: e.target.value })}
            className="text-xs bg-transparent text-foreground outline-none cursor-pointer"
          >
            {sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {/* Category chips */}
      {categories.map(cat => (
        <button
          key={cat.value}
          onClick={() => onFilterChange({ ...filters, category: filters.category === cat.value ? '' : cat.value })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            filters.category === cat.value
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          {cat.label}
        </button>
      ))}

      {/* Clear */}
      {(filters.category || filters.sort) && (
        <button
          onClick={() => onFilterChange({ sort: '', category: '' })}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
        >
          <X className="w-3 h-3" />Clear
        </button>
      )}
    </div>
  );
}