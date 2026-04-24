# Ticketing System Architecture & Integration

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BMore Connected Platform                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │  Event Buyer     │       │  Event Producer  │                │
│  │  (Frontend)      │       │  (Frontend)      │                │
│  └────────┬─────────┘       └────────┬─────────┘                │
│           │                          │                           │
│           │ Browses                  │ Creates/Manages           │
│           │ Events                   │ Ticket Types              │
│           ▼                          ▼                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  UI Components:                                         │    │
│  │  - TicketSelector (select type, qty, promo)            │    │
│  │  - EventTicketing (checkout entry)                     │    │
│  │  - OrderConfirmation (success page)                    │    │
│  │  - OrganizerStudio (analytics, attendees)              │    │
│  │  - EventAnalytics (revenue charts)                     │    │
│  │  - AttendeeManager (list + export)                     │    │
│  │  - BulkMessaging (send updates)                        │    │
│  └────────┬────────────────────────┬─────────────────────┘    │
│           │                        │                            │
│           └────────────┬───────────┘                            │
│                        │                                        │
│                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Backend Functions (Deno):                              │    │
│  │  - createCheckoutSession()  [init payment]              │    │
│  │  - handleStripeWebhook()    [process payment]           │    │
│  │  - sendBulkMessage()        [email attendees]           │    │
│  │  [other admin functions]                                │    │
│  └────────┬────────────┬─────────────────────┬─────────────┘    │
│           │            │                     │                   │
└───────────┼────────────┼─────────────────────┼───────────────────┘
            │            │                     │
            ▼            ▼                     ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │  Stripe API  │  │ Base44 Data  │  │ Email Service    │
    │  (Payments)  │  │ (Database)   │  │ (Confirmation)   │
    └──────────────┘  └──────────────┘  └──────────────────┘
            │                │
            │                ▼
            │        ┌──────────────────────────┐
            │        │  8 Entities:             │
            │        │  - TicketType            │
            │        │  - TicketOrder           │
            │        │  - Ticket                │
            │        │  - PromoCode             │
            │        │  - Refund                │
            │        │  - Payout                │
            │        │  - CheckIn               │
            │        │  - PlatformSettings      │
            │        └──────────────────────────┘
            │
            ▼
    ┌────────────────────────────────────┐
    │  Stripe Webhook                    │
    │  /stripe-webhook                   │
    │  Receives:                         │
    │  - checkout.session.completed      │
    │  Triggers:                         │
    │  - handleStripeWebhook()           │
    │  - Ticket creation                 │
    │  - Email confirmation              │
    └────────────────────────────────────┘
```

---

## Data Flow: Ticket Purchase

```
STEP 1: Buyer Selects Ticket
┌──────────────────────┐
│ EventTicketing Page  │
│ /events/{id}/tickets │
└──────┬───────────────┘
       │ Loads TicketSelector component
       ▼
┌────────────────────────────┐
│ TicketSelector Component    │
│ - Query TicketType entity   │
│ - Display options           │
│ - Calculate pricing         │
│ - Allow promo code entry    │
└──────┬─────────────────────┘
       │ User clicks "Continue to Checkout"
       │ Emits: {ticket_type_id, quantity, promo_code}
       ▼

STEP 2: Create Checkout Session
┌──────────────────────────────┐
│ Frontend calls:              │
│ base44.functions.invoke(     │
│   'createCheckoutSession',   │
│   {                          │
│     event_id,                │
│     ticket_type_id,          │
│     quantity,                │
│     promo_code               │
│   }                          │
│ )                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Backend: createCheckoutSession() │
│ 1. Validate inputs               │
│ 2. Fetch Event                   │
│ 3. Fetch TicketType              │
│ 4. Check availability:           │
│    - is_active?                  │
│    - sale_start/end dates?       │
│    - early_bird_expiry?          │
│    - quantity available?         │
│    - max_per_buyer limit?        │
│ 5. Apply promo code (if valid)   │
│ 6. Calculate:                    │
│    - subtotal                    │
│    - discount                    │
│    - fees (5% + $0.50)           │
│    - taxes (8%)                  │
│    - total                       │
│ 7. Create TicketOrder:           │
│    - status: pending             │
│ 8. Create Stripe Session         │
│ 9. Return checkout URL           │
└──────┬───────────────────────────┘
       │ Returns: {checkout_url, order_id, order_number}
       │
       ▼
