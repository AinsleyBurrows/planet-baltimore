// Shared helper: notify an event/festival organizer that a ticket was purchased.
// Called from createCheckoutSession (free tickets) and handleStripeWebhook (paid tickets).
// bulkCreate skips entity-automation side effects, so we notify inline rather than via a Ticket entity trigger.
export async function notifyOrganizerTicketSale(base44, details) {
  try {
    const { eventId, festivalId, ticketTypeId, quantity, buyerName, buyerEmail, orderNumber, totalAmount, origin } = details;
    const qty = parseInt(quantity, 10) || 1;
    const amount = Number(totalAmount) || 0;
    const amountLabel = amount === 0 ? 'Free' : `$${amount.toFixed(2)}`;

    let organizerId = null;
    let parentTitle = 'your event';
    let parentLink = '';

    const ttData = await base44.asServiceRole.entities.TicketType.filter({ id: ticketTypeId });
    const ttName = ttData[0]?.name || 'Ticket';

    if (festivalId) {
      const fData = await base44.asServiceRole.entities.Festival.filter({ id: festivalId });
      const f = fData[0];
      if (f) {
        organizerId = f.owner_id;
        parentTitle = f.name;
        parentLink = f.slug ? `/festivals/${f.slug}` : '/festivals';
      }
    } else if (eventId) {
      const eData = await base44.asServiceRole.entities.Event.filter({ id: eventId });
      const ev = eData[0];
      if (ev) {
        organizerId = ev.organizer_id;
        parentTitle = ev.title;
        parentLink = `/events/${eventId}`;
      }
    }

    if (!organizerId) return;

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: organizerId,
      type: 'announcement',
      title: `New ticket sale — ${parentTitle}`,
      body: `${buyerName || 'A buyer'} purchased ${qty}× ${ttName} (${amountLabel}).${orderNumber ? ` Order ${orderNumber}.` : ''}`,
      link: parentLink,
      actor_name: buyerName || 'Ticket Buyer',
    });

    // Email (organizers are registered users)
    try {
      const uData = await base44.asServiceRole.entities.User.filter({ id: organizerId });
      const ou = uData[0];
      if (ou?.email) {
        await base44.integrations.Core.SendEmail({
          to: ou.email,
          subject: `New ticket sale — ${parentTitle}`,
          body: `You just sold ${qty} ticket(s) for ${parentTitle}.\n\nBuyer: ${buyerName || 'Customer'}\nTicket type: ${ttName}\nAmount: ${amountLabel}${orderNumber ? `\nOrder #: ${orderNumber}` : ''}\n\nView on Planet Baltimore: ${origin || 'https://planetbaltimore.base44.app'}${parentLink}\n\n— Planet Baltimore`,
          from_name: 'Planet Baltimore Tickets',
        });
      }
    } catch (e) {
      console.log('Organizer email notification failed:', e.message);
    }
  } catch (e) {
    console.log('Organizer ticket-sale notification failed:', e.message);
  }
}