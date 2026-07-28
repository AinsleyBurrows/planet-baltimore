export const EMAIL_PLACEHOLDER_DEFAULTS = {
  event_name: 'our event',
  date: 'soon',
  venue: '',
  organizer_name: 'Planet Baltimore',
};

export function fillTemplate(text, event, user) {
  const dateStr = event?.date
    ? new Date(event.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : EMAIL_PLACEHOLDER_DEFAULTS.date;
  return text
    .replace(/{{event_name}}/g, event?.title || EMAIL_PLACEHOLDER_DEFAULTS.event_name)
    .replace(/{{date}}/g, dateStr)
    .replace(/{{venue}}/g, event?.venue_name || EMAIL_PLACEHOLDER_DEFAULTS.venue)
    .replace(/{{organizer_name}}/g, user?.full_name || EMAIL_PLACEHOLDER_DEFAULTS.organizer_name);
}

export const EMAIL_TEMPLATES = [
  {
    id: 'save-the-date',
    name: 'Save the Date',
    category: 'pre-sale',
    subject: 'Save the date: {{event_name}} is coming',
    body: "Mark your calendar — {{event_name}} is officially happening {{date}}.\n\nWe're pulling together something special and you'll want to be there. Tickets drop soon, so keep an eye on your inbox.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'invite',
    name: "You're Invited",
    category: 'invitation',
    subject: "You're invited to {{event_name}}",
    body: "We'd love to see you at {{event_name}} on {{date}}.\n\nIt's going to be a memorable time — secure your spot while you can.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'onsale',
    name: 'Tickets On Sale',
    category: 'ticket',
    subject: 'Tickets are now live for {{event_name}}',
    body: "Tickets just went on sale for {{event_name}} on {{date}}.\n\nEarly-bird pricing is available for a limited time — grab yours before they're gone.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'lineup',
    name: 'Lineup Announcement',
    category: 'pre-sale',
    subject: 'The lineup for {{event_name}} is here',
    body: "We've locked in the lineup for {{event_name}} on {{date}}, and it does not disappoint.\n\nThis is your crew. This is your night. Lock in your ticket now and we'll see you there.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'early-bird-ending',
    name: 'Early Bird Ending',
    category: 'ticket',
    subject: 'Last chance for early-bird tickets to {{event_name}}',
    body: "Heads up — early-bird pricing for {{event_name}} ends soon.\n\nAfter that, tickets go to full price. Grab yours now and keep that extra cash for the bar.\n\n{{venue}} · {{date}}\n\n— {{organizer_name}}",
  },
  {
    id: 'group',
    name: 'Bring Your Crew',
    category: 'ticket',
    subject: "Don't go solo — bring your crew to {{event_name}}",
    body: "Everything's better with your people. {{event_name}} is {{date}} and tickets are moving fast.\n\nForward this to the group chat and lock in your squad before it sells out.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'vip',
    name: 'VIP Upgrade',
    category: 'upsell',
    subject: 'Upgrade your {{event_name}} experience',
    body: "Want the full experience at {{event_name}}?\n\nVIP gets you skip-the-line entry, the best views, and exclusive access the general crowd won't see. Limited VIP spots are available — upgrade before they're gone.\n\n{{date}} · {{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    category: 'reminder',
    subject: 'Reminder: {{event_name}} is almost here',
    body: "See you soon at {{event_name}}! Here are the details:\n\nWhen: {{date}}\nWhere: {{venue}}\n\nCan't wait to see you there. Got your ticket yet? There's still time.\n\n— {{organizer_name}}",
  },
  {
    id: 'lastcall',
    name: 'Last Call',
    category: 'ticket',
    subject: 'Last call: {{event_name}} is almost here',
    body: "Just a heads up — {{event_name}} happens {{date}} and tickets are almost gone.\n\nThis is your last chance to grab one before doors close. Don't be the one hearing about it after.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'waitlist',
    name: 'Waitlist Open',
    category: 'ticket',
    subject: 'A spot just opened up at {{event_name}}',
    body: "Good news — a spot just opened up for {{event_name}} on {{date}}.\n\nIt's first come, first served, so claim yours now before it's taken.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'thanks',
    name: 'Thank You',
    category: 'post-event',
    subject: 'Thank you for coming to {{event_name}}',
    body: "Thank you for being part of {{event_name}}. The energy you brought made the night what it was.\n\nStay tuned for what's next — and bring a friend next time.\n\n— {{organizer_name}}",
  },
  {
    id: 'feedback',
    name: 'Post-Event Survey',
    category: 'post-event',
    subject: 'Tell us how {{event_name}} was for you',
    body: "Thanks for coming out to {{event_name}}! We want to make the next one even better.\n\nTake a quick minute to share your thoughts — it genuinely shapes what we do next.\n\n— {{organizer_name}}",
  },
];