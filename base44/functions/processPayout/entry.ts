import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, payoutType } = await req.json(); // payoutType: 'producer' or 'promoter'

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Fetch event
    const eventResults = await base44.entities.Event.filter({ id: eventId });
    const event = eventResults[0];
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify event is in the past
    if (new Date(event.date) > new Date()) {
      return Response.json({ error: 'Event must be completed before payout' }, { status: 400 });
    }

    if (payoutType === 'producer') {
      // Verify user is the event producer
      if (event.organizer_id !== user.id) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Get all ticket orders for the event
      const orders = await base44.entities.TicketOrder.filter({ event_id: eventId, payment_status: 'completed' });
      
      if (orders.length === 0) {
        return Response.json({ error: 'No completed orders for this event' }, { status: 400 });
      }

      // Calculate payout
      const totalGrossSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const platformCommission = orders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
      const netPayout = totalGrossSales - platformCommission;

      // Create payout record
      const payout = await base44.entities.Payout.create({
        event_id: eventId,
        organizer_id: user.id,
        total_gross_sales: totalGrossSales,
        platform_commission: platformCommission,
        net_payout: netPayout,
        payout_status: 'pending',
        payout_date: new Date().toISOString(),
      });

      // Update all orders to reference this payout
      for (const order of orders) {
        if (!order.payout_id) {
          await base44.entities.TicketOrder.update(order.id, { payout_id: payout.id });
        }
      }

      return Response.json({
        payoutId: payout.id,
        totalGrossSales,
        platformCommission,
        netPayout,
      });
    } else if (payoutType === 'promoter') {
      // Promoter payout for their commission
      const { promoterId } = await req.json();
      
      const promoterResults = await base44.entities.Promoter.filter({ id: promoterId, promoter_id: user.id });
      const promoter = promoterResults[0];
      if (!promoter) {
        return Response.json({ error: 'Promoter not found or unauthorized' }, { status: 404 });
      }

      const unpaidSales = await base44.entities.TicketSale.filter({
        sold_by_promoter_id: user.id,
        event_id: eventId,
        payout_status: 'pending',
      });

      if (unpaidSales.length === 0) {
        return Response.json({ error: 'No pending commissions' }, { status: 400 });
      }

      const totalCommission = unpaidSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);

      // Mark sales as paid
      for (const sale of unpaidSales) {
        await base44.entities.TicketSale.update(sale.id, { payout_status: 'paid' });
      }

      return Response.json({
        totalCommission,
        ticketsSold: unpaidSales.reduce((sum, s) => sum + s.quantity, 0),
      });
    }

    return Response.json({ error: 'Invalid payout type' }, { status: 400 });
  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});