# BMore Connected - Professional Ticketing System Specification

## Executive Summary

A native, production-ready ticketing system enabling event producers to create, manage, and sell tickets with professional features comparable to Eventbrite, including secure Stripe payments, digital tickets, attendee management, and producer payouts.

---

## DATABASE SCHEMA

### Entities Required

#### 1. TicketType
Defines individual ticket offerings for an event.

```
- id (auto)
- event_id (required)
- name (e.g., "Early Bird", "VIP", "General Admission")
- description (optional)
- price (number, 0 for free)
- quantity_total (total available)
- quantity_sold (auto-tracked)
- max_per_buyer (optional, default unlimited)
- sale_start_date (optional)
- sale_end_date (optional)
- early_bird_expiry_date (optional, auto-hide after date)
- early_bird_expiry_qty (optional, auto-hide after qty sold)
- is_active (boolean, allow pause)
- visibility (public | member_only | private)
- perks (array of strings, e.g., ["Early Entry", "Meet & Greet"])
- sort_order (display order)
- created_date
- ticket_type_group (early_bird | general | vip | group | free | donation | promo | member)
```

#### 2. TicketOrder
Transaction record for one buyer purchasing one or more tickets.

```
- id (auto)
- event_id
- ticket_type_id
- buyer_id (user_id)
- buyer_email
- buyer_name
- quantity
- subtotal (price × quantity)
- taxes (calculated)
- platform_fee (commission)
- discount_applied (promo code discount)
- total_amount
- payment_status (pending | completed | failed | refunded)
- payment_intent_id (Stripe)
- order_number (human-readable, e.g., ORD-2026-0001)
- payout_status (pending | processed | failed)
- payout_id (Stripe Connect)
- refund_status (none | partial | full)
- refund_reason (optional)
- refund_amount
- created_date
- updated_date
```

#### 3. Ticket
Individual ticket issued to a buyer (one per ticket unit).

```
- id (auto)
- order_id
- ticket_type_id
- event_id
- owner_id (user_id, initially buyer_id)
- owner_email
- unique_code (for verification, QR code)
- qr_code_url (generated image)
- ticket_number (sequential, e.g., "Ticket #1 of 3")
- is_checked_in (boolean)
- checked_in_at (timestamp)
- checked_in_by (admin user_id)
- is_transferred (boolean, future feature)
- transferred_to (future feature)
- created_date
- metadata (custom fields if needed)
```

#### 4. PromoCode
Discount/promo code management.

```
- id (auto)
- code (unique, uppercase)
- event_id (optional, null = platform-wide)
- discount_type (percentage | fixed)
- discount_value (e.g., 10 for 10%, or 5 for $5 off)
- usage_limit (max uses globally)
- usage_count (current uses)
- ticket_type_whitelist (array, null = all types eligible)
- min_purchase_qty (optional)
- valid_from
- valid_until
- is_active
- created_by (admin or producer user_id)
- created_date
```

#### 5. Refund
Refund request tracking.

```
- id (auto)
- order_id
- event_id
- refund_amount
- reason (requested_by_buyer | host_cancelled | event_cancelled | duplicate)
- status (pending | approved | rejected | processed)
- requested_date
- processed_date
- stripe_refund_id
- notes (admin)
- created_date
```

#### 6. Payout
Payout record for event producers.

```
- id (auto)
- event_id
- organizer_id (user_id)
- total_gross_sales
- platform_commission
- platform_fee_breakdown {percentage_fee, flat_fee}
- net_payout
- stripe_account_id (Stripe Connect)
- stripe_payout_id
- payout_status (pending | in_transit | completed | failed)
- payout_date
- bank_arrival_date (estimated)
- created_date
- updated_date
```

#### 7. CheckIn
Track attendee check-ins at the event.

```
- id (auto)
- ticket_id
- event_id
- checked_in_at
- checked_in_by (admin user_id)
- check_in_method (qr_scan | manual_search)
- ip_address (fraud detection)
- location (optional lat/lon)
- notes (optional)
```

#### 8. PlatformSettings
Admin-controlled configuration.

```
- id (auto)
- setting_name (unique)
- setting_value (any type)
- examples:
  - commission_percentage (e.g., 5)
  - commission_flat_fee (e.g., 0.50)
  - enable_refunds (boolean)
  - stripe_connect_required (boolean)
  - max_ticket_types_per_event (default 20)
```

---

## TICKET TYPE CATEGORIES & LOGIC

### Early Bird
- Lower price
- Auto-hide on expiry_date or when qty sold out
- Mark as "Expired" in UI
- Price increases for remaining inventory

### General Admission
- Standard ticket type
- Available until event date or sold out

