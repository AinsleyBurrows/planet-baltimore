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
    id: 'lastcall',
    name: 'Last Call',
    category: 'ticket',
    subject: 'Last call: {{event_name}} is almost here',
    body: "Just a heads up — {{event_name}} happens {{date}} and tickets are almost gone.\n\nThis is your last chance to grab one before doors close.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'waitlist',
    name: 'Waitlist Open',
    category: 'ticket',
    subject: 'A spot just opened up at {{event_name}}',
    body: "Good news — a spot just opened up for {{event_name}} on {{date}}.\n\nIt's first come, first served, so claim yours now before it's taken.\n\n{{venue}}\n\n— {{organizer_name}}",
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    category: 'reminder',
    subject: 'Reminder: {{event_name}} is tomorrow',
    body: "See you tomorrow at {{event_name}}! Here are the details:\n\nWhen: {{date}}\nWhere: {{venue}}\n\nCan't wait to see you there.\n\n— {{organizer_name}}",
  },
  {
    id: 'thanks',
    name: 'Thank You',
    category: 'post-event',
    subject: 'Thank you for coming to {{event_name}}',
    body: "Thank you for being part of {{event_name}}. It meant the world to have you there.\n\nStay tuned for what's next — and bring a friend next time.\n\n— {{organizer_name}}",
  },
];