┌─────────────────────────┐
│ Frontend redirects to   │
│ session.url (Stripe)    │
└──────┬──────────────────┘
       │

STEP 3: Payment (Stripe Checkout)
┌──────────────────────────┐
│ Stripe Checkout Page     │
│ Secure payment form      │
│ - Card entry             │
│ - Billing info           │
│ - Review line items:     │
│   * Tickets              │
│   * Platform Fee         │
│   * Tax                  │
└──────┬───────────────────┘
       │ User enters payment & completes
       │
       ▼
┌──────────────────────────┐
│ Stripe Processes Payment │
│ - Validates card         │
│ - Creates payment intent │
│ - Charges account        │
└──────┬───────────────────┘
       │ Payment successful
       │
       ▼
┌──────────────────────────┐
│ Stripe Fires Webhook:    │
│ checkout.session.completed
└──────┬───────────────────┘
       │

STEP 4: Webhook Processing (handleStripeWebhook)
┌──────────────────────────────────────────┐
│ handleStripeWebhook() Backend Function   │
│                                          │
│ 1. Validate webhook signature            │
│ 2. Extract metadata:                     │
│    - order_id, event_id, buyer_id        │
│ 3. Update TicketOrder:                   │
│    - payment_status = "completed"        │
│    - payment_intent_id = xxx             │
│ 4. Create Ticket records (qty: n):       │
│    FOR EACH ticket:                      │
│      - unique_code = random              │
│      - qr_code_url = generated QR        │
│      - owner_id = buyer_id               │
│ 5. Update TicketType:                    │
│    - quantity_sold += n                  │
│ 6. Create Payout record:                 │
│    - status: pending                     │
│    - amount = total - commission         │
│ 7. Increment PromoCode.usage_count       │
│ 8. Send confirmation email:              │
│    base44.integrations.Core.SendEmail({  │
│      to: buyer_email,                    │
│      subject: "Ticket Confirmation",     │
│      body: "Order #xxx...",              │
│      attachments: [tickets w/ QR]        │
│    })                                    │
│                                          │
│ All updates atomic (transaction)         │
└──────┬───────────────────────────────────┘
       │

STEP 5: Confirmation Page
┌─────────────────────────────────┐
│ /order-confirmation             │
│ ?session_id={CHECKOUT_SESSION_ID}
│                                 │
│ Displays:                       │
│ ✓ Purchase Confirmed            │
│ ✓ Check email for tickets       │
│ ✓ Next steps                    │
│                                 │
│ Links:                          │
│ - View My Tickets (→ Profile)   │
│ - Back to Home                  │
└─────────────────────────────────┘

STEP 6: View Tickets
┌──────────────────────┐
│ /profile             │
│ "My Tickets" tab     │
│                      │
│ Shows:               │
│ - All purchased      │
│   tickets            │
│ - Event details      │
│ - QR code for entry  │
│ - Unique ticket ID   │
└──────────────────────┘
```

---

## Data Flow: Check-In

```
STEP 1: Producer on Event Day
┌──────────────────────────────────┐
│ OrganizerStudio                  │
│ /organizer-studio                │
│ Select event → Check-In Tab      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Check-In Dashboard               │
│ Shows:                           │
│ - All tickets for event          │
│ - Search bar (name, email, code) │
│ - Manual search interface        │
│ - Real-time count (X / Total)    │
└──────┬───────────────────────────┘
       │

