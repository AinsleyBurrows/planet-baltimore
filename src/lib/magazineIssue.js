import { base44 } from '@/api/base44Client';
import { uid, buildCoverStyle } from '@/lib/magazineLayout';

/* Pages hold two stories each, the way the magazine is already laid out: a
   kicker, a headline, a deck and the story, with a photograph leading each page. */
const STORIES_PER_PAGE = 2;

const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    issue_label: { type: 'string' },
    tagline: { type: 'string' },
    description: { type: 'string' },
    cover_line: { type: 'string' },
    cover_deck: { type: 'string' },
    cover_photo: { type: 'string' },
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kicker: { type: 'string' },
          headline: { type: 'string' },
          subhead: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' } },
          quote: { type: 'string' },
          caption: { type: 'string' },
          photo: { type: 'string' },
        },
        required: ['kicker', 'headline', 'subhead', 'paragraphs', 'quote', 'caption', 'photo'],
      },
    },
  },
  required: ['issue_label', 'tagline', 'description', 'cover_line', 'cover_deck', 'cover_photo', 'stories'],
};

const buildPrompt = (magazine) => `You are the editor of ${magazine.title}, a Baltimore city magazine${
  magazine.tagline ? ` whose line is "${magazine.tagline}"` : ''
}. Write a complete, brand-new issue from scratch: eight short reported stories, not versions of the last issue.

Voice: reported, warm, specific, locally rooted. Baltimore readers should recognise the neighbourhoods, the blocks, the weather and the way the city talks.

Each story must have:
- kicker: two or three words, like "ARTS & CULTURE", "FOOD & DRINK", "TRANSIT", "CIVIC LIFE", "SMALL BUSINESS", "MUSIC", "YOUTH", "NEIGHBOURHOODS", "ENVIRONMENT", "HISTORY".
- headline: eight words or fewer.
- subhead: one sentence that sets up the story.
- paragraphs: three paragraphs of 55 to 85 words each.
- quote: one line pulled from the story (leave it empty for every second story).
- caption: a one-line photo caption (leave it empty when photo is empty).
- photo: a short brief for the photograph, only for the first story of each pair (who, where, the light, the mood, the picture only with no text or lettering in it); otherwise an empty string.

Rules:
- Every story is rooted in a real Baltimore neighbourhood: Hampden, Highlandtown, Station North, Remington, Federal Hill, Charles Village, Mount Vernon, Pigtown, Waverly, Lauraville, Park Heights, Sandtown-Winchester, Druid Hill, Fells Point, Reservoir Hill, Patterson Park.
- Every person is a fictional composite: a resident, artist, cook, shop owner, rider, student or organiser. Never put words in the mouth of a real public figure and never invent a quote from a real person.
- Spread the subjects: arts, music, food, small business, transit, civic life, environment, youth, history. No two stories on the same subject.
- It is late autumn, heading into the holidays.

The cover needs one cover line of nine words or fewer that would sell the issue on a newsstand, a one-sentence deck under it, and a brief for a striking cover photograph.

issue_label: the next issue number for this magazine (it is currently "${magazine.issue_label || 'Issue 01'}").
tagline: one short line for the issue, twelve words or fewer.
description: one or two sentences on what is inside.`;

const PAPER = '#faf7f2';

/* The written stories sometimes list their own field names inside the
   paragraph list, so each story is read back into its parts before it is laid
   out: the paragraphs stop where the field names begin, and a quote, caption or
   photo brief found in that tail is picked up when its own field is empty. */
const FIELD_NAMES = ['quote', 'caption', 'photo', 'paragraphs', 'headline', 'subhead', 'kicker'];

