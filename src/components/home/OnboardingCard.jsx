import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Users, PenLine, Calendar } from 'lucide-react';

const STORAGE_KEY = 'pb_onboarding_dismissed';

const steps = [
  {
    icon: Sparkles,
    color: '#d4580a',
    title: 'Follow artists & creators',
    description: 'Discover Baltimore talent and see their updates in your feed.',
    link: '/artists',
    cta: 'Browse Artists',
  },
  {
    icon: Users,
    color: '#2563eb',
    title: 'Join a community',
    description: 'Find neighborhoods, groups, and organizations near you.',
    link: '/communities',
    cta: 'Find Communities',
  },
  {
    icon: PenLine,
    color: '#16a34a',
    title: 'Share something',
    description: 'Post an update, story, or event to connect with the city.',
    link: '/create-post',
    cta: 'Create a Post',
  },
  {
    icon: Calendar,
    color: '#7c3aed',
    title: 'Explore local events',
    description: 'RSVP to events happening around Baltimore.',
    link: '/ticketing',
    cta: 'See Events',
  },
];

export default function OnboardingCard() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="relative bg-card border border-border rounded-2xl p-5 sm:p-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="mb-4 pr-6">
        <h2 className="text-lg font-bold text-foreground">Welcome to Planet Baltimore 🏙️</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's how to get the most out of your community.</p>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map(({ icon: Icon, color, title, description, link, cta }) => (
          <Link
            key={link}
            to={link}
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
              <span className="text-xs font-medium mt-1.5 inline-block" style={{ color }}>{cta} →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Dismiss link */}
      <button onClick={handleDismiss} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center">
        I'm all set — dismiss this
      </button>
    </div>
  );
}