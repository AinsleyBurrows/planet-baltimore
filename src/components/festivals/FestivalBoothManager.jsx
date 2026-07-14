import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Store, MapPin, Pencil, Trash2, Navigation, X, CircleDot, Loader2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = ['food', 'art', 'craft', 'merchandise', 'music', 'kids', 'info', 'bar', 'other'];
const CATEGORY_COLORS = {
  food: '#ef4444', art: '#8b5cf6', craft: '#f97316', merchandise: '#3b82f6',
  music: '#22c55e', kids: '#ec4899', info: '#64748b', bar: '#f59e0b', other: '#0ea5e9',
};

const STATUSES = ['pending', 'in_progress', 'complete'];
const NEXT_STATUS = { pending: 'in_progress', in_progress: 'complete', complete: 'pending' };
const STATUS_META = {
  pending: { label: 'Pending', icon: CircleDot, color: '#64748b', bg: '#64748b20' },
  in_progress: { label: 'In Progress', icon: Loader2, color: '#f59e0b', bg: '#f59e0b20' },
  complete: { label: 'Complete', icon: CheckCircle2, color: '#22c55e', bg: '#22c55e20' },
};

const empty = { event_id: '', booth_number: '', vendor_name: '', category: 'other', description: '', latitude: '', longitude: '', image_url: '', setup_status: 'pending', setup_notes: '' };