### VIP
- Higher price
- Display perks/benefits prominently
- Could include "Meet & Greet", "Reserved Seating", etc.

### Group Tickets
- Bundled pricing (3+ tickets at discount)
- Group discount applied automatically
- Min/max quantity enforcement

### Free Tickets
- Price = 0
- Still require check-in confirmation
- RSVP-style mechanism

### Donation / Pay-What-You-Can
- Base price (optional minimum)
- Buyer can enter custom amount ≥ base price
- Platform commission applies to full amount

### Promo / Discounted
- Created ad-hoc for campaigns
- May have time/quantity limits

### Member-Only
- Visibility restricted to logged-in users
- Additional check: user.membership_status = active (future)

---

## BUYER CHECKOUT FLOW

```
1. EVENT PAGE
   - View event details
   - See all ticket types (filtered by visibility)
   - Select ticket type
   
2. TICKET SELECTION
   - Choose quantity (max_per_buyer enforced)
   - See price breakdown (subtotal, taxes, fees, total)
   - See if Early Bird expiry applies
   
3. PROMO CODE (OPTIONAL)
   - Enter promo code
   - Validate: code exists, is active, date range OK, ticket type eligible
   - Show discount applied
   - Recalculate total
   
4. STRIPE CHECKOUT
   - Redirect to Stripe Checkout Session
   - Line items include: ticket subtotal, platform fee, taxes
   - Metadata: event_id, ticket_type_id, buyer info
   
5. PAYMENT CONFIRMATION (Stripe)
   - Create TicketOrder with status: pending
   - Create Ticket records (x quantity)
   - Generate unique_code and QR code for each ticket
   
6. POST-PAYMENT WEBHOOK (Stripe)
   - Validate webhook signature
   - Update TicketOrder: status = completed
   - Send confirmation email with tickets attached
   - Update Ticket: owner_email confirmed
   - Create Payout record (pending)
   
7. TICKET DELIVERY
   - Email: Confirmation + digital tickets (PDF with QR code)
   - Account: Tickets visible in user's profile under "My Tickets"
   - Each ticket has unique ID, event info, perks, check-in QR
```

---

## PRODUCER TICKETING DASHBOARD

### Views

#### 1. Overview
- Event title + date
- Total capacity / tickets sold
- Gross sales (sum of all TicketOrder totals)
- Platform commission (system-calculated)
- Net earnings (gross - commission)
- Payout status (pending / processing / completed)
- Estimated payout date

#### 2. Ticket Types Management
- List all ticket types
- Edit: name, description, price, qty, sale dates, perks, visibility
- Pause/resume sales
- Mark as sold out manually
- Duplicate ticket type
- Delete (only if no sales)
- View: qty sold, remaining, price per ticket, revenue

#### 3. Attendee List
- Searchable table: buyer name, email, ticket type, qty, purchase date, payment status, check-in status
- Filters: ticket type, payment status, check-in status
- Export CSV: name, email, ticket type, qty, date, payment status
- Bulk actions: send message, mark checked in, refund
- Click attendee → view order details, individual ticket codes, refund option