STEP 2: Find Attendee
┌──────────────────────────────────┐
│ Producer options:                │
│ A) Scan QR code                  │
│ B) Search: "John Doe"            │
│ C) Search: "john@example.com"    │
│ D) Search: "Ticket #1 of 2"      │
│ E) Search: "unique_code_xyz"     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Frontend queries CheckIn entity  │
│ Filters by:                      │
│ - Ticket unique_code             │
│ - Ticket owner_email             │
│ - Ticket owner_id                │
│ - Ticket number                  │
│                                  │
│ Returns matching Ticket(s)       │
└──────┬───────────────────────────┘
       │

STEP 3: Mark Checked In
┌──────────────────────────────────┐
│ Producer clicks "Check In"       │
│ (or auto on QR scan)             │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Backend function:                │
│ markTicketCheckedIn({            │
│   ticket_id,                     │
│   checked_in_by: staff_id,       │
│   method: "qr_scan" | "manual"   │
│ })                               │
│                                  │
│ 1. Fetch Ticket                  │
│ 2. Check if already checked in   │
│    (prevent duplicate)           │
│ 3. Update Ticket:                │
│    - is_checked_in = true        │
│    - checked_in_at = now         │
│    - checked_in_by = staff_id    │
│ 4. Create CheckIn record:        │
│    - ticket_id                   │
│    - checked_in_at               │
│    - check_in_method             │
│    - ip_address (fraud detect)   │
│ 5. Return success                │
└──────┬───────────────────────────┘
       │

STEP 4: Confirmation
┌──────────────────────────────────┐
│ Dashboard updates:               │
│ ✓ "Attendee: John Doe CHECKED IN"│
│ ✓ Counter: "234 / 500"           │
│ ✓ Prevent re-check-in (warn)     │
│                                  │
│ Producer scans next ticket       │
└──────────────────────────────────┘

OPTIONAL: Export Check-In Report
┌──────────────────────────────────┐
│ At end of event, producer:       │
│ - Clicks "Export Check-In Report"│
│ - CSV generated with:            │
│   * Ticket number                │
│   * Attendee name/email          │
│   * Check-in time                │
│   * Check-in method              │
│ - Downloaded to device           │
└──────────────────────────────────┘
```

---

## Data Flow: Producer Dashboard

```
STEP 1: Access OrganizerStudio
┌──────────────────────────────────┐
│ /organizer-studio                │
│ List of producer's events        │
│ Shows:                           │
│ - Event name + date              │
│ - Ticket count                   │
│ - Revenue summary                │
└──────┬───────────────────────────┘
       │ Click event to manage
       │
       ▼

STEP 2: Event Overview
┌──────────────────────────────────┐
│ EventAnalytics Component          │
│                                  │
│ Metrics Cards:                   │
│ - Total Attendees (RSVPs)        │
│ - Tickets Sold                   │
│ - Revenue                        │
│ - Capacity Used %                │
│                                  │
│ Charts:                          │
│ - Ticket Sales by Type (bar)     │
│ - RSVP Breakdown (pie)           │
│                                  │
│ Data from:                       │
│ - RSVP entity (count "going")    │
│ - TicketType (qty_sold, price)   │
│ - TicketOrder (total_amount)     │
└──────────────────────────────────┘

STEP 3: Attendee Management
┌──────────────────────────────────┐
│ AttendeeManager Component         │
│                                  │
│ Features:                        │
│ - Searchable table               │
│   * Name, Email, Ticket Type     │
│   * Qty, Purchase Date, Status   │
│ - Filters:                       │
│   * By ticket type               │
│   * By payment status            │
│   * By check-in status           │
│ - Bulk Actions:                  │
│   * Select multiple              │
│   * Send message                 │
│   * Refund                       │
│ - Export CSV                     │
│                                  │
│ Data from:                       │
│ - TicketOrder entity             │
│ - Ticket entity (check-in)       │
│ - Joined with User entity        │
└──────────────────────────────────┘

