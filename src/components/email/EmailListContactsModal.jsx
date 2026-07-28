import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { X, Upload, Trash2, Loader2, Mail } from 'lucide-react';

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
function parseEmails(text) {
  const found = (text.match(EMAIL_RE) || []).map(e => e.toLowerCase().trim());
  return [...new Set(found)];
}

export default function EmailListContactsModal({ list, onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['email-list-contacts', list.id],
    queryFn: () => base44.entities.EmailListContact.filter({ list_id: list.id, owner_id: user.id }, 'email', 500),
    enabled: !!user?.id,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['email-list-contacts', list.id] });
    qc.invalidateQueries({ queryKey: ['email-lists', user?.id] });
  };

  const importEmails = async (source) => {
    const emails = parseEmails(paste);
    if (emails.length === 0) { toast({ title: 'No valid emails found', variant: 'destructive' }); return; }
    setBusy(true);
    const existing = new Set(contacts.map(c => c.email));
    const toCreate = emails.filter(e => !existing.has(e)).map(e => ({ list_id: list.id, owner_id: user.id, email: e, status: 'subscribed', source }));
    if (toCreate.length) await base44.entities.EmailListContact.bulkCreate(toCreate);
    await base44.entities.EmailList.update(list.id, { contact_count: contacts.length + toCreate.length });
    setPaste('');
    setBusy(false);
    refresh();
    toast({ title: `Imported ${toCreate.length} new ${toCreate.length === 1 ? 'contact' : 'contacts'}`, description: emails.length - toCreate.length > 0 ? `${emails.length - toCreate.length} already on the list.` : undefined });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const text = await file.text();
    setPaste(text);
    setBusy(false);
  };

  const removeContact = async (c) => {
    await base44.entities.EmailListContact.delete(c.id);
    await base44.entities.EmailList.update(list.id, { contact_count: Math.max(0, contacts.length - 1) });
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div><p className="font-semibold text-foreground">{list.name}</p><p className="text-xs text-muted-foreground">{contacts.length} contacts</p></div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Paste emails or upload a CSV/TXT</label>
            <textarea value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste emails here (comma, newline, or space separated)…" rows={4} className="w-full mt-1 p-3 rounded-xl bg-secondary/50 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            <div className="flex gap-2 mt-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium cursor-pointer hover:bg-secondary">
                <Upload className="w-4 h-4" /> Upload file
                <input type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
              </label>
              <Button onClick={() => importEmails('paste')} disabled={busy || !paste.trim()} className="text-white" style={{ backgroundColor: '#d4580a' }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Import
              </Button>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No contacts yet. Import some above.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{c.email}</span>
                    </div>
                    <button onClick={() => removeContact(c)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}