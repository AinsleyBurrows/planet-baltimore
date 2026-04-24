# Ticketing System Quick Reference

## Database Entities

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **TicketType** | Ticket offering (Early Bird, VIP, etc.) | event_id, name, price, quantity_total, quantity_sold, max_per_buyer, sale_start/end_date |
| **TicketOrder** | Purchase transaction | event_id, buyer_id, quantity, total_amount, payment_status, payment_intent_id |
| **Ticket** | Individual ticket | order_id, owner_id, unique_code, qr_code_url, is_checked_in |
| **PromoCode** | Discount code | code, event_id, discount_type, discount_value, valid_from/until |
| **Refund** | Refund request | order_id, refund_amount, status, reason |
| **Payout** | Producer earnings | event_id, organizer_id, total_gross_sales, platform_commission, net_payout |
| **CheckIn** | Attendance record | ticket_id, checked_in_at, check_in_method |
| **PlatformSettings** | Admin config | setting_name, setting_value |

---

## Backend Functions

### createCheckoutSession
Creates Stripe Checkout session and TicketOrder record.

**Input:**
```json
{
  "event_id": "evt_123",
  "ticket_type_id": "tt_456",
  "quantity": 2,
  "promo_code": "EARLYBIRD10"
}
```

**Output:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_live_...",
  "order_id": "ord_789",
  "order_number": "ORD-2026-0001"
}
```

**Called from:** `pages/EventTicketing.jsx`

---

### handleStripeWebhook
Processes `checkout.session.completed` event.

**Webhook Event:**
```
POST /stripe-webhook
Event: checkout.session.completed
Payload: {
  "data": {
    "object": {
      "id": "cs_live_...",
      "payment_intent": "pi_...",
      "metadata": {
        "event_id": "evt_123",
        "order_id": "ord_789",
        "buyer_id": "user_123"
      }
    }
  }
}
```

**Actions:**
1. Validate webhook signature
2. Update TicketOrder: status = completed
3. Create Ticket records (one per unit)
4. Generate QR codes
5. Update TicketType: quantity_sold
6. Create Payout record
7. Send confirmation email
8. Increment PromoCode usage

---

### sendBulkMessage
Sends email to all event attendees (or filtered group).

**Input:**
```json
{
  "recipients": ["user@example.com", "user2@example.com"],
  "subject": "Event reminder",
  "message": "See you soon!",
  "eventTitle": "Summer Festival"
}
```

**Output:**
```json
{
  "sent": 150,
  "failed": 2,
  "message": "Successfully sent to 150 recipient(s) (2 failed)"
}
```

---

## UI Components

### TicketSelector
Ticket type selection with quantity, promo code, price breakdown.

**Props:**
```javascript
{
  eventId: string,
  onSelectTickets: (selection) => void
}
```

**Emits:**
```javascript
{
  ticket_type_id: string,
  quantity: number,
  promo_code: string | null,
  pricing: {
    subtotal: number,
    discount: number,
    taxes: number,
    fee: number,
    total: number
  }
}
```

### EventTicketing Page
Entry point for ticket purchase (`/events/{id}/tickets`)

**Props:** None (uses URL params)

### OrderConfirmation Page
Post-purchase confirmation (`/order-confirmation?session_id=xxx`)

**Props:** None (uses URL params)

---

## Pricing Formula

```
Subtotal = TicketType.price × quantity

Discount (if promo_code applied):
  - percentage: Subtotal × (discount_value / 100)
  - fixed: discount_value × quantity

Discounted Subtotal = Subtotal - Discount

Platform Fee = (Discounted Subtotal × 5%) + (0.50 × quantity)

Tax = Discounted Subtotal × 8%

Total Amount = Discounted Subtotal + Platform Fee + Tax