STEP 4: Bulk Messaging
┌──────────────────────────────────┐
│ BulkMessaging Component          │
│                                  │
│ Workflow:                        │
│ 1. Select recipients:            │
│    - All attendees               │
│    - Going only                  │
│    - Interested only             │
│ 2. Compose message:              │
│    - Subject (100 chars)         │
│    - Body (500 chars)            │
│ 3. Preview recipient count       │
│ 4. Confirm and send              │
│                                  │
│ Backend:                         │
│ - Calls sendBulkMessage()        │
│ - Sends email via SendEmail API  │
│ - Returns success count          │
│                                  │
│ Data source:                     │
│ - TicketOrder (filter by status) │
│ - User (get email)               │
└──────────────────────────────────┘
```

---

## Database Schema Relationships

```
Event (existing)
  │
  ├─→ TicketType (1:many)
  │   │
  │   ├─→ TicketOrder (1:many)
  │   │   │
  │   │   ├─→ Ticket (1:many)
  │   │   │   └─→ CheckIn (1:many)
  │   │   │
  │   │   └─→ Refund (1:1 or 1:many)
  │   │
  │   └─→ PromoCode (1:many)
  │
  └─→ Payout (1:many)
      └─→ Organizer/Producer (User entity)

User (existing)
  ├─→ TicketOrder (as buyer_id)
  ├─→ Ticket (as owner_id)
  └─→ CheckIn (as checked_in_by)

PromoCode
  └─→ TicketType (optional whitelist)

PlatformSettings (singleton, admin config)
```

---

## Error Handling Flow

```
Buyer Errors:
- Ticket not available → Show "Sold Out"
- Promo code invalid → Show error, clear field
- Payment declined → Stripe shows error, redirect back
- Quantity exceeds max → Cap at max_per_buyer
- Webhook timeout → Customer receives email on success

Producer Errors:
- Can't create duplicate ticket type → Validation
- Can't edit sold-out ticket → Warning, disable edit
- Bulk message fails → Show retry with count of failures
- Refund fails → Show Stripe error, suggest contact support

Admin Errors:
- Invalid commission % → Validation 0-50%
- Payout account not connected → Show setup flow
```

---

## Security Measures

```
PAYMENT SECURITY:
✓ Stripe handles PCI compliance
✓ No card data stored in database
✓ Webhook signature validation (HMAC-SHA256)
✓ Idempotency: check duplicate payment_intent_id
✓ HTTPS only for all endpoints

DATA SECURITY:
✓ Backend permission checks on all operations
✓ Producer can only see own event attendees
✓ Buyer can only see own tickets
✓ Admin-only: PlatformSettings access
✓ QR codes stored as URL, not embedded

FRAUD PREVENTION:
✓ Stripe dispute handling (future: webhook)
✓ Rate limiting: checkout sessions per user
✓ Monitor refund rate per event/producer
✓ IP logging for check-ins (anomaly detection future)
✓ Duplicate check-in prevention

WEBHOOK SECURITY:
✓ Verify Stripe signature with secret
✓ Check timestamp (prevent replay attacks)
✓ Idempotency key for payment processing
✓ TLS 1.2+ required
```

---

## Scalability Considerations

```
Database Indexes (REQUIRED):
- TicketOrder.event_id
- TicketOrder.buyer_id
- Ticket.owner_id
- Ticket.unique_code
- CheckIn.ticket_id
- PromoCode.event_id
- PromoCode.code (unique)

Caching (Future):
- TicketType availability (5min TTL)
- Payout status (1min TTL)
- Attendee list (read-heavy, cache after export)

Rate Limits:
- Checkout session: 10/user/hour
- Payment failures: 5/card/hour
- Check-in: 100/staff/minute
- Email sends: 1000/minute (Stripe limit)

Performance:
- QR generation: ~50ms (external service)
- Checkout session: ~500ms (Stripe API)
- Attendee CSV export: <10s for 1000 attendees
- Webhook processing: <5s P99
```

---

## Deployment Checklist

- [ ] Environment variables set (Stripe keys)
- [ ] Database indexes created
- [ ] Stripe webhook endpoint registered
- [ ] Email service configured
- [ ] SSL certificate valid
- [ ] Rate limiting enabled
- [ ] Monitoring/alerting configured
- [ ] Error logging enabled
- [ ] Backup strategy in place
- [ ] Documentation reviewed with support team