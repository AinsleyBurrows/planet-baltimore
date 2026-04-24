# Ticketing System Implementation Guide

## SETUP & CONFIGURATION

### 1. Stripe Setup

Set these environment variables:
```
STRIPE_SECRET_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
APP_URL=https://yourdomain.com (for webhook callbacks)
```

To get webhook secret:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create webhook for `https://yourdomain.com/stripe-webhook`
3. Subscribe to events: `checkout.session.completed`
4. Copy signing secret

### 2. Database Entities Created

All 8 entities have been created:
- ✅ TicketType
- ✅ TicketOrder  
- ✅ Ticket
- ✅ PromoCode
- ✅ Refund
- ✅ Payout
- ✅ CheckIn
- ✅ PlatformSettings

### 3. Backend Functions Deployed

- `createCheckoutSession` - Creates Stripe Checkout session
- `handleStripeWebhook` - Processes payment completion
- `sendBulkMessage` - Sends messages to attendees (already exists)

### 4. UI Components Created

**Ticketing Components:**
- `components/ticketing/TicketSelector.jsx` - Ticket type selection + pricing
- `pages/EventTicketing.jsx` - Checkout page entry point
- `pages/OrderConfirmation.jsx` - Post-purchase confirmation

**Producer Dashboard Components** (from earlier):
- `components/organizer/EventAnalytics.jsx` - Revenue charts
- `components/organizer/AttendeeManager.jsx` - Attendee list + export
- `components/organizer/BulkMessaging.jsx` - Send messages

---

## USER FLOWS

### BUYER FLOW

```
1. Browse Event Detail
   → See all available ticket types
   → See prices, perks, availability

2. Click "Get Tickets"
   → Navigate to /events/{id}/tickets
   → TicketSelector component loads

3. In TicketSelector
   → View all ticket types (filtered for availability)
   → Select ticket type
   → Choose quantity (1-max_per_buyer)
   → Optionally enter promo code
   → See price breakdown (subtotal, fees, tax, total)
   → Click "Continue to Checkout"

4. Stripe Checkout
   → Redirected to Stripe Checkout Session
   → Secure payment form
   → Complete payment

5. Payment Success
   → Stripe webhook fires: checkout.session.completed
   → Backend creates Ticket records (one per unit)
   → Generates unique codes + QR codes
   → Sends confirmation email
   → Updates ticket type sold count
   → Creates Payout record
   → Creates PromoCode usage record

6. Confirmation Page
   → Redirect to /order-confirmation?session_id=xxx
   → Display "Purchase Confirmed" message
   → Next steps: check email, view tickets, arrive early
   → Link to profile to view tickets

7. View Tickets
   → User goes to Profile → "My Tickets" tab
   → See all purchased tickets
   → View QR code for each ticket
   → Can email confirmation if needed
```

### PRODUCER FLOW

```
1. Create Event
   → Fill out event details (title, date, description, etc.)
   → Event created with ticketing_mode = "platform" (if enabled)

2. Manage Ticket Types (OrganizerStudio)
   → Click event to manage
   → Go to "Ticket Types" tab
   → Create new ticket type:
     - Name: "General Admission"
     - Price: $25
     - Quantity: 100
     - Max per buyer: 4
     - Perks: (none)
     - Visibility: public
   → Save
   → Repeat for Early Bird, VIP, etc.

3. Track Sales (OrganizerStudio)
   → Dashboard shows real-time metrics:
     - Total attendees (RSVP count)
     - Tickets sold by type
     - Gross revenue
     - Platform commission
     - Net earnings
     - Payout status

4. Manage Attendees (OrganizerStudio)
   → View attendee list (searchable, filterable)
   → See: name, email, ticket type, quantity, payment status
   → Export CSV for external use
   → Message all attendees or specific ticket groups

5. Check-In (Event Day)
   → On event day, use Check-In dashboard
   → Search ticket by: ticket number, name, email, unique code
   → Manually mark as checked in
   → View real-time check-in count
   → Prevent duplicate check-ins

6. Payout
   → Platform automatically creates Payout records
   → Status: pending → processed
   → Producer sees:
     - Gross sales
     - Platform commission breakdown
     - Net payout amount
     - Expected bank arrival date
```

---

## PRICING & COMMISSION LOGIC

### Default Commission (Configurable)

