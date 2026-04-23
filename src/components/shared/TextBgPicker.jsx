import React from 'react';
import { Check } from 'lucide-react';

export const TEXT_BG_PALETTE = [
  { value: '#1a1a2e', label: 'Deep Navy',      text: '#ffffff' },
  { value: '#16213e', label: 'Midnight',        text: '#ffffff' },
  { value: '#0f3460', label: 'Royal Blue',      text: '#ffffff' },
  { value: '#1b4332', label: 'Forest',          text: '#ffffff' },
  { value: '#2d3a4a', label: 'Slate',           text: '#ffffff' },
  { value: '#3d2b1f', label: 'Espresso',        text: '#ffffff' },
  { value: '#4a1942', label: 'Plum',            text: '#ffffff' },
  { value: '#2c2c54', label: 'Indigo',          text: '#ffffff' },
  { value: '#1a1a1a', label: 'Black',           text: '#ffffff' },
  { value: '#c9a96e', label: 'Gold',            text: '#1a1a1a' },
  { value: '#d4a853', label: 'Amber',           text: '#1a1a1a' },
  { value: '#f5f0e8', label: 'Ivory',           text: '#1a1a1a' },
  { value: '#fef9ef', label: 'Cream',           text: '#1a1a1a' },
  { value: '#f0f4f8', label: 'Mist',            text: '#1a1a1a' },
  { value: '#e8f4f8', label: 'Sky',             text: '#1a1a1a' },
];

export function getTextColor(bg) {
  const match = TEXT_BG_PALETTE.find(p => p.value === bg);
  return match ? match.text : '#ffffff';
}

export default function TextBgPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Background</p>
      <div className="flex flex-wrap gap-2">
        {TEXT_BG_PALETTE.map(color => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            title={color.label}
            className="w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: color.value,
              borderColor: value === color.value ? '#ffffff' : 'transparent',
              boxShadow: value === color.value ? `0 0 0 2px ${color.value}` : 'none',
            }}
          >
            {value === color.value && (
              <Check className="w-3.5 h-3.5" style={{ color: color.text }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}