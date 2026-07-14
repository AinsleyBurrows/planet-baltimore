import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ticket, DollarSign, Store, TrendingUp, RefreshCw, Calendar, MapPin, ArrowLeft, Users, ClipboardList, BarChart3, Eye, Bookmark, MousePointerClick } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import FestivalBoothManager from '@/components/festivals/FestivalBoothManager';
import EngagementView from '@/components/festivals/EngagementView';

const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const MARKER_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-';
const festivalIcon = new L.Icon({
  iconUrl: `${MARKER_BASE}red.png`, shadowUrl: SHADOW_URL,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const vendorIcon = new L.Icon({
  iconUrl: `${MARKER_BASE}orange.png`, shadowUrl: SHADOW_URL,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const BALTIMORE_CENTER = [39.2904, -76.6122];

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${accent || 'bg-accent/10'}`}>
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function AdminFestivalDashboard() {
  const [view, setView] = useState('sales');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-festival-dashboard'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFestivalDashboard', {});
      return res.data;
    },
    refetchInterval: 30000,
  });

  const totals = data?.totals || {};
  const festivals = data?.festivals || [];
  const recentSales = data?.recent_sales || [];
  const vendors = data?.vendors || [];

  const pinnableFestivals = festivals.filter(f => f.latitude && f.longitude);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent" /> Festival Monitor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time ticket sales & vendor locations</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live — auto-refreshes every 30 seconds
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Calendar} label="Active Festivals" value={totals.festival_count || 0} />
            <StatCard icon={Ticket} label="Tickets Sold" value={totals.tickets_sold || 0} />
            <StatCard icon={DollarSign} label="Gross Revenue" value={`$${(totals.gross_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub={`$${(totals.completed_revenue || 0).toLocaleString()} confirmed`} />
            <StatCard icon={Store} label="Vendors Located" value={vendors.length} />
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setView('sales')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'sales' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5" /> Ticket Sales
          </button>
          <button
            onClick={() => setView('vendors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'vendors' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            <MapPin className="w-4 h-4 inline mr-1.5" /> Vendor Locations
          </button>
          <button
            onClick={() => setView('booths')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'booths' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            <ClipboardList className="w-4 h-4 inline mr-1.5" /> Booth Management
          </button>
          <button
            onClick={() => setView('engagement')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'engagement' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1.5" /> Engagement
          </button>
        </div>

        {/* Sales view */}
        {view === 'sales' && (
          <div className="space-y-6">
            {/* Per-festival breakdown */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Festival Breakdown</h2>
              {isLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : festivals.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">No festivals found.</Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4 font-medium">Festival</th>
                        <th className="py-2 px-4 font-medium">Date</th>
                        <th className="py-2 px-4 font-medium text-right">Tickets</th>
                        <th className="py-2 px-4 font-medium text-right">Revenue</th>
                        <th className="py-2 px-4 font-medium text-right">Orders</th>
                        <th className="py-2 pl-4 font-medium">Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {festivals.map(f => {
                        const pct = f.capacity > 0 ? Math.min(100, (f.tickets_sold / f.capacity) * 100) : 0;
                        return (
                          <tr key={f.id} className="border-b border-border hover:bg-secondary/30">
                            <td className="py-3 pr-4">
                              <Link to={`/events/${f.id}`} className="font-medium text-foreground hover:text-accent line-clamp-1">{f.title}</Link>
                              {f.venue_name && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{f.venue_name}</p>}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {f.date ? new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">{f.tickets_sold}</td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {f.is_free ? <span className="text-green-600">Free</span> : `$${f.gross_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground">{f.order_count}</td>
                            <td className="py-3 pl-4">
                              {f.capacity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent sales */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Recent Sales</h2>
              {isLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : recentSales.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">No ticket sales recorded yet.</Card>
              ) : (
                <div className="space-y-2">
                  {recentSales.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm line-clamp-1">{s.festival_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.buyer_name || s.buyer_email || 'Unknown buyer'} · {s.order_number || ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-foreground text-sm">{s.quantity} × ${s.unit_price}</p>
                        <p className="text-xs text-muted-foreground">${(s.total_amount || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {s.payment_status === 'completed' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                        ) : s.payment_status === 'refunded' ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Refunded</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{s.payment_status || 'pending'}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                        {s.sale_date ? new Date(s.sale_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vendor map view */}
        {view === 'vendors' && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Map */}
              <div className="lg:flex-1 bg-card border border-border rounded-2xl overflow-hidden h-[400px] sm:h-[500px]">
                {isLoading ? (
                  <Skeleton className="h-full" />
                ) : (
                  <MapContainer center={BALTIMORE_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {pinnableFestivals.map(f => (
                      <Marker key={f.id} position={[f.latitude, f.longitude]} icon={festivalIcon}>
                        <Popup>
                          <div className="min-w-[160px]">
                            <p className="font-semibold text-sm">{f.title}</p>
                            {f.venue_name && <p className="text-xs text-gray-500 mt-0.5">{f.venue_name}</p>}
                            <p className="text-xs text-gray-500">{f.tickets_sold} tickets · {f.order_count} orders</p>
                            <a href={`/events/${f.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">View festival →</a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {vendors.map(v => (
                      <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vendorIcon}>
                        <Popup>
                          <div className="min-w-[160px]">
                            <p className="font-semibold text-sm">{v.name}</p>
                            {v.category && <p className="text-xs text-gray-500 capitalize mt-0.5">{v.category.replace('_', ' ')}</p>}
                            {v.address && <p className="text-xs text-gray-500 mt-0.5">{v.address}</p>}
                            <a href={`/businesses/${v.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">View vendor →</a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>

              {/* Vendor list */}
              <div className="lg:w-80 space-y-2 max-h-[500px] overflow-y-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{vendors.length} vendors with locations</span>
                </div>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                ) : vendors.length === 0 ? (
                  <Card className="p-6 text-center text-sm text-muted-foreground">No vendors with locations yet.</Card>
                ) : (
                  vendors.map(v => (
                    <Link key={v.id} to={`/businesses/${v.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-accent/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {v.image_url ? <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-accent" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm line-clamp-1">{v.name}</p>
                        {v.neighborhood_name && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{v.neighborhood_name}</p>}
                      </div>
                      {v.is_verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓</span>}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Festival sites</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /> Vendors</span>
            </div>
          </div>
        )}

        {/* Booth management view */}
        {view === 'booths' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-accent" /> Booth Management
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Add, track, and assign booth locations for all festival vendors in one place.</p>
            </div>
            <FestivalBoothManager festivals={festivals} />
          </div>
        )}

        {/* Engagement view */}
        {view === 'engagement' && <EngagementView festivals={festivals} />}
      </div>
    </div>
  );
}