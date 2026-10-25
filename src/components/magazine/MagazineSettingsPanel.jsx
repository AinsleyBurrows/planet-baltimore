import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadMagazineImage } from '@/lib/magazineLayout';

export default function MagazineSettingsPanel({ magazine, onChange, onDelete }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange({ cover_image_url: await uploadMagazineImage(file) });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Magazine details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Title</Label>
          <Input value={magazine.title || ''} onChange={(event) => onChange({ title: event.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Issue label</Label>
          <Input
            value={magazine.issue_label || ''}
            placeholder="Issue 01"
            onChange={(event) => onChange({ issue_label: event.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Tagline</Label>
          <Input
            value={magazine.tagline || ''}
            placeholder="Stories from the city we call home"
            onChange={(event) => onChange({ tagline: event.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">About</Label>
          <Textarea
            rows={3}
            value={magazine.description || ''}
            onChange={(event) => onChange({ description: event.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Cover image</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex h-20 w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 text-xs text-muted-foreground transition-colors hover:bg-secondary"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : magazine.cover_image_url ? (
              <img src={magazine.cover_image_url} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus className="h-4 w-4" /> Upload cover
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete magazine
          </Button>
        )}
      </CardContent>
    </Card>
  );
}