```
COMMISSION_PERCENTAGE = 5%
COMMISSION_FLAT_FEE = $0.50 per ticket

Example Order:
  Ticket Price: $25.00
  Quantity: 2
  ─────────────────────
  Subtotal: $50.00
  Platform Fee: ($50.00 × 5%) + ($0.50 × 2) = $2.50 + $1.00 = $3.50
  Tax (8%): $50.00 × 8% = $4.00
  ─────────────────────
  Total Paid: $57.50
  
  Net to Producer: $50.00 - $3.50 = $46.50
  Platform Revenue: $3.50
```

### Promo Code Logic

```
Valid if:
- is_active = true
- current date >= valid_from (if set)
- current date <= valid_until (if set)
- usage_count < usage_limit (if set)
- ticket_type_whitelist is empty OR includes selected ticket type
- quantity >= min_purchase_qty (if set)

Discount Types:
- "percentage": discount_value = 10 → 10% off
- "fixed": discount_value = 5 → $5 off (per ticket if multiplied by qty)

Applied to:
- Subtotal (before taxes and fees)
- Fees still calculated on discounted amount
```

---

## TICKET VALIDATION & AVAILABILITY

### Ticket Type Can't Be Purchased If:

1. `is_active` = false (producer paused sales)
2. Sale not started: `sale_start_date` is in the future
3. Sale ended: `sale_end_date` is in the past
4. Early bird expired: `early_bird_expiry_date` passed
5. Sold out: `quantity_sold >= quantity_total`
6. Quantity exceeds `max_per_buyer`
7. Insufficient inventory for requested quantity

### Auto-Hide Logic for Early Bird:

```
Early bird tickets auto-hide if:
- early_bird_expiry_date < now, OR
- early_bird_expiry_qty defined AND quantity_sold >= early_bird_expiry_qty

Shows as "Expired" in UI, not available for purchase.
```

---

## WEBHOOK HANDLING

### Stripe Event: `checkout.session.completed`

When Stripe confirms payment:

```javascript
1. Validate webhook signature (using STRIPE_WEBHOOK_SECRET)
2. Extract order_id, event_id, buyer_id from metadata
3. Update TicketOrder:
   - payment_status = "completed"
   - payment_intent_id = session.payment_intent
4. Create Ticket records:
   - quantity = order.quantity
   - unique_code = "{ORDER_NUMBER}-{INDEX}-{RANDOM}"
   - qr_code_url = QR code image (via api.qrserver.com)
5. Update TicketType:
   - quantity_sold += order.quantity
6. Create Payout record (status: pending)
7. Increment PromoCode usage_count (if used)
8. Send confirmation email with tickets
```

### Security Considerations:

- ✅ Verify webhook signature every time
- ✅ Check for duplicate processing (idempotency)
- ✅ Store payment_intent_id to prevent dupes
- ✅ Only trusted events modify TicketOrder status

---

## EMAIL TEMPLATES

### 1. Purchase Confirmation

```
Subject: Ticket Confirmation - {Event Title}

Dear {Buyer Name},

Thank you for your purchase!

Order Details:
- Order Number: {order_number}
- Event: {event_title}
- Date: {event_date}
- Location: {venue_name}

Tickets:
{For each ticket:}
- Ticket #{ticket_number}: {ticket_type_name}
- Code: {unique_code}
- QR Code: [embedded image]

What to bring:
- Show your QR code at the gate OR
- Give staff your ticket number OR
- Show the confirmation email

Questions? Contact {organizer_email}

See you at the event!
```

### 2. Refund Confirmation

```
Subject: Refund Processed - {Event Title}

Your refund of ${amount} has been processed.

Expected arrival: 2-5 business days
Reason: {reason}

Any questions? Contact {organizer_email}
```

---

## CHECKING ATTENDEES AT THE DOOR

### Producer Check-In Workflow:

1. Producer logs in to OrganizerStudio
2. On event day, goes to "Check-In" tab
3. Options to find attendee:
   - **QR Scan**: Point phone camera at ticket QR code
   - **Manual Search**: Search by ticket #, name, or email
4. Click attendee → "Mark Checked In"
5. System prevents duplicate check-ins
6. Real-time counter shows: "234 / 500 checked in"
7. At end of day, can export check-in report

---

## ADMIN DASHBOARD

### Platform Admin Can:

1. **View Settings**
   - Commission percentage
   - Flat fee per ticket
   - Max ticket types per event
   - Refund policies

2. **Monitor Revenue**
   - Total platform commission across all events
   - Top events by revenue
   - Payout tracking

3. **Manage Payouts**
   - View pending/processed payouts
   - Troubleshoot failed payouts
   - Manually trigger payout (if needed)

4. **Risk Management**
   - Monitor refund rates
   - Disable suspicious events
   - Block producers (if fraud detected)
   - Audit transaction logs

---

