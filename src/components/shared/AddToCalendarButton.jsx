import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function toGCalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export default function AddToCalendarButton({ event, className = '', size = 'sm', variant = 'outline' }) {
  if (!event?.date) return null;

  const handleClick = () => {
    const start = toGCalDate(event.date);
    const end = event.end_date ? toGCalDate(event.end_date) : toGCalDate(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Event',
      dates: `${start}/${end}`,
      details: event.description || '',
      location: [event.venue_name, event.address].filter(Boolean).join(', '),
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  return (
    <Button size={size} variant={variant} onClick={handleClick} className={`gap-2 ${className}`}>
      <CalendarPlus className="w-4 h-4" />
      Add to Google Calendar
    </Button>
  );
}