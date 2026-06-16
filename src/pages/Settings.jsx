import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/lib/ThemeContext';
import { Link } from 'react-router-dom';
import {
  User, Bell, Moon, Sun, Shield, Trash2, LogOut, ChevronRight,
  Lock, Eye, EyeOff, CreditCard, MapPin, Check, Loader2, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import SettingsProfile from '@/components/settings/SettingsProfile';
import SettingsNotifications from '@/components/settings/SettingsNotifications';
import SettingsAccount from '@/components/settings/SettingsAccount';
import SettingsAppearance from '@/components/settings/SettingsAppearance';
import SettingsPrivacy from '@/components/settings/SettingsPrivacy';
import SettingsStripe from '@/components/settings/SettingsStripe';

const sections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Display name, bio, links' },
  { id: 'account', label: 'Account', icon: Shield, description: 'Email, neighborhood, account type' },
  { id: 'appearance', label: 'Appearance', icon: Moon, description: 'Dark mode & theme' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'In-app & email preferences' },
  { id: 'privacy', label: 'Privacy & Safety', icon: Lock, description: 'Visibility and data' },
  { id: 'stripe', label: 'Stripe Payments', icon: CreditCard, description: 'Connect Stripe to sell tickets' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const { user, refetch } = useCurrentUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {sections.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${activeSection === id ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-secondary'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${activeSection === id ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate hidden lg:block">{description}</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-transform ${activeSection === id ? 'text-accent rotate-90' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </nav>

          {/* Danger zone & logout */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          {activeSection === 'profile' && <SettingsProfile user={user} onSaved={refetch} />}
          {activeSection === 'account' && <SettingsAccount user={user} onSaved={refetch} />}
          {activeSection === 'appearance' && <SettingsAppearance />}
          {activeSection === 'notifications' && <SettingsNotifications userId={user?.id} />}
          {activeSection === 'privacy' && <SettingsPrivacy user={user} />}
          {activeSection === 'stripe' && <SettingsStripe userId={user?.id} />}
        </div>
      </div>
    </div>
  );
}