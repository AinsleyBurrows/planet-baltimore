import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BylawsEditor({ association, onClose, onSaved }) {
  const [bylawsText, setBylawsText] = useState(association.bylaws_text || '');
  const [visibility, setVisibility] = useState(association.bylaws_visibility || 'public');
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState('');

  const handleDocFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let bylaws_doc_url = association.bylaws_doc_url || '';
      if (docFile) {
        const res = await base44.integrations.Core.UploadFile({ file: docFile });
        bylaws_doc_url = res.file_url;
      }
      return base44.entities.CommunityAssociation.update(association.id, {
        bylaws_text: bylawsText,
        bylaws_doc_url,
        bylaws_visibility: visibility,
        bylaws_updated_at: new Date().toISOString(),
      });
    },
    onSuccess: onSaved,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Edit By Laws</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — anyone can view</SelectItem>
                <SelectItem value="members_only">Members Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Upload PDF / Document (optional)</Label>
            <label className="mt-1 cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl hover:bg-secondary/50 transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{docFileName || (association.bylaws_doc_url ? 'Replace existing document' : 'Choose file...')}</span>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleDocFile} />
            </label>
          </div>

          <div>
            <Label>Bylaws Text</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Paste or type your bylaws text here. You can use this alongside the document upload.</p>
            <Textarea
              rows={16}
              className="mt-1 font-mono text-sm"
              placeholder="Article I: Name and Purpose&#10;Section 1.1: This organization shall be known as..."
              value={bylawsText}
              onChange={e => setBylawsText(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {mutation.isPending ? 'Saving...' : 'Save Bylaws'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}