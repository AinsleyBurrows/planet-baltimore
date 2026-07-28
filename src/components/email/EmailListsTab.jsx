import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Users, Trash2, Plus, Loader2 } from 'lucide-react';
import EmailListContactsModal from './EmailListContactsModal';

export default function EmailListsTab() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [activeList, setActiveList] = useState(null);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['email-lists', user?.id],
    queryFn: () => base44.entities.EmailList.filter({ owner_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const createList = async () => {
    if (!name.trim()) return;
    await base44.entities.EmailList.create({ name: name.trim(), owner_id: user.id, contact_count: 0 });
    setName('');
    qc.invalidateQueries({ queryKey: ['email-lists', user?.id] });
    toast({ title: 'List created' });
  };

  const deleteList = async (list) => {
    if (!confirm(`Delete "${list.name}" and all its contacts?`)) return;
    await base44.entities.EmailListContact.deleteMany({ list_id: list.id, owner_id: user.id });
    await base44.entities.EmailList.delete(list.id);
    qc.invalidateQueries({ queryKey: ['email-lists', user?.id] });
    toast({ title: 'List deleted' });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="New list name (e.g. VIP Guests)" onKeyDown={e => e.key === 'Enter' && createList()} />
        <Button onClick={createList} className="text-white shrink-0" style={{ backgroundColor: '#d4580a' }}><Plus className="w-4 h-4" /> Create</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-semibold text-foreground">No lists yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first list above, then import emails.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lists.map(list => (
            <div key={list.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#d4580a]/10 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-[#d4580a]" /></div>
                  <p className="font-semibold text-foreground truncate">{list.name}</p>
                </div>
                <button onClick={() => deleteList(list)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">{list.contact_count || 0} contacts</p>
              <Button variant="outline" className="w-full" onClick={() => setActiveList(list)}>Manage & Import</Button>
            </div>
          ))}
        </div>
      )}

      {activeList && <EmailListContactsModal list={activeList} onClose={() => setActiveList(null)} />}
    </div>
  );
}