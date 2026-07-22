import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { notifyOrganizerTicketSale } from '../../shared/notifyOrganizerTicketSale.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const { eventId, ticketTypeId, quantity, buyerId, promoterId } = metadata;

      if (!eventId || !ticketTypeId || !quantity || !buyerId) {
        console.log('Missing metadata, skipping:', metadata);
        return Response.json({ success: true });
      }

      // Idempotency check
      const existingOrders = await base44.asServiceRole.entities.TicketOrder.filter({
        payment_intent_id: session.payment_intent,
      });
      if (existingOrders.length > 0) {
        console.log('Order already exists for session:', session.id);
        return Response.json({ success: true });
      }

      const amountPaid = (session.amount_total || 0) / 100;
      const platformFeeRate = 0.05;
      const subtotal = amountPaid / (1 + platformFeeRate);
      const platformFee = amountPaid - subtotal;
      const qty = parseInt(quantity);

      // Create order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const ticketOrder = await base44.asServiceRole.entities.TicketOrder.create({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        buyer_id: buyerId,
        buyer_email: session.customer_email || session.customer_details?.email || '',
        buyer_name: session.customer_details?.name || 'Customer',
        quantity: qty,
        subtotal: parseFloat(subtotal.toFixed(2)),
        platform_fee: parseFloat(platformFee.toFixed(2)),
        total_amount: amountPaid,
        payment_status: 'completed',
        payment_intent_id: session.payment_intent || session.id,
        order_number: orderNumber,
        promo_code_used: promoterId || '',
      });

      // Create individual tickets
      const ticketBatch = [];
      for (let i = 0; i < qty; i++) {
        const uniqueCode = `TKT-${eventId.slice(0, 6).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        ticketBatch.push({
          order_id: ticketOrder.id,
          ticket_type_id: ticketTypeId,
          event_id: eventId,
          owner_id: buyerId,
          owner_email: session.customer_email || session.customer_details?.email || '',
          unique_code: uniqueCode,
          ticket_number: `${i + 1} of ${qty}`,
          is_checked_in: false,
        });
      }
      await base44.asServiceRole.entities.Ticket.bulkCreate(ticketBatch);

      // Update ticket type sold count
      const ticketTypeData = await base44.asServiceRole.entities.TicketType.filter({ id: ticketTypeId });
      if (ticketTypeData[0]) {
        await base44.asServiceRole.entities.TicketType.update(ticketTypeId, {
          quantity_sold: (ticketTypeData[0].quantity_sold || 0) + qty,
        });
      }

      // Notify the event/festival organizer of the sale
      await notifyOrganizerTicketSale(base44, {
        eventId, festivalId: metadata.festivalId || '', ticketTypeId, quantity: qty,
        buyerName: session.customer_details?.name || 'Customer',
        buyerEmail: session.customer_email || session.customer_details?.email || '',
        orderNumber, totalAmount: amountPaid,
        origin: req.headers.get('origin') || 'https://planetbaltimore.base44.app',
      });

      // Track promoter commission
      if (promoterId) {
        const promoterData = await base44.asServiceRole.entities.Promoter.filter({ id: promoterId });
        const promoter = promoterData[0];
        if (promoter && promoter.status === 'active') {
          const commissionAmount = subtotal * (promoter.commission_rate / 100);
          await base44.asServiceRole.entities.TicketSale.create({
            order_id: ticketOrder.id,
            event_id: eventId,
            ticket_type_id: ticketTypeId,
            sold_by_promoter_id: promoter.promoter_id || promoterId,
            sold_by_promoter_name: promoter.promoter_name,
            quantity: qty,
            unit_price: ticketTypeData[0]?.price || 0,
            total_amount: subtotal,
            commission_rate: promoter.commission_rate,
            commission_amount: commissionAmount,
            sale_date: new Date().toISOString(),
          });
          await base44.asServiceRole.entities.Promoter.update(promoter.id, {
            total_tickets_sold: (promoter.total_tickets_sold || 0) + qty,
            total_commission_earned: (promoter.total_commission_earned || 0) + commissionAmount,
          });
        }
      }

      // Send confirmation email
      const buyerEmail = session.customer_email || session.customer_details?.email;
      const buyerName = session.customer_details?.name || 'Customer';
      if (buyerEmail) {
        const eventData = await base44.asServiceRole.entities.Event.filter({ id: eventId });
        const ev = eventData[0];
        const ttData = ticketTypeData[0];
        await base44.integrations.Core.SendEmail({
          to: buyerEmail,
          subject: `Your tickets for ${ev?.title || 'the event'}!`,
          body: `Hi ${buyerName},\n\nYour purchase is confirmed!\n\nOrder #: ${orderNumber}\nEvent: ${ev?.title || 'Event'}\nTickets: ${qty}x ${ttData?.name || 'Ticket'}\nTotal Paid: $${amountPaid.toFixed(2)}\n\n${ev?.date ? `Date: ${new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n` : ''}${ev?.venue_name ? `Venue: ${ev.venue_name}\n` : ''}${ev?.address ? `Address: ${ev.address}\n` : ''}\nView your tickets: ${req.headers.get('origin') || 'https://app.base44.com'}/profile\n\nSee you there!\nPlanet Baltimore`,
          from_name: 'Planet Baltimore Tickets',
        });
      }

      console.log(`Order ${orderNumber} created for ${qty} tickets.`);
    }

    // ── Marketplace order fulfillment ──────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session2 = event.data.object;
      if (session2.metadata?.type === 'marketplace') {
        const { listingId, buyerId, sellerId } = session2.metadata;
        const amountPaid = (session2.amount_total || 0) / 100;
        const platformFee = amountPaid * 0.10;
        const sellerPayout = amountPaid - platformFee;

        // Idempotency
        const existingMktOrders = await base44.asServiceRole.entities.MarketplaceOrder.filter({
          payment_intent_id: session2.payment_intent,
        });
        if (existingMktOrders.length === 0) {
          const listing = (await base44.asServiceRole.entities.MarketplaceListing.filter({ id: listingId }))[0];
          const orderNumber = `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          await base44.asServiceRole.entities.MarketplaceOrder.create({
            listing_id: listingId,
            listing_title: listing?.title || '',
            seller_id: sellerId,
            seller_name: listing?.seller_name || '',
            buyer_id: buyerId,
            buyer_email: session2.customer_email || session2.customer_details?.email || '',
            buyer_name: session2.customer_details?.name || 'Customer',
            amount: amountPaid,
            platform_fee: parseFloat(platformFee.toFixed(2)),
            seller_payout: parseFloat(sellerPayout.toFixed(2)),
            payment_status: 'completed',
            payment_intent_id: session2.payment_intent || session2.id,
            order_number: orderNumber,
            download_url: listing?.file_url || '',
          });

          // Update sales count
          if (listing) {
            await base44.asServiceRole.entities.MarketplaceListing.update(listingId, {
              sales_count: (listing.sales_count || 0) + 1,
            });
          }

          // Send confirmation email
          const buyerEmail = session2.customer_email || session2.customer_details?.email;
          if (buyerEmail && listing) {
            await base44.integrations.Core.SendEmail({
              to: buyerEmail,
              subject: `Your purchase: ${listing.title}`,
              body: `Hi ${session2.customer_details?.name || 'there'},\n\nThank you for your purchase!\n\nOrder #: ${orderNumber}\nItem: ${listing.title}\nAmount: $${amountPaid.toFixed(2)}\n\nVisit your profile to download your purchase.\n\nPlanet Baltimore`,
              from_name: 'Planet Baltimore Marketplace',
            });
          }
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      console.log('Payment failed:', pi.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});