import React from 'react';
import MagazinePageView from '@/components/magazine/MagazinePageView';
import MagazineUploadedCover from '@/components/magazine/MagazineUploadedCover';

/**
 * One printed sheet in the reader: the cover on its own, or a page of the
 * issue. Rendered at the magazine's own page measure and scaled by the stage,
 * so a spread reads exactly as it was laid out.
 */
export default function ReaderSheet({ item, magazine }) {
  const total = magazine.pages?.length || 0;

  if (item.cover) {
    if (magazine.cover_image_url) {
      return (
        <div className="h-full min-h-[1080px] bg-white">
          <MagazineUploadedCover url={magazine.cover_image_url} title={magazine.title} />
        </div>
      );
    }

    return (
      <MagazinePageView
        page={magazine.cover}
        pageNumber={1}
        totalPages={total}
        magazineTitle={magazine.title}
        issueLabel={magazine.issue_label}
        compact
        footerRight="Cover"
      />
    );
  }

  if (!item.page) return <div className="h-full min-h-[1080px] bg-white" />;

  return (
    <MagazinePageView
      page={item.page}
      pageNumber={item.number}
      totalPages={total}
      magazineTitle={magazine.title}
      issueLabel={magazine.issue_label}
    />
  );
}