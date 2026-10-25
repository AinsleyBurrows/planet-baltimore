import { base44 } from '@/api/base44Client';

/* Unique id for a page or block (client generated, stored with the record) */
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* Element palette offered in the editor */
export const BLOCK_TYPES = [
  { type: 'headline', label: 'Headline' },
  { type: 'subhead', label: 'Subhead' },
  { type: 'body', label: 'Body text' },
  { type: 'quote', label: 'Pull quote' },
  { type: 'image', label: 'Image' },
  { type: 'caption', label: 'Caption' },
  { type: 'advert', label: 'Advert' },
];

/* Typography per block role — shared by the editable and the published view,
   so a page looks the same while you build it and while readers read it. */
export const ROLE_CLASSES = {
  headline: 'font-serif font-bold text-neutral-900 text-[26px] sm:text-4xl lg:text-[44px] leading-[1.08] mb-3',
  subhead: 'font-serif italic text-neutral-600 text-base sm:text-xl leading-snug mb-5',
  body: 'font-serif text-neutral-800 text-[15px] sm:text-[17px] leading-[1.85] text-justify mb-5',
  quote: 'font-serif italic text-neutral-900 text-xl sm:text-2xl leading-snug text-center border-y border-neutral-300 py-5 my-6',
  caption: 'font-sans uppercase tracking-[0.18em] text-neutral-500 text-[10px] sm:text-[11px] leading-relaxed mb-4',
};

/* Layout controls — any element can be wrapped, sized, aligned and spaced, so
   covers and pages can be laid out the way the editor wants them. */
export const FLOAT_SIDE_CLASSES = {
  left: 'float-left mr-4 sm:mr-6 mb-4',
  right: 'float-right ml-4 sm:ml-6 mb-4',
};

/* Space above an element, in steps (0 = the element's own spacing) */
export const SPACE_CLASSES = ['', 'mt-2', 'mt-6', 'mt-12', 'mt-20'];
export const SPACE_STEPS = SPACE_CLASSES.length - 1;

/* Width and alignment are inline, so an element's own typography can never win
   over the layout the editor chose for it. */
export const blockWidth = (block) => (block.width ? { width: `${block.width}%` } : undefined);
export const blockAlign = (block) => (block.align ? { textAlign: block.align } : undefined);
export const blockStyle = (block) => ({ ...blockAlign(block), ...blockWidth(block) });

/* Wrapping and spacing, as classes. `fullIsDefault` is for text elements, where
   sitting in the column is the normal state and must not add a clear. */
export const layoutClass = (block, { fullIsDefault = false } = {}) => {
  const parts = [];
  const wrapped = FLOAT_SIDE_CLASSES[block.float];
  if (wrapped) parts.push(wrapped);
  else if (block.float === 'full' && !fullIsDefault) parts.push('float-none clear-both mb-6');
  if (!wrapped && block.width && block.width < 100) parts.push('mx-auto');
  const space = SPACE_CLASSES[Number(block.space_before) || 0];
  if (space) parts.push(space);
  return parts.join(' ');
};

export const DROP_CAP_CLASS =
  'first-letter:float-left first-letter:font-serif first-letter:font-bold first-letter:text-[52px] first-letter:leading-[0.78] first-letter:pr-2 first-letter:pt-1';

export const BLOCK_PLACEHOLDERS = {
  headline: 'Headline',
  subhead: 'Subhead or deck line',
  body: 'Write your page here',
  quote: 'Pull quote',
  caption: 'Caption',
};

/* Light paper tones only, so the page text stays readable */
export const BG_SWATCHES = ['#ffffff', '#faf7f2', '#f4efe4', '#eef2f6', '#f6eef1', '#eef4ef'];

const STARTER_TEXT = {
  headline: 'A headline for your page',
  subhead: 'A deck line that sets up the story',
  body: 'Start writing here. Drag any photo on this page and the words will flow around it.',
  quote: 'A line worth pulling out.',
  caption: 'Photo caption',
  advert: 'Say what you are offering, in a sentence or two.',
};

export const createBlock = (type) => {
  if (type === 'image') {
    return { id: uid(), type: 'image', url: '', caption: '', float: 'full', width: 100 };
  }
  if (type === 'advert') {
    return {
      id: uid(),
      type: 'advert',
      advertiser: 'Your business',
      text: STARTER_TEXT.advert,
      cta: 'Learn more',
      url: '',
      float: 'full',
      width: 100,
    };
  }
  return { id: uid(), type, text: STARTER_TEXT[type] || '' };
};

export const createPage = () => ({
  id: uid(),
  bg_color: '#ffffff',
  blocks: [createBlock('headline'), createBlock('subhead'), createBlock('body')],
});

/* A cover is laid out like a page, but the sheet is half a page tall */
export const createCover = ({ title = '', issue_label = '', tagline = '' } = {}) => ({
  id: uid(),
  bg_color: '#ffffff',
  blocks: [
    { ...createBlock('caption'), text: issue_label || 'Issue 01' },
    { ...createBlock('headline'), text: title || 'Your magazine name' },
    { ...createBlock('subhead'), text: tagline || 'What this issue promises' },
    { ...createBlock('image'), caption: 'Cover photo' },
  ],
});

export const createMagazine = () => ({
  title: 'Untitled Magazine',
  issue_label: '',
  tagline: '',
  description: '',
  cover_image_url: '',
  cover: createCover({ title: 'Untitled Magazine' }),
  pages: [createPage()],
});

/* Magazine photos are stored publicly so every reader can see them. */
export const uploadMagazineImage = async (file) => {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
};