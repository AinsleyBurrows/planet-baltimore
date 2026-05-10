import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';

export default function CommunityCalendarTab({ community }) {
  const [current, setCurrent] = useState(new Date());

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', community.id],
    queryFn: () => base44.entities.Event.filter({ community_id: community.id }, '-date', 100),
    enabled: !!community.id,
  });

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day) => events.filter(e => e.date && isSameDay(new Date(e.date), day));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-foreground">{format(current, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-secondary/50 text-center py-2 text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, current);
          return (
            <div key={i} className={`bg-card min-h-[60px] p-1 ${!inMonth ? 'opacity-40' : ''} ${isToday(day) ? 'ring-1 ring-inset ring-accent' : ''}`}>
              <p className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-accent' : 'text-foreground'}`}>{format(day, 'd')}</p>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <Link key={j} to={`/events/${ev.id}`} className="block text-[10px] bg-accent/10 text-accent rounded px-1 py-0.5 truncate hover:bg-accent/20 transition-colors mb-0.5">
                  {ev.title}
                </Link>
              ))}
              {dayEvents.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</p>}
            </div>
          );
        })}
      </div>

      {/* Upcoming list */}
      <div className="space-y-2">
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" />Upcoming Events</h4>
        {events.filter(e => e.date && new Date(e.date) >= new Date()).slice(0, 5).map(ev => (
          <Link key={ev.id} to={`/events/${ev.id}`} className="flex gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-accent uppercase">{format(new Date(ev.date), 'MMM')}</span>
              <span className="text-base font-bold text-foreground">{format(new Date(ev.date), 'd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{ev.title}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(ev.date), 'EEE · h:mm a')}</p>
            </div>
          </Link>
        ))}
        {events.filter(e => e.date && new Date(e.date) >= new Date()).length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">No upcoming events.</p>
        )}
      </div>
    </div>
  );
}