## FUTURE ENHANCEMENTS (NOT IN MVP)

### Phase 2 Features:

1. **QR Code Scanning**
   - Scan QR codes directly with phone camera
   - Instant check-in without manual search

2. **Stripe Connect**
   - Producer onboards with Stripe
   - Automatic payout to producer's bank
   - Split payments (platform takes cut automatically)

3. **Reserved Seating**
   - Map seat layout
   - Producer sets pricing per section
   - Buyers select specific seats

4. **Waitlists**
   - If sold out, allow join waitlist
   - Auto-notify when tickets available
   - Auto-purchase when ticket released

5. **Ticket Transfers**
   - Allow buyer to send ticket to friend
   - Recipient emails updated
   - Original buyer can't use it

6. **Memberships / Subscriptions**
   - Recurring membership with ticket perks
   - Auto-discount on member-only tickets

7. **Affiliate / Sub-Promoter**
   - Track who referred the buyer
   - Sub-promoter commission tracking

8. **Disputes & Chargebacks**
   - Admin dashboard for disputes
   - Chargeback handling
   - Evidence submission

---

## TESTING CHECKLIST

### Functional Testing:

- [ ] Create ticket types with various prices, quantities
- [ ] Purchase single ticket
- [ ] Purchase multiple tickets
- [ ] Apply promo code (percentage discount)
- [ ] Apply promo code (fixed discount)
- [ ] Promo code validation (expired, limit reached, etc.)
- [ ] Early bird auto-expire
- [ ] Email confirmation sent
- [ ] Tickets appear in profile
- [ ] QR code generates correctly
- [ ] Check-in marks ticket as attended
- [ ] Prevent duplicate check-in
- [ ] Producer can view attendee list
- [ ] Producer can export CSV
- [ ] Producer can send bulk message
- [ ] Refund request → email notification
- [ ] Payout record created

### Security Testing:

- [ ] Webhook signature validation
- [ ] Can't bypass payment
- [ ] Can't modify order amount
- [ ] Can't check in with fake code
- [ ] Promo code usage limit enforced
- [ ] Only event organizer can access attendee data

### Performance Testing:

- [ ] Load checkout under 2s
- [ ] Process webhook within 5s
- [ ] QR code generation fast
- [ ] CSV export for 1000 attendees < 10s

---

## DEPLOYMENT NOTES

1. **Environment Variables**
   - Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - Set `APP_URL` for Stripe callbacks

2. **Webhook Endpoint**
   - Ensure `/stripe-webhook` or similar is accessible
   - Whitelist Stripe IP ranges in firewall
   - Monitor webhook logs for failures

3. **Database Indexes**
   - Add index on `TicketOrder.event_id`
   - Add index on `TicketOrder.buyer_id`
   - Add index on `Ticket.owner_id`
   - Add index on `Ticket.unique_code`
   - Add index on `CheckIn.ticket_id`

4. **Rate Limiting**
   - Limit checkout sessions per user per hour
   - Limit failed payment attempts
   - Limit check-in submissions per IP

5. **Monitoring**
   - Alert on failed webhooks
   - Alert on payment failures
   - Monitor payout status
   - Track email delivery rates

---

## REVENUE MODEL

```
BMore Connected makes money from:
1. Platform Commission: 5% of each ticket sale
2. Flat Fee: $0.50 per ticket sold

Example Monthly Revenue (100 events, 1000 tickets sold at $30 avg):
- Gross Volume: $30,000
- Commission (5%): $1,500
- Flat Fees ($0.50 × 1000): $500
- Total Revenue: $2,000
- Producer Payout: ~$28,000 net
```

---

## SUPPORT & TROUBLESHOOTING

### Common Issues:

**Issue**: Payment succeeds but tickets not created
- **Solution**: Check webhook processing logs; Stripe may have retried webhook

**Issue**: Promo code not applying
- **Solution**: Verify code is active, date range valid, ticket type whitelisted

**Issue**: Email not sent
- **Solution**: Check email integration logs; may be rate-limited

**Issue**: QR code not scanning
- **Solution**: Check unique_code format; ensure QR generation service available

---

## SUMMARY

This MVP ticketing system provides:
- ✅ Multiple ticket types per event
- ✅ Secure Stripe Checkout
- ✅ Digital tickets with QR codes
- ✅ Producer analytics dashboard
- ✅ Attendee management + export
- ✅ Check-in system (manual)
- ✅ Promo code support
- ✅ Platform commission tracking
- ✅ Basic refund support
- ✅ Professional UX comparable to Eventbrite

Ready for production deployment with proper monitoring and support processes.