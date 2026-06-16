import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsAppearance() {
  const { theme, toggleTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Clean and bright' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Choose how Planet Baltimore looks to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map(({ id, label, icon: Icon, description }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              onClick={() => { if (!active) toggleTheme(); }}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${active ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-secondary'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? 'bg-accent/15' : 'bg-secondary'}`}>
                <Icon className={`w-6 h-6 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${active ? 'text-accent' : 'text-foreground'}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              {active && (
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}