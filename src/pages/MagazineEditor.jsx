import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, Loader2, Pencil, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import MagazinePageView from '@/components/magazine/MagazinePageView';
import MagazinePager from '@/components/magazine/MagazinePager';
import MagazinePageTools from '@/components/magazine/MagazinePageTools';
import MagazineSettingsPanel from '@/components/magazine/MagazineSettingsPanel';
import { createBlock, createMagazine, createPage } from '@/lib/magazineLayout';

export default function MagazineEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [magazine, setMagazine] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;
        setMe(user);
        if (id) {
          const record = await base44.entities.Magazine.get(id);
          if (!active) return;
          setMagazine({ ...record, pages: record.pages?.length ? record.pages : [createPage()] });
        } else {
          setMagazine({
            ...createMagazine(),
            owner_id: user.id,
            owner_name: user.full_name,
            owner_avatar: user.avatar_url,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  const pages = magazine?.pages || [];
  const currentPage = pages[index] || pages[0];

  const updateMagazine = (updates) => setMagazine((current) => ({ ...current, ...updates }));
  const updatePage = (updates) =>
    updateMagazine({ pages: pages.map((page, pageIndex) => (pageIndex === index ? { ...page, ...updates } : page)) });

  const addBlock = (type) => {
    updatePage({ blocks: [...(currentPage.blocks || []), createBlock(type)] });
    setPreview(false);
  };

  const addPage = () => {
    const next = [...pages, createPage()];
    updateMagazine({ pages: next });
    setIndex(next.length - 1);
    setSelectedId(null);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    const next = pages.filter((_, pageIndex) => pageIndex !== index);
    updateMagazine({ pages: next });
    setIndex(Math.min(index, next.length - 1));
    setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: magazine.title?.trim() || 'Untitled Magazine',
        issue_label: magazine.issue_label || '',
        tagline: magazine.tagline || '',
        description: magazine.description || '',
        cover_image_url: magazine.cover_image_url || '',
        pages: magazine.pages,
      };
      if (magazine.id) {
        await base44.entities.Magazine.update(magazine.id, payload);
        setSaved(true);
      } else {
        const created = await base44.entities.Magazine.create({
          ...payload,
          owner_id: me.id,
          owner_name: me.full_name,
          owner_avatar: me.avatar_url,
        });
        navigate(`/magazines/${created.id}/edit`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteMagazine = async () => {
    if (!magazine.id || !window.confirm(`Delete "${magazine.title}"? This cannot be undone.`)) return;
    await base44.entities.Magazine.delete(magazine.id);
    navigate('/magazines');
  };

  if (loading || !magazine || !me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (id && magazine.owner_id !== me.id && me.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-xl font-bold">This magazine belongs to someone else</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can start your own magazine from the Magazines page.</p>
        <Link to="/magazines">
          <Button className="mt-5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
            Back to magazines
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/magazines">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to magazines">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl font-bold sm:text-2xl">{magazine.title || 'Untitled Magazine'}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} ·{' '}
              {preview
                ? 'Reader preview — this is what your readers see'
                : 'Drag a photo to move it and the words flow around it'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-semibold text-accent">Saved</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview((value) => !value)}
            className="h-9 gap-1.5 rounded-lg text-xs"
          >
            {preview ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Edit layout
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="h-9 gap-1.5 rounded-lg bg-accent text-xs text-accent-foreground hover:bg-accent/90"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${preview ? '' : 'lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <main className="min-w-0">
          <MagazinePageView
            page={currentPage}
            pageNumber={index + 1}
            totalPages={pages.length}
            magazineTitle={magazine.title}
            issueLabel={magazine.issue_label}
            editable={!preview}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={(blocks) => updatePage({ blocks })}
          />
          <MagazinePager
            index={index}
            total={pages.length}
            onChange={(next) => {
              setIndex(next);
              setSelectedId(null);
            }}
            className="mt-6"
          />
        </main>

        {!preview && (
          <aside className="space-y-4">
            <MagazinePageTools
              page={currentPage}
              pageIndex={index}
              pageCount={pages.length}
              onPageChange={updatePage}
              onAddBlock={addBlock}
              onAddPage={addPage}
              onDeletePage={deletePage}
            />
            <MagazineSettingsPanel
              magazine={magazine}
              onChange={updateMagazine}
              onDelete={magazine.id ? deleteMagazine : undefined}
            />
          </aside>
        )}
      </div>
    </div>
  );
}