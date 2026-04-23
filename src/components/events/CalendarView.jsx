import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { Badge } from '@/components/ui/badge';

const CATEGORY_COLORS = {
  art: 'bg-purple-500',
  music: 'bg-blue-500',
  education: 'bg-green-500',
  community: 'bg-yellow-500',
  wellness: 'bg-teal-500',
  festival: 'bg-pink-500',
  default: 'bg-accent',
};

export default function CalendarView({ events = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (day) =>
    events.filter(e => e.date && isSameDay(new Date(e.date), day));

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayEvents = eventsOnDay(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
              className={`relative flex flex-col items-center rounded-xl p-1 min-h-[52px] transition-all ${
                !inMonth ? 'opacity-30' : ''
              } ${
                isSelected ? 'bg-accent text-accent-foreground' :
                today ? 'bg-accent/10 text-accent' :
                'hover:bg-secondary'
              }`}
            >
              <span className={`text-sm font-medium leading-none mt-1 ${
                isSelected ? 'text-accent-foreground' :
                today ? 'text-accent font-bold' :
                'text-foreground'
              }`}>
                {format(day, 'd')}
              </span>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.default} ${isSelected ? 'bg-accent-foreground/60' : ''}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-accent-foreground' : 'text-muted-foreground'}`}>+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="mt-2 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {format(selectedDay, 'EEEE, MMMM d')}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events on this day.</p>
          ) : (
            selectedEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm hover:border-accent/30 transition-all group"
              >
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(event.date), 'h:mm a')}
                    {event.venue_name && ` · ${event.venue_name}`}
                  </p>
                </div>
                {event.is_free ? (
                  <Badge className="bg-green-500/10 text-green-600 border-0 text-xs flex-shrink-0">Free</Badge>
                ) : event.price_range ? (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{event.price_range}</Badge>
                ) : null}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}