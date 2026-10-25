import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BLOCK_TYPES, BG_SWATCHES } from '@/lib/magazineLayout';

export default function MagazinePageTools({
  page,
  pageIndex,
  pageCount,
  variant = 'page',
  onPageChange,
  onAddBlock,
  onAddPage,
  onDeletePage,
}) {
  const isCover = variant === 'cover';
  /* A cover is one sheet, so it has nothing to continue onto; the masthead
     belongs to the cover only. */
  const blockTypes = isCover
    ? BLOCK_TYPES.filter((blockType) => !blockType.type.startsWith('continued_'))
    : BLOCK_TYPES.filter((blockType) => blockType.type !== 'masthead');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{isCover ? 'Cover elements' : `Page ${pageIndex + 1} elements`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {blockTypes.map((blockType) => (
            <Button
              key={blockType.type}
              variant="outline"
              size="sm"
              onClick={() => onAddBlock(blockType.type)}
              className="h-9 justify-start gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> {blockType.label}
            </Button>
          ))}
        </div>

        <div>
          <Label className="text-xs">{isCover ? 'Cover background' : 'Page background'}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BG_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Page background ${color}`}
                onClick={() => onPageChange({ bg_color: color })}
                style={{ backgroundColor: color }}
                className={`h-7 w-7 rounded-full border transition-transform ${
                  (page.bg_color || '#ffffff') === color
                    ? 'scale-105 border-accent ring-2 ring-accent/40'
                    : 'border-border'
                }`}
              />
            ))}
          </div>
        </div>

        {!isCover && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAddPage} className="h-9 flex-1 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add page
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pageCount <= 1}
              onClick={onDeletePage}
              className="h-9 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove page
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}