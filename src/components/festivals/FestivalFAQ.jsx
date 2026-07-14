import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_SECTIONS = [
  {
    title: 'Getting There',
    items: [
      { q: 'Where are the festivals held?', a: 'Most festivals take place in downtown Baltimore and surrounding neighborhoods. Each festival page lists its specific venue and address. Check the Vendor Map tab for the exact location and nearby transit options.' },
      { q: 'Is parking available?', a: 'Street parking and public garages are available near most festival sites. We recommend using public transit — the Metro Subway, Light Rail, and Charm City Circulator all serve downtown. Ride-share drop-off zones are designated at each major festival.' },
      { q: 'Are the venues accessible?', a: 'Yes. All festival sites are wheelchair accessible. Accessible parking is available at each venue, and accessible restrooms are provided throughout the festival grounds.' },
    ],
  },
  {
    title: 'Tickets & Admission',
    items: [
      { q: 'Do I need tickets to attend?', a: 'Most Baltimore festivals are free to attend! Some offer optional VIP passes or paid workshops — these are clearly marked on the Tickets tab. Free events still require an RSVP so you receive schedule updates and reminders.' },
      { q: 'How do I RSVP?', a: 'Click "RSVP Now" on any festival card. You\'ll be added to the attendee list and receive a reminder two hours before the event starts. RSVPs can be cancelled at any time.' },
      { q: 'Can I bring my kids?', a: 'Absolutely! Many festivals feature Kidscape areas with family-friendly activities, hands-on art experiences, and performances designed for young audiences.' },
    ],
  },
  {
    title: 'Vendors & Artists',
    items: [
      { q: 'How can I become a vendor?', a: 'Visit the "Create" menu and set up a Business Page, then link it to the festival. Festival organizers review vendor applications and approve those that fit the festival\'s theme and curation.' },
      { q: 'How do artists get featured on the festival page?', a: 'Artists with a Planet Baltimore ArtistPage are automatically included in the festival gallery. Build your profile with portfolio work, bio, and category to be discovered by festival organizers and attendees.' },
      { q: 'Can I sell my work at festivals?', a: 'Yes! Many festivals include artisan markets. Create an ArtistPage and reach out to the festival organizer through the event page to apply for a vendor spot.' },
    ],
  },
  {
    title: 'Food & Drink',
    items: [
      { q: 'Will there be food at the festivals?', a: 'Yes! Each festival features food vendors offering everything from local Baltimore classics to international cuisine. Check the Vendor Map tab to see food vendors near each festival site.' },
      { q: 'Can I bring my own food and drinks?', a: 'Outside food is generally allowed at outdoor festivals, but coolers and large bags may be subject to inspection. Glass containers and alcohol are typically not permitted.' },
    ],
  },
  {
    title: 'Weather & Cancellations',
    items: [
      { q: 'What happens if it rains?', a: 'Most festivals are rain or shine. In the event of severe weather, updates are posted on the festival event page and sent to all RSVP holders. Check your notifications for real-time updates.' },
      { q: 'How will I know if a festival is cancelled?', a: 'If you\'ve RSVP\'d, you\'ll receive a notification immediately. Updates are also posted on the festival page and the Planet Baltimore home feed.' },
    ],
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-foreground">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-3.5 leading-relaxed">{item.a}</p>
      )}
    </div>
  );
}

export default function FestivalFAQ() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
        <p className="text-sm text-muted-foreground mt-1">Everything you need to know about attending Baltimore festivals.</p>
      </div>

      {FAQ_SECTIONS.map(section => (
        <div key={section.title} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-1">{section.title}</h3>
          <div className="mt-2">
            {section.items.map(item => (
              <FAQItem key={item.q} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}