import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, Bookmark, MousePointerClick, Store, Search, TrendingUp, Award, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const CATEGORY_COLORS = {
  food: '#ef4444', art: '#8b5cf6', craft: '#f97316', merchandise: '#3b82f6',
  music: '#22c55e', kids: '#ec4899', info: '#64748b', bar: '#f59e0b', other: '#0ea5e9',
};

function MiniStat({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${accent || 'bg-accent/10'}`}>
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function EngagementView({ festivals = [] }) {
  const [sortKey, setSortKey] = useState('views');
  const [festivalFilter, setFestivalFilter] = useState('all');
  const [search, setSearch] = useState('');

  const festivalMap = useMemo(() => {
    const m = {};
    festivals.forEach(f => { m[f.id] = f.title; });
    return m;
  }, [festivals]);

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ['festival-booths', 'engagement'],
    queryFn: () => base44.entities.FestivalBooth.list('-created_date', 500),
  });

  const rows = useMemo(() => {
    let list = booths.map(b => ({
      ...b,
      views: b.view_count || 0,
      saves: b.save_count || 0,
      save_rate: (b.view_count || 0) > 0 ? ((b.save_count || 0) / b.view_count) * 100 : 0,
      festival_title: festivalMap[b.event_id] || 'Unknown festival',
    }));
    if (festivalFilter !== 'all') list = list.filter(b => b.event_id === festivalFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.vendor_name?.toLowerCase().includes(q) ||
        b.booth_number?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (sortKey === 'save_rate' ? b.save_rate - a.save_rate : b[sortKey] - a[sortKey]));
    return list;
  }, [booths, festivalFilter, search, sortKey, festivalMap]);

  const totals = useMemo(() => ({
    views: rows.reduce((s, r) => s + r.views, 0),
    saves: rows.reduce((s, r) => s + r.saves, 0),
    clicks: rows.reduce((s, r) => s + r.views, 0),
  }), [rows]);

  const topBooth = rows[0];

  const maxViews = Math.max(1, ...rows.map(r => r.views));
  const maxSaves = Math.max(1, ...rows.map(r => r.saves));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" /> Vendor Engagement
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track how attendees interact with each booth — clicks and saves across all festivals.
        </p>
      </div>

      {/* Top metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MiniStat icon={Eye} label="Total Booth Views" value={totals.views} />
          <MiniStat icon={Bookmark} label="Total Booth Saves" value={totals.saves} />
          <MiniStat
            icon={Award}
            label="Most Engaged Vendor"
            value={topBooth ? topBooth.vendor_name : '—'}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors or booth numbers…"
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={festivalFilter}
          onChange={(e) => setFestivalFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">All festivals</option>
          {festivals.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="views">Sort: Most Views</option>
          <option value="saves">Sort: Most Saves</option>
          <option value="save_rate">Sort: Save Rate</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          No booth engagement data yet. Views and saves are recorded as attendees browse the vendor map.
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 px-4 font-medium">Vendor / Booth</th>
                <th className="py-2 px-4 font-medium hidden md:table-cell">Festival</th>
                <th className="py-2 px-4 font-medium hidden sm:table-cell">Category</th>
                <th className="py-2 px-4 font-medium text-right">
                  <Eye className="w-3.5 h-3.5 inline mr-1" />Views
                </th>
                <th className="py-2 px-4 font-medium text-right">
                  <Bookmark className="w-3.5 h-3.5 inline mr-1" />Saves
                </th>
                <th className="py-2 pl-4 font-medium text-right">Save Rate</th>
                <th className="py-2 pl-4 font-medium hidden lg:table-cell">Last Viewed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => (
                <tr key={b.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="py-3 pr-4 text-muted-foreground font-medium">{i + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground line-clamp-1">{b.vendor_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: CATEGORY_COLORS[b.category] || CATEGORY_COLORS.other }}
                      />
                      {b.booth_number}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden md:table-cell line-clamp-1">{b.festival_title}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: `${CATEGORY_COLORS[b.category] || CATEGORY_COLORS.other}20`, color: CATEGORY_COLORS[b.category] || CATEGORY_COLORS.other }}>
                      {b.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(b.views / maxViews) * 100}%` }} />
                      </div>
                      <span className="font-semibold tabular-nums">{b.views}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(b.saves / maxSaves) * 100}%` }} />
                      </div>
                      <span className="font-semibold tabular-nums">{b.saves}</span>
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {b.views > 0 ? (
                      <span className="font-medium text-foreground tabular-nums">{b.save_rate.toFixed(0)}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pl-4 text-xs text-muted-foreground hidden lg:table-cell">
                    {b.last_viewed_at
                      ? new Date(b.last_viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight strip */}
      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <MousePointerClick className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Average views per booth</p>
              <p className="text-xs text-muted-foreground">
                {(totals.views / rows.length).toFixed(1)} clicks across {rows.length} booths
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Overall save rate</p>
              <p className="text-xs text-muted-foreground">
                {totals.views > 0 ? ((totals.saves / totals.views) * 100).toFixed(1) : 0}% of viewed booths were saved
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}