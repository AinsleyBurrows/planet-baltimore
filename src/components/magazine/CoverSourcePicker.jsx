import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadMagazineImage } from '@/lib/magazineLayout';

/* Covers can be designed here from elements, or uploaded whole — either a cover
   made in another app or a finished design. An upload takes the sheet. */
export default function CoverSourcePicker({ coverUrl, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => fileRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onUpload?.(await uploadMagazineImage(file));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <Label className="text-xs">Cover</Label>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {coverUrl
          ? 'Your uploaded cover is the cover readers see.'
          : 'Upload a cover you designed elsewhere, or lay one out from the elements below.'}
      </p>

      {coverUrl ? (
        <div className="mt-2 flex items-start gap-2">
          <img
            src={coverUrl}
            alt="Uploaded cover"
            className="h-20 w-16 shrink-0 rounded border border-border object-cover"
          />
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={pick}
              disabled={uploading}
              className="h-8 gap-1.5 text-xs"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}{' '}
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" /> Design instead
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={pick}
          disabled={uploading}
          className="mt-2 h-9 w-full justify-start gap-2 text-xs"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}{' '}
          Upload a finished cover
        </Button>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}