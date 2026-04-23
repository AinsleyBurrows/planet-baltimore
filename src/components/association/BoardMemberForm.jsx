import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ROLES = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'committee_chair', label: 'Committee Chair' },
  { value: 'other', label: 'Other (specify)' },
];

export default function BoardMemberForm({ associationId, member, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    role: member?.role || 'board_member',
    custom_role: member?.custom_role || '',
    bio: member?.bio || '',
    email: member?.email || '',
    phone: member?.phone || '',
    show_contact: member?.show_contact ?? true,
    term_start: member?.term_start || '',
    term_end: member?.term_end || '',
    sort_order: member?.sort_order || 0,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(member?.photo_url || null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let photo_url = member?.photo_url || '';
      if (photoFile) {
        const res = await base44.integrations.Core.UploadFile({ file: photoFile });
        photo_url = res.file_url;
      }
      const data = { ...form, photo_url, association_id: associationId, is_active: true };
      if (member?.id) return base44.entities.BoardMember.update(member.id, data);
      return base44.entities.BoardMember.create(data);
    },
    onSuccess: onSaved,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-semibold text-foreground">{member ? 'Edit' : 'Add'} Board Member</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-dashed border-primary/30">
              {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <span className="text-primary/40 text-xl font-bold">{form.name?.charAt(0) || '?'}</span>}
            </div>
            <label className="cursor-pointer">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors">
                <Upload className="w-3.5 h-3.5" />Photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>

          <div>
            <Label>Full Name *</Label>
            <Input className="mt-1" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={v => set('role', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.role === 'other' && (
            <div>
              <Label>Custom Title</Label>
              <Input className="mt-1" placeholder="e.g. Events Coordinator" value={form.custom_role} onChange={e => set('custom_role', e.target.value)} />
            </div>
          )}

          <div>
            <Label>Bio</Label>
            <Textarea className="mt-1" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Term Start</Label>
              <Input className="mt-1" type="date" value={form.term_start} onChange={e => set('term_start', e.target.value)} />
            </div>
            <div>
              <Label>Term End</Label>
              <Input className="mt-1" type="date" value={form.term_end} onChange={e => set('term_end', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show contact info publicly</Label>
            <Switch checked={form.show_contact} onCheckedChange={v => set('show_contact', v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.name}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}