import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import EditableText from './EditableText';
import { ROLE_CLASSES, uploadMagazineImage, layoutClass, blockStyle } from '@/lib/magazineLayout';

export default function MagazineImageBlock({ block, editable, selected, dragging, onSelect, onStartDrag, onUpdate }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onUpdate({ url: await uploadMagazineImage(file) });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const sized = { ...block, float: block.float || 'full', width: block.width || 100 };
  const figureClasses = `${layoutClass(sized)} relative m-0 ${selected ? 'ring-2 ring-accent/50' : ''}`;
  const width = blockStyle(sized);

  if (!block.url) {
    if (!editable) return null;
    return (
      <figure className={figureClasses} style={width}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-100"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-medium">Add photo</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </figure>
    );
  }

  return (
    <figure className={figureClasses} style={width}>
      <img
        src={block.url}
        alt={block.caption || ''}
        draggable={false}
        onPointerDown={editable ? onStartDrag : undefined}
        onClick={editable ? onSelect : undefined}
        className={`block h-auto w-full select-none rounded-sm ${dragging ? 'opacity-70' : ''} ${
          editable ? 'cursor-grab touch-none active:cursor-grabbing' : ''
        }`}
      />
      {editable ? (
        <EditableText
          value={block.caption}
          onChange={(caption) => onUpdate({ caption })}
          placeholder="Add a caption"
          className={`${ROLE_CLASSES.caption} mt-2 text-center`}
        />
      ) : (
        block.caption?.trim() && (
          <figcaption className={`${ROLE_CLASSES.caption} mt-2 text-center`}>{block.caption}</figcaption>
        )
      )}
      {editable && selected && (
        <button
          type="button"
          aria-label="Change photo"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => fileRef.current?.click()}
          className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-black/75"
        >
          Change
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </figure>
  );
}