Producer Payout = Discounted Subtotal - Platform Fee
```

---

## Ticket Type Groups

```
early_bird     → Lower price, expires by date or qty
general        → Standard admission
vip            → Higher price, special perks
group          → Bundled discount (3+ tickets)
free           → Price = 0, still tracked
donation       → Buyer enters custom amount ≥ base price
promo          → Ad-hoc discounted ticket
member         → Visibility restricted to members
```

---

## Status Values

### TicketOrder.payment_status
- `pending` - Awaiting payment
- `completed` - Payment received
- `failed` - Payment declined
- `refunded` - Refund processed

### TicketOrder.payout_status
- `pending` - Not yet paid to producer
- `processed` - Paid to producer
- `failed` - Payment failed

### Refund.status
- `pending` - Awaiting approval
- `approved` - Refund approved, processing
- `rejected` - Refund denied
- `processed` - Refund sent to buyer

### Payout.payout_status
- `pending` - Scheduled, not yet sent
- `in_transit` - Sent to bank
- `completed` - Arrived in bank account
- `failed` - Bank rejected transfer

### Ticket.is_checked_in
- `false` - Not attended
- `true` - Checked in at event

---

## Key URLs

| Action | URL |
|--------|-----|
| Browse event | `/events/{id}` |
| Buy tickets | `/events/{id}/tickets` |
| Order confirmation | `/order-confirmation?session_id={id}` |
| View my tickets | `/profile` (My Tickets tab) |
| Manage event ticketing | `/organizer-studio` (select event) |
| Check attendees in | `/organizer-studio` (Check-In tab) |
| Admin settings | Dashboard (admin only) |

---

## Permissions Model

| Role | Can Do |
|------|--------|
| **Buyer** | View public ticket types, purchase, view own tickets, resend confirmation |
| **Producer** | Create ticket types, pause/resume sales, view own attendees, message attendees, check in, export CSV, request refund |
| **Admin** | View all orders, adjust commission, manage payouts, disable events, manage promo codes |

---

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Checkout completion rate | 70%+ |
| Payment success rate | 98%+ |
| Webhook processing success | 99.9%+ |
| Email delivery rate | 95%+ |
| Platform fee realization | 95%+ |

---

## Configuration

Edit commission in `functions/createCheckoutSession.js`:

```javascript
const COMMISSION_PERCENTAGE = 5; // % of subtotal
const COMMISSION_FLAT_FEE = 0.50; // $ per ticket
```

Edit tax rate in `components/ticketing/TicketSelector.jsx`:

```javascript
const taxes = discountedSubtotal * 0.08; // 8%
```

---

## Stripe Integration Points

1. **Checkout Session Creation** → `createCheckoutSession`
2. **Webhook Processing** → `handleStripeWebhook`
3. **Refund Initiation** → Call Stripe Refunds API
4. **Payout Tracking** → Query Stripe Connect payouts (future)

---

## Email Notifications Sent

1. **Purchase Confirmation** - Immediately after payment success
2. **Refund Confirmation** - When refund processed
3. **Event Reminder** - 24h before event (bulk message)
4. **Payout Notification** - When payout issued (future)

---

## Rate Limits (Recommended)

- Checkout sessions: 10 per user per hour
- Failed payments: 5 per card per hour
- Check-in attempts: 100 per staff per minute
- Email sends: 1000 per minute (Stripe limit)

---

## Monitoring & Alerts

- Alert if webhook failure rate > 0.1%
- Alert if payment failure rate > 2%
- Alert if refund rate > 5% per event
- Monitor Stripe balance daily
- Monitor email delivery bounce rate

---

## Troubleshooting

| Issue | Debug |
|-------|-------|
| Webhook not firing | Check Stripe dashboard → Webhooks → Logs |
| Payment stuck | Check Stripe dashboard → Payments → Find session |
| Email not sent | Check email integration logs |
| QR code blank | Verify qrserver.com is accessible |
| Promo not applying | Check code active, date range, ticket whitelist |

---

## Related Documentation

- `TICKETING_SYSTEM_SPEC.md` - Full specification
- `TICKETING_IMPLEMENTATION_GUIDE.md` - Detailed setup guide
- Stripe Docs: https://stripe.com/docs/payments/checkout
- Email Integration: See `base44.integrations.Core.SendEmail