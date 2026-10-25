import { base44 } from '@/api/base44Client';

/* Unique id for a page or block (client generated, stored with the record) */
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* Element palette offered in the editor */
export const BLOCK_TYPES = [
  { type: 'masthead', label: 'Magazine name' },
  { type: 'headline', label: 'Headline' },
  { type: 'subhead', label: 'Subhead' },
  { type: 'body', label: 'Body text' },
  { type: 'quote', label: 'Pull quote' },
  { type: 'image', label: 'Image' },
  { type: 'caption', label: 'Caption' },
  { type: 'advert', label: 'Advert' },
  { type: 'continued_on', label: 'Continues on' },
  { type: 'continued_from', label: 'Continued from' },
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

/* The cue that carries a story over a page break, at the foot of one page and
   the top of the next. The page number is worked out from where it sits. */
export const CONTINUED_CLASS =
  'font-sans uppercase tracking-[0.18em] text-neutral-500 text-[10px] sm:text-[11px] border-neutral-300';

/* The magazine's own name, set large over the cover photo */
export const MASTHEAD_CLASS =
  'font-serif font-bold uppercase leading-[0.92] tracking-[0.01em] text-[38px] sm:text-[64px]';

/* Cover text laid over the photo. The sheet is what it holds on to, so the
   words keep their place whatever the photo is doing underneath. */
export const OVERLAY_ANCHORS = [
  { value: 'top', label: 'Top' },
  { value: 'middle', label: 'Middle' },
  { value: 'bottom', label: 'Bottom' },
];

const OVERLAY_ANCHOR_CLASSES = {
  top: 'top-8 sm:top-12',
  middle: 'top-1/2 -translate-y-1/2',
  bottom: 'bottom-14 sm:bottom-20',
};

const OVERLAY_LAYER_CLASSES = { front: 'z-20', behind: 'z-0' };

/* Cover text sits in one of six places: three heights, in front of the photo
   or behind it. Elements sharing a place stack in order. */
export const OVERLAY_SLOTS = ['top', 'middle', 'bottom'].flatMap((anchor) =>
  ['behind', 'front'].map((layer) => ({ anchor, layer })),
);

export const overlayKey = (block) => `${block.overlay_anchor || 'top'}|${block.overlay_layer || 'front'}`;

export const overlaySlotClass = (anchor, layer) =>
  `absolute inset-x-0 ${OVERLAY_ANCHOR_CLASSES[anchor] || OVERLAY_ANCHOR_CLASSES.top} ${
    OVERLAY_LAYER_CLASSES[layer] || OVERLAY_LAYER_CLASSES.front
  } flex flex-col gap-1 px-8 sm:px-14`;

/* Text colours for cover lines, plus the shadow that keeps them legible */
export const COVER_TEXT_COLORS = [
  { value: '', label: 'Sheet' },
  { value: '#ffffff', label: 'White' },
  { value: '#0f1729', label: 'Ink' },
  { value: '#1b294b', label: 'Navy' },
  { value: '#b3261e', label: 'Red' },
];

export const TEXT_SHADOW_CLASS = '[text-shadow:0_2px_18px_rgba(0,0,0,0.55)]';

export const textColorStyle = (block) => (block.text_color ? { color: block.text_color } : undefined);
export const textShadowClass = (block) => (block.shadow ? TEXT_SHADOW_CLASS : '');

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
  if (type === 'masthead') {
    return { id: uid(), type: 'masthead', text: '' };
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

/* A cover is one sheet with the photo running to its edges and the magazine's
   own name laid over the picture — the newsstand look. */
export const createCover = ({ title = '', issue_label = '', tagline = '' } = {}) => ({
  id: uid(),
  bg_color: '#ffffff',
  blocks: [
    { ...createBlock('image'), caption: '', bleed: true },
    {
      ...createBlock('masthead'),
      text: title,
      overlay: true,
      overlay_anchor: 'top',
      align: 'center',
      text_color: '#ffffff',
      shadow: true,
    },
    {
      ...createBlock('caption'),
      text: issue_label || 'Issue 01',
      overlay: true,
      overlay_anchor: 'top',
      align: 'center',
      text_color: '#ffffff',
      shadow: true,
    },
    {
      ...createBlock('headline'),
      text: tagline || 'What this issue promises',
      overlay: true,
      overlay_anchor: 'bottom',
      align: 'left',
      width: 90,
      text_color: '#ffffff',
      shadow: true,
    },
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