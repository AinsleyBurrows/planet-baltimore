import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Calendar, Users, Ticket, UserCheck, Heart, MessageSquare, UserPlus,
  Search, MapPin, TrendingUp, Activity, QrCode, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent ? '#d4580a15' : 'hsl(var(--secondary))' }}>
          <Icon className="w-4 h-4" style={{ color: accent ? '#d4580a' : 'hsl(var(--muted-foreground))' }} />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
        <Icon className="w-4 h-4 text-[#d4580a]" />{title}
      </h3>
      {children}
    </div>
  );
}

function Bar({ label, value, max }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate text-muted-foreground">{label}</span>
      <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden">
        <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: '#d4580a' }} />
      </div>
      <span className="w-8 text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  try { return format(new Date(d), 'MMM d, yyyy · h:mm a'); } catch { return ''; }
}
function fmtDay(d) {
  if (!d) return '';
  try { return format(new Date(d), 'MMM d'); } catch { return ''; }
}

export default function AdminEventInsights() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => base44.entities.Event.list('-date', 500),
    staleTime: 60000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter(e => (e.title || '').toLowerCase().includes(q) || (e.venue_name || '').toLowerCase().includes(q));
  }, [events, search]);

  const { data: insights, isLoading: insightsLoading, error } = useQuery({
    queryKey: ['event-insights', selectedId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEventInsights', { eventId: selectedId });
      return res.data;
    },
    enabled: !!selectedId,
    staleTime: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Event Insights</h2>
        <p className="text-sm text-muted-foreground">Per-event deep dive into attendance and engagement to see what's working.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Event picker */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-3 h-fit">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events…"
              className="pl-9"
            />
          </div>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading events…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No events found.</p>
          ) : (
            <div className="space-y-1 max-h-[480px] overflow-y-auto -mr-1 pr-1">
              {filtered.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors border ${
                    selectedId === e.id
                      ? 'border-[#d4580a] bg-[#d4580a]/10'
                      : 'border-transparent hover:bg-secondary'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {e.date && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{fmtDay(e.date)}</span>}
                    {e.venue_name && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{e.venue_name}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Insights panel */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Select an event</p>
              <p className="text-sm text-muted-foreground mt-1">Choose an event from the list to view attendance and engagement details.</p>
            </div>
          ) : error ? (
            <div className="bg-card border border-destructive/40 rounded-xl p-6 text-sm text-destructive">
              {error.message || 'Failed to load insights.'}
            </div>
          ) : insightsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-muted border-t-[#d4580a] rounded-full animate-spin" />
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {/* Event header */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground text-lg">{insights.event.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {insights.event.date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(insights.event.date)}</span>}
                  {insights.event.venue_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{insights.event.venue_name}</span>}
                  {insights.event.neighborhood_name && <span>{insights.event.neighborhood_name}</span>}
                  <span className="capitalize">{insights.event.category}</span>
                  {insights.event.is_virtual && <span className="px-1.5 py-0.5 rounded bg-secondary">Virtual</span>}
                </div>
              </div>

              {/* Attendance stats */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attendance</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={Users} label="RSVPs Going" value={insights.attendance.going} accent />
                  <StatCard icon={UserCheck} label="Checked In" value={insights.attendance.checkIns} sub={insights.attendance.capacity ? `${insights.attendance.attendanceRate}% of capacity` : ''} />
                  <StatCard icon={Ticket} label="Tickets Sold" value={insights.attendance.ticketsSold} />
                  <StatCard icon={Activity} label="Interested" value={insights.attendance.interested} />
                </div>
              </div>

              {/* Engagement stats */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Engagement</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={Heart} label="Likes" value={insights.engagement.likes} accent />
                  <StatCard icon={MessageSquare} label="Comments" value={insights.engagement.comments} />
                  <StatCard icon={UserPlus} label="Followers" value={insights.engagement.followers} />
                  <StatCard icon={TrendingUp} label="Total Engagement" value={insights.engagement.totalEngagement} accent />
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SectionCard title="RSVPs by City" icon={MapPin}>
                  {insights.breakdowns.rsvpByCity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No city data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {insights.breakdowns.rsvpByCity.map(c => (
                        <Bar key={c.city} label={c.city} value={c.count} max={insights.breakdowns.rsvpByCity[0].count} />
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Check-in Methods" icon={QrCode}>
                  <div className="space-y-2">
                    {Object.entries(insights.breakdowns.checkInMethods).map(([method, count]) => (
                      <Bar
                        key={method}
                        label={method.replace('_', ' ')}
                        value={count}
                        max={Math.max(1, ...Object.values(insights.breakdowns.checkInMethods))}
                      />
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* Recent activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SectionCard title="Recent RSVPs" icon={Users}>
                  {insights.recentActivity.rsvps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {insights.recentActivity.rsvps.map(r => (
                        <li key={r.id} className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-foreground">{r.name}</span>
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            {r.city && <span>{r.city}</span>}
                            <span className="capitalize px-1.5 py-0.5 rounded bg-secondary">{r.status.replace('_', ' ')}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Recent Comments" icon={MessageSquare}>
                  {insights.recentActivity.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {insights.recentActivity.comments.map(c => (
                        <li key={c.id} className="text-sm">
                          <span className="font-medium text-foreground">{c.author}</span>
                          <p className="text-muted-foreground text-xs line-clamp-2">{c.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}