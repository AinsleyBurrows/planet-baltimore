import React from 'react';

const QUICK_FILTERS = [
  'Today', 'This Weekend', 'This Month', 'Free', 'Family Friendly',
  'Arts', 'Music', 'Food', 'Culture', 'Film', 'Literature', 'Nightlife', 'Neighborhood Festivals',
];

export default function FestivalQuickFilters({ active, onToggle, onClear }) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {QUICK_FILTERS.map(f => {
          const isActive = active.includes(f);
          return (
            <button
              key={f}
              onClick={() => onToggle(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-[#d4580a] text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
            >
              {f}
            </button>
          );
        })}
        {active.length > 0 && (
          <button onClick={onClear} className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}