const readStory = (story) => {
  const items = Array.isArray(story.paragraphs) ? story.paragraphs : [];
  const cut = items.findIndex(
    (item) => typeof item === 'string' && FIELD_NAMES.includes(item.trim().toLowerCase()),
  );
  const tail = cut < 0 ? [] : items.slice(cut);

  const pulled = (field) => {
    const at = tail.findIndex((item) => typeof item === 'string' && item.trim().toLowerCase() === field);
    const value = at < 0 ? '' : tail[at + 1];
    return typeof value === 'string' ? value.trim() : '';
  };

  const field = (name) => (typeof story[name] === 'string' ? story[name].trim() : '');

  return {
    paragraphs: (cut < 0 ? items : items.slice(0, cut)).filter(
      (paragraph) => typeof paragraph === 'string' && paragraph.trim(),
    ),
    quote: field('quote') || pulled('quote'),
    caption: field('caption') || pulled('caption'),
    photo: field('photo') || pulled('photo'),
  };
};

const text = (type, value) => ({ id: uid(), type, text: value || '' });

/* One story: kicker, headline, deck, the photograph if it leads the page, the
   paragraphs, then the pull quote. */
const storyBlocks = (story, photoUrl, leadsPage, floatSide) => {
  const { paragraphs, quote, caption } = readStory(story);
  const blocks = [
    text('caption', story.kicker),
    text('headline', story.headline),
    text('subhead', story.subhead),
  ];

  if (leadsPage && photoUrl) {
    blocks.push({
      id: uid(),
      type: 'image',
      url: photoUrl,
      caption,
      float: floatSide,
      width: 44,
    });
  }

  paragraphs.forEach((paragraph) => blocks.push(text('body', paragraph)));

  if (quote) blocks.push(text('quote', quote));
  return blocks;
};

const pagesFromStories = (stories, photos) => {
  const pages = [];

  for (let start = 0; start < stories.length; start += STORIES_PER_PAGE) {
    const pageStories = stories.slice(start, start + STORIES_PER_PAGE);
    const pageIndex = pages.length;

    pages.push({
      id: uid(),
      bg_color: PAPER,
      blocks: pageStories.flatMap((story, position) =>
        storyBlocks(story, photos[pageIndex], position === 0, pageIndex % 2 === 0 ? 'right' : 'left'),
      ),
    });
  }

  return pages;
};

const photograph = async (brief) => {
  try {
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: `Editorial photograph for a Baltimore city magazine. ${brief}. Documentary 35mm photography, natural light, shallow depth of field, no text, no lettering, no watermark.`,
    });
    return url || '';
  } catch {
    return '';
  }
};

/**
 * Writes a whole new issue of an existing magazine and saves it as its own
 * record, ready to be read or edited.
 */
export async function generateIssue(magazine, user, onStep = () => {}) {
  onStep('Writing the issue');

  const plan = await base44.integrations.Core.InvokeLLM({
    prompt: buildPrompt(magazine),
    response_json_schema: ISSUE_SCHEMA,
  });

  const stories = (plan.stories || []).slice(0, 8);
  const pageCount = Math.ceil(stories.length / STORIES_PER_PAGE);
  /* One photograph leads each page */
  const pagePhotos = stories.filter((_, index) => index % STORIES_PER_PAGE === 0).slice(0, pageCount);

  onStep('Shooting the photographs');
  const photos = await Promise.all(
    [plan.cover_photo, ...pagePhotos.map((story) => story.photo)].map((brief) =>
      brief ? photograph(brief) : Promise.resolve(''),
    ),
  );
  const [coverPhoto, ...storyPhotos] = photos;

  onStep('Laying out the pages');

  const cover = buildCoverStyle('newsstand', {
    issue: plan.issue_label || magazine.issue_label || '',
    coverLine: plan.cover_line || '',
    deck: plan.cover_deck || '',
    photo: coverPhoto || '',
  });

  return base44.entities.Magazine.create({
    title: magazine.title,
    issue_label: plan.issue_label || '',
    tagline: plan.tagline || '',
    description: plan.description || '',
    cover_image_url: '',
    cover,
    pages: pagesFromStories(stories, storyPhotos),
    owner_id: user.id,
    owner_name: user.full_name,
    owner_avatar: user.avatar_url,
  });
}