#### 4. Check-In (Event Day)
- List all tickets for the event
- Search ticket by: ticket number, buyer name, email, unique code
- Scan QR code (if device supports camera)
- Mark checked in / undo check-in
- Show real-time check-in count (X / total tickets)
- Prevent duplicate check-ins (warn, don't allow)
- Export check-in report at end of day

#### 5. Messaging
- Send message to all attendees
- Filter by: ticket type, check-in status
- Preview recipient count
- Subject + message body
- Send via platform notification + email
- Track delivery status

#### 6. Refunds
- Show refund requests
- Approve / reject
- Issue full or partial refunds
- Track Stripe refund status
- Reason tracking

#### 7. Financials / Payout
- Breakdown: gross sales, platform commission, taxes, net payout
- Timeline: when money will hit bank account
- Payout history (past events)
- Commission breakdown (if variable rates)

---

## ADMIN DASHBOARD

### Views

#### 1. Platform Metrics
- Total events with ticketing enabled
- Total tickets sold (all time)
- Total platform revenue (commission collected)
- Top events by revenue

#### 2. Commission Settings
- Global commission: percentage + flat fee
- Event-level overrides (if permitted)
- Fee examples: "5% + $0.50 per ticket"

#### 3. Transaction Audit
- All TicketOrders across platform
- Filter by: event, status, date range
- Refund tracking
- Payout tracking

#### 4. Payouts
- View all Stripe Connect payouts
- Pending, in-transit, completed
- Troubleshooting failed payouts
- Manually trigger payout (if needed)

#### 5. Risk Management
- Refund rate by producer (watch for abuse)
- Dispute tracking
- Disable event / lock account (if fraud suspected)

---

## STRIPE INTEGRATION

### Payment Flow

1. **Checkout Session Creation**
   - Create Session via backend function
   - Line items: ticket subtotal, platform_fee (as separate line), tax
   - Success URL: /order-confirmation/{order_id}
   - Cancel URL: /events/{event_id}
   - Customer email (prefilled)
   
2. **Payment Completion**
   - Stripe `payment_intent.succeeded` webhook
   - Validate webhook signature
   - Update TicketOrder: status = completed
   - Generate tickets + QR codes
   - Send confirmation email

3. **Refund Flow**
   - Producer/admin initiates refund
   - Call Stripe Refunds API
   - Validate: no duplicate refunds, amount ≤ order total
   - Update TicketOrder: status = refunded
   - Update Refund: status = processed
   - Send refund confirmation email

4. **Stripe Connect (Payouts)**
   - Use Stripe Connect for split payments
   - Producer has Stripe Account (onboarded via OAuth)
   - Platform receives commission in platform account
   - Producer receives net amount in their account
   
   OR (Simpler for MVP):
   - Platform receives full payment
   - Calculate: producer_payout = total - commission
   - Create Payout record
   - Transfer via platform bank account / manual payout
   - For v1, may use platform account as intermediary

---

## SECURITY & FRAUD PREVENTION

1. **Webhook Validation**
   - Always verify Stripe webhook signature
   - Idempotency: check if payment already processed
   
2. **Duplicate Prevention**
   - Stripe idempotency key
   - Check: no duplicate TicketOrders for same payment intent
   
3. **Backend Permission Checks**
   - Only event organizer can see their attendee list
   - Only logged-in users can view their own tickets
   - Only admins can adjust commission settings
   - Refunds require producer + platform approval
   
4. **Fraud Detection (Future)**
   - Monitor refund rates
   - Detect bulk fake purchases
   - Geographic anomalies (IP vs attendee location)
   
5. **PCI Compliance**
   - No credit card data stored (Stripe handles)
   - No customer financial data in logs
   - Secure webhook endpoints (HTTPS only)

---

## EMAIL TEMPLATES REQUIRED

1. **Purchase Confirmation**
   - Order number, event details, tickets
   - QR codes attached as images or PDF
   - Ticket viewing link

2. **Ticket Reminder** (24h before event)
   - Event time/location
   - Ticket instructions
   - Check-in info

3. **Refund Confirmation**
   - Reason, amount, timeline
   - Expected arrival (2-5 business days)

4. **Producer Payout Notification**
   - Gross sales, commission, net payout
   - Payout date

---

## MVP SCOPE (V1)

### REQUIRED FOR LAUNCH
- ✅ Multiple ticket types (with names, prices, quantities)
- ✅ Stripe Checkout (basic, no Stripe Connect yet)
- ✅ Ticket purchase flow (simple, mobile-friendly)
- ✅ Confirmation email (text, no PDF yet)
- ✅ Digital tickets (stored in user profile, unique code)
- ✅ Attendee list (searchable, email export)
- ✅ Producer dashboard (overview + attendee mgmt + check-in)
- ✅ Platform commission (flat %)
- ✅ Basic refund support (manual initiation)
- ✅ Check-in list/manual search (no QR scanning v1)

### NOT IN V1 (Future)
- QR code scanning (camera access)
- Stripe Connect (producer payouts automated)
- Reserved seating
- Waitlists
- Ticket transfers
- Affiliate / sub-promoter tracking
- Memberships
- Recurring events
- Dispute resolution UX

---

## IMPLEMENTATION TIMELINE

**Phase 1: Core Ticketing (Weeks 1-2)**
- Create database entities
- Build ticket type manager (producer)
- Build checkout flow (buyer)
- Stripe integration (basic)

**Phase 2: Dashboard & Attendee Mgmt (Weeks 3-4)**
- Producer dashboard (overview, financials)
- Attendee list + export
- Check-in system (manual)
- Messaging

**Phase 3: Polish & Compliance (Weeks 5-6)**
- Email templates
- Error handling
- Mobile optimization
- Security hardening
- Admin dashboard (basic)

**Phase 4: Launch & Monitoring (Week 7)**
- Load testing
- Webhook stability
- Documentation
- Producer onboarding flow

---

## SUCCESS METRICS

- **Conversion**: % of users completing checkout (target: 70%+)
- **Payment Success**: % of successful payment intents (target: 98%+)
- **Uptime**: Stripe webhook processing 99.9%+
- **Support**: <1% refund rate, <5% support tickets related to ticketing
- **Producer Adoption**: # of events using ticketing system