export default function FestivalBoothManager({ festivals }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [festivalFilter, setFestivalFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState(null); // booth object or 'new' or null
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: booths = [], isLoading } = useQuery({
    queryKey: ['festival-booths'],
    queryFn: () => base44.entities.FestivalBooth.list('-created_date', 500),
  });

  const festivalsWithId = festivals;

  const filtered = useMemo(() => {
    return booths.filter(b => {
      const matchFest = festivalFilter === 'all' || b.event_id === festivalFilter;
      const matchCat = categoryFilter === 'all' || b.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || (b.setup_status || 'pending') === statusFilter;
      const matchSearch = !search ||
        b.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.booth_number?.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase());
      return matchFest && matchCat && matchStatus && matchSearch;
    });
  }, [booths, festivalFilter, categoryFilter, statusFilter, search]);

  const festivalName = (id) => festivalsWithId.find(f => f.id === id)?.title || 'Unknown festival';

  const openAdd = () => { setForm(empty); setEditing('new'); };
  const openEdit = (booth) => {
    setForm({
      event_id: booth.event_id || '',
      booth_number: booth.booth_number || '',
      vendor_name: booth.vendor_name || '',
      category: booth.category || 'other',
      description: booth.description || '',
      latitude: booth.latitude ?? '',
      longitude: booth.longitude ?? '',
      image_url: booth.image_url || '',
      setup_status: booth.setup_status || 'pending',
      setup_notes: booth.setup_notes || '',
    });
    setEditing(booth.id);
  };
  const closeForm = () => { setEditing(null); setForm(empty); };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const useFestivalLocation = () => {
    const f = festivalsWithId.find(x => x.id === form.event_id);
    if (!f || !f.latitude) {
      toast({ title: 'No location', description: 'This festival has no coordinates set.', variant: 'destructive' });
      return;
    }
    setField('latitude', f.latitude);
    setField('longitude', f.longitude);
  };

  const save = async () => {
    if (!form.event_id || !form.booth_number || !form.vendor_name) {
      toast({ title: 'Missing fields', description: 'Festival, booth number, and vendor name are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        event_id: form.event_id,
        booth_number: form.booth_number.trim(),
        vendor_name: form.vendor_name.trim(),
        category: form.category,
        description: form.description?.trim() || undefined,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        image_url: form.image_url?.trim() || undefined,
        setup_status: form.setup_status,
        setup_notes: form.setup_notes?.trim() || undefined,
      };
      if (editing === 'new') {
        await base44.entities.FestivalBooth.create(payload);
        toast({ title: 'Booth added', description: `${payload.booth_number} · ${payload.vendor_name}` });
      } else {
        await base44.entities.FestivalBooth.update(editing, payload);
        toast({ title: 'Booth updated', description: `${payload.booth_number} · ${payload.vendor_name}` });
      }
      qc.invalidateQueries({ queryKey: ['festival-booths'] });
      closeForm();
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Could not save booth.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const removeBooth = async (booth) => {
    try {
      await base44.entities.FestivalBooth.delete(booth.id);
      qc.invalidateQueries({ queryKey: ['festival-booths'] });
      toast({ title: 'Booth removed', description: `${booth.booth_number} · ${booth.vendor_name}` });
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Could not delete booth.', variant: 'destructive' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const cycleStatus = async (booth) => {
    const current = booth.setup_status || 'pending';
    const next = NEXT_STATUS[current];
    try {
      await base44.entities.FestivalBooth.update(booth.id, {
        setup_status: next,
        setup_completed_at: next === 'complete' ? new Date().toISOString() : null,
      });
      qc.invalidateQueries({ queryKey: ['festival-booths'] });
      toast({ title: `${booth.booth_number} marked ${STATUS_META[next].label}`, description: booth.vendor_name });
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Could not update status.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booths by vendor, number, or description…"
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={festivalFilter}
          onChange={(e) => setFestivalFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">All festivals</option>
          {festivalsWithId.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <button
          onClick={openAdd}
          className="h-10 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 inline-flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Booth
        </button>
      </div>

      {/* Setup progress summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-accent" /> Setup Progress
          </p>
          <span className="text-xs text-muted-foreground">
            {booths.filter(b => (b.setup_status || 'pending') === 'complete').length}/{booths.length} complete
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${booths.length ? (booths.filter(b => (b.setup_status || 'pending') === 'complete').length / booths.length) * 100 : 0}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => {
            const count = booths.filter(b => (b.setup_status || 'pending') === s).length;
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === s ? 'ring-1 ring-border' : 'hover:bg-secondary'}`}
                style={{ background: meta.bg, color: meta.color }}
              >
                <Icon className={`w-3.5 h-3.5 ${s === 'in_progress' ? 'animate-spin' : ''}`} />
                {meta.label} <span className="opacity-70">· {count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <Store className="w-4 h-4 text-accent" />
        <span>{filtered.length} booths</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          No booths found. Click <span className="font-medium">Add Booth</span> to assign a vendor.
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-medium">Booth</th>
                <th className="py-2 px-3 font-medium">Vendor</th>
                <th className="py-2 px-3 font-medium hidden sm:table-cell">Festival</th>
                <th className="py-2 px-3 font-medium">Category</th>
                <th className="py-2 px-3 font-medium">Setup</th>
                <th className="py-2 px-3 font-medium hidden md:table-cell">Location</th>
                <th className="py-2 pl-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(booth => (
                <tr key={booth.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-white text-xs font-bold" style={{ background: CATEGORY_COLORS[booth.category] || CATEGORY_COLORS.other }}>
                      {booth.booth_number}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-foreground line-clamp-1">{booth.vendor_name}</p>
                    {booth.description && <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{booth.description}</p>}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
                    <p className="line-clamp-1">{festivalName(booth.event_id)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: `${CATEGORY_COLORS[booth.category] || CATEGORY_COLORS.other}20`, color: CATEGORY_COLORS[booth.category] || CATEGORY_COLORS.other }}>
                      {booth.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => cycleStatus(booth)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: STATUS_META[booth.setup_status || 'pending'].bg, color: STATUS_META[booth.setup_status || 'pending'].color }}
                      title="Click to advance status"
                    >
                      {(() => {
                        const meta = STATUS_META[booth.setup_status || 'pending'];
                        const Icon = meta.icon;
                        return <Icon className={`w-3.5 h-3.5 ${(booth.setup_status || 'pending') === 'in_progress' ? 'animate-spin' : ''}`} />;
                      })()}
                      {STATUS_META[booth.setup_status || 'pending'].label}
                    </button>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    {booth.latitude != null && booth.longitude != null ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        {Number(booth.latitude).toFixed(4)}, {Number(booth.longitude).toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(booth)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(booth)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={closeForm}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Store className="w-5 h-5 text-accent" />
                {editing === 'new' ? 'Add Booth' : 'Edit Booth'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Festival *</label>
                  <select value={form.event_id} onChange={(e) => setField('event_id', e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Select festival…</option>
                    {festivalsWithId.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Booth Number *</label>
                  <input value={form.booth_number} onChange={(e) => setField('booth_number', e.target.value)} placeholder="e.g. B12" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vendor Name *</label>
                <input value={form.vendor_name} onChange={(e) => setField('vendor_name', e.target.value)} placeholder="Vendor or business name" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What this booth offers…" rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Setup Status</label>
                  <select value={form.setup_status} onChange={(e) => setField('setup_status', e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Setup Notes</label>
                  <input value={form.setup_notes} onChange={(e) => setField('setup_notes', e.target.value)} placeholder="Optional notes…" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Booth Location (lat / lng)</label>
                  <button onClick={useFestivalLocation} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Use festival location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} placeholder="Latitude" className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  <input value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} placeholder="Longitude" className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Leave blank to place later, or copy the festival's coordinates as a starting point.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Image URL (optional)</label>
                <input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} placeholder="https://…" className="mt-1 w-full h-10 px-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-border sticky bottom-0 bg-card">
              <button onClick={closeForm} className="px-4 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50 inline-flex items-center gap-1.5">
                {saving ? <span className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" /> : <Store className="w-4 h-4" />}
                {saving ? 'Saving…' : editing === 'new' ? 'Add Booth' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-destructive" /></div>
              <div>
                <h3 className="font-bold">Remove booth?</h3>
                <p className="text-sm text-muted-foreground">{confirmDelete.booth_number} · {confirmDelete.vendor_name}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">This vendor will no longer appear on the festival map. This can't be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">Cancel</button>
              <button onClick={() => removeBooth(confirmDelete)} className="px-4 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}