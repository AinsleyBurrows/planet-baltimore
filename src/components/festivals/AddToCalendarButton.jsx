import React from 'react';
import { CalendarPlus } from 'lucide-react';

// Generates an ICS file download + Google Calendar link for a festival.
function fmtICS(d) {
  return d.replace(/[-:]/g, '').replace(/\.\d{3}/, '') + '00';
}

function downloadICS(festival) {
  const start = new Date(festival.startDate + 'T09:00:00');
  const end = new Date((festival.endDate || festival.startDate) + 'T20:00:00');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Planet Baltimore//Festivals//EN',
    'BEGIN:VEVENT',
    `UID:${festival.slug}@planetbaltimore`,
    `DTSTAMP:${fmtICS(new Date().toISOString())}`,
    `DTSTART:${fmtICS(start.toISOString())}`,
    `DTEND:${fmtICS(end.toISOString())}`,
    `SUMMARY:${festival.name}`,
    `DESCRIPTION:${(festival.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${festival.venue || ''}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${festival.slug}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AddToCalendarButton({ festival, size = 'sm', className = '' }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadICS(festival); }}
      className={`flex items-center gap-1.5 rounded-lg border border-border text-xs font-medium transition-colors px-2.5 py-1.5 hover:bg-secondary hover:text-foreground ${className}`}
      aria-label="Add to calendar"
    >
      <CalendarPlus className="w-3.5 h-3.5" />Calendar
    </button>
  );
}