# Ticketing System API Reference

## Backend Functions (Deno/Node.js)

All functions are called from the frontend via:
```javascript
import { base44 } from '@/api/base44Client';

const response = await base44.functions.invoke('functionName', {
  // payload
});

// Access response data
const { data } = response; // response.data contains the returned object
```

---

## Function: createCheckoutSession

**Purpose**: Initialize Stripe Checkout session and create TicketOrder record

**HTTP Method**: POST  
**Route**: `/api/functions/createCheckoutSession` (auto-routed via base44 SDK)

### Request Payload

```json
{
  "event_id": "evt_abc123",
  "ticket_type_id": "tt_xyz789", 
  "quantity": 2,
  "promo_code": "EARLYBIRD10"
}
```

### Request Validation

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| event_id | string | Yes | Must exist in Event entity |
| ticket_type_id | string | Yes | Must exist in TicketType entity, belong to event_id |
| quantity | number | Yes | >= 1, <= (quantity_total - quantity_sold), <= max_per_buyer |
| promo_code | string | No | If provided, must be valid & active |

### Response Success (200 OK)

```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_aBc123XyZ...",
  "session_id": "cs_live_aBc123XyZ...",
  "order_id": "ord_internal_id_123",
  "order_number": "ORD-2026-0001"
}
```

### Response Errors

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Invalid parameters | Missing or malformed input |
| 400 | Event not found | event_id doesn't exist |
| 400 | Ticket type not found | ticket_type_id doesn't exist |
| 400 | Ticket type mismatch | ticket_type_id doesn't belong to event_id |
| 400 | Ticket type is not on sale | is_active = false |
| 400 | Ticket sales have not started yet | Current date < sale_start_date |
| 400 | Ticket sales have ended | Current date > sale_end_date |
| 400 | Early bird tickets have expired | Current date > early_bird_expiry_date |
| 400 | Only X tickets available | Insufficient inventory for quantity requested |
| 400 | Maximum X tickets per buyer | quantity > max_per_buyer |
| 400 | Promo code is not active | PromoCode.is_active = false |
| 400 | Promo code limit reached | usage_count >= usage_limit |
| 400 | Promo code not yet valid | Current date < valid_from |
| 400 | Promo code has expired | Current date > valid_until |
| 400 | Promo code not valid for this ticket type | ticket_type not in whitelist |
| 401 | Unauthorized | User not authenticated |
| 500 | Stripe configuration missing | STRIPE_SECRET_KEY not set |
| 500 | Stripe error: {message} | Stripe API failure |

### Database Changes

**Creates:**
- TicketOrder (status: pending)

**Queries:**
- Event (filter by id)
- TicketType (filter by id)
- PromoCode (filter by code, if provided)

### Stripe Interaction

1. Creates Stripe Checkout Session
2. Line items:
   - Tickets (subtotal after discount)
   - Platform Fee
   - Tax
3. Metadata includes: event_id, order_id, buyer_id

### Example Usage

```javascript
const response = await base44.functions.invoke('createCheckoutSession', {
  event_id: 'evt_summer_festival_2026',
  ticket_type_id: 'tt_general_admission',
  quantity: 2,
  promo_code: 'EARLY20'
});

if (response.status === 200) {
  window.location.href = response.data.checkout_url;
} else {
  console.error(response.data.error);
}
```

---

## Function: handleStripeWebhook

**Purpose**: Process Stripe webhook events (primarily `checkout.session.completed`)

**HTTP Method**: POST  
**Route**: `/stripe-webhook` (configured in Stripe Dashboard)
**Headers Required**:
- `stripe-signature`: HMAC-SHA256 signed header from Stripe

### Webhook Event Type: checkout.session.completed

**Stripe sends:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_aBc123XyZ...",
      "payment_intent": "pi_live_123xyz...",
      "customer_email": "buyer@example.com",
      "metadata": {
        "event_id": "evt_abc123",
        "order_id": "ord_internal_id_123",
        "buyer_id": "user_xyz789",
        "promo_code": "EARLYBIRD10"
      }
    }
  }
}
```

### Response (All Cases: 200 OK)

```json
{
  "received": true
}
```

**Note**: Always return 200 OK to acknowledge receipt. Stripe will retry if webhook fails.

### Webhook Processing Steps

1. **Verify signature** - Validate HMAC-SHA256 using STRIPE_WEBHOOK_SECRET
2. **Extract metadata** - Get event_id, order_id, buyer_id
3. **Update TicketOrder**
   - payment_status = "completed"
   - payment_intent_id = session.payment_intent
4. **Create Ticket records**
   - For each unit (quantity times):
     - unique_code = "{ORDER_NUMBER}-{INDEX}-{RANDOM}"
     - qr_code_url = QR code image URL
     - owner_id = buyer_id
5. **Update TicketType**
   - quantity_sold += order.quantity
6. **Create Payout record**
   - status = "pending"
   - total_gross_sales = order.total_amount
   - platform_commission = order.platform_fee
   - net_payout = gross - commission
7. **Increment PromoCode usage** (if used)
   - usage_count += 1
8. **Send confirmation email**
   - To: buyer email
   - Subject: "Ticket Confirmation - {Event Title}"
   - Body: Order details + ticket codes + QR codes

### Webhook Security

- Signature is required and validated with secret
- Timestamp is checked to prevent replay attacks
- All database operations are atomic (transaction)
- Idempotent: if called twice, won't create duplicate records

### Error Handling

If webhook processing fails:
- Returns 500 error
- Stripe retries webhook (up to 5 times over 24 hours)
- Check logs for detailed error message
- Manual intervention may be required for failed orders

### Example Log Entry

```
[handleStripeWebhook] Event received: checkout.session.completed
[handleStripeWebhook] Order ID: ord_xyz123
[handleStripeWebhook] Creating 2 tickets...
[handleStripeWebhook] Updated TicketType: qty_sold = 45
[handleStripeWebhook] Created Payout record
[handleStripeWebhook] Sent confirmation email to buyer@example.com
[handleStripeWebhook] Success
```

---

## Function: sendBulkMessage

**Purpose**: Send email to multiple event attendees

**HTTP Method**: POST  
**Route**: `/api/functions/sendBulkMessage` (auto-routed via base44 SDK)

### Request Payload

```json
{
  "recipients": [
    "attendee1@example.com",
    "attendee2@example.com",
    "attendee3@example.com"
  ],
  "subject": "Event Update: See you soon!",
  "message": "We're excited to see you at the Summer Festival on May 15th. Doors open at 6 PM.",
  "eventTitle": "Summer Festival 2026"
}
```

### Request Validation

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| recipients | array<string> | Yes | Non-empty, valid emails |
| subject | string | Yes | 1-100 characters |
| message | string | Yes | 1-1000 characters |
| eventTitle | string | Yes | 1-200 characters |

### Response Success (200 OK)

```json
{
  "sent": 150,
  "failed": 2,
  "message": "Successfully sent to 150 recipient(s) (2 failed)"
}
```

### Response Errors

| Status | Error | Reason |
|--------|-------|--------|
| 400 | No recipients provided | Empty recipients array |
| 400 | Subject and message are required | Missing or empty fields |
| 401 | Unauthorized | User not authenticated |
| 500 | Email service error | Stripe SendEmail API failure |

### Email Format

**Subject Line**: `[{Event Title}] {subject}`

**Body**:
```
{message}

---
You received this message because you RSVP'd to {Event Title}.
```

**From Name**: Sender's full name (or "Event Organizer")

### Rate Limits

- Max 1000 emails per minute (Stripe limit)
- If exceeded, return error and retry later
- Recommended: batch large sends (>500) with delays

### Example Usage

```javascript
const response = await base44.functions.invoke('sendBulkMessage', {
  recipients: ['user1@example.com', 'user2@example.com'],
  subject: '24 hours until event!',
  message: 'Don\'t forget about our event tomorrow. Arrive early!',
  eventTitle: 'Tech Conference 2026'
});

console.log(`Sent to ${response.data.sent}, Failed: ${response.data.failed}`);
```

---

## Entity CRUD Operations

All entities can be created, read, updated, deleted via the SDK:

```javascript
// CREATE
const newTicket = await base44.entities.Ticket.create({
  order_id: 'ord_123',
  ticket_type_id: 'tt_456',
  // ... other fields
});

// READ (all)
const tickets = await base44.entities.Ticket.list('-created_date', 100);

// READ (filter)
const ticketsForOrder = await base44.entities.Ticket.filter({
  order_id: 'ord_123'
});

// UPDATE
await base44.entities.Ticket.update(ticketId, {
  is_checked_in: true,
  checked_in_at: new Date().toISOString()
});

// DELETE
await base44.entities.Ticket.delete(ticketId);
```

---

## Stripe API Integration (Backend Only)

The backend makes direct Stripe API calls for:

1. **Create Checkout Session** (in createCheckoutSession)
   - Endpoint: `POST https://api.stripe.com/v1/checkout/sessions`
   - Auth: Bearer token (STRIPE_SECRET_KEY)
   
2. **Create Refund** (future function)
   - Endpoint: `POST https://api.stripe.com/v1/refunds`
   - Auth: Bearer token (STRIPE_SECRET_KEY)

3. **List Payouts** (future function)
   - Endpoint: `GET https://api.stripe.com/v1/payouts`
   - Auth: Bearer token (STRIPE_SECRET_KEY)

**Note**: Never call Stripe API directly from frontend. Always use backend functions.

---

## Data Type References

### TicketOrder Object

```javascript
{
  id: string,                    // auto-generated
  event_id: string,              // ref to Event
  ticket_type_id: string,        // ref to TicketType
  buyer_id: string,              // ref to User
  buyer_email: string,           // email address
  buyer_name: string,            // full name
  quantity: number,              // 1-100+
  subtotal: number,              // price × quantity
  taxes: number,                 // subtotal × 0.08
  platform_fee: number,          // commission
  discount_applied: number,      // promo code discount
  total_amount: number,          // final total paid
  payment_status: string,        // pending|completed|failed|refunded
  payment_intent_id: string,     // Stripe payment intent ID
  order_number: string,          // human-readable (ORD-2026-0001)
  payout_status: string,         // pending|processed|failed
  refund_status: string,         // none|partial|full
  created_date: string,          // ISO 8601 datetime
  updated_date: string,          // ISO 8601 datetime
}
```

### Ticket Object

```javascript
{
  id: string,                    // auto-generated
  order_id: string,              // ref to TicketOrder
  ticket_type_id: string,        // ref to TicketType
  event_id: string,              // ref to Event
  owner_id: string,              // ref to User (initial buyer)
  owner_email: string,           // email of current holder
  unique_code: string,           // 50+ char unique identifier
  qr_code_url: string,           // URL to QR code image
  ticket_number: string,         // "Ticket #1 of 3"
  is_checked_in: boolean,        // checked in at event?
  checked_in_at: string | null,  // ISO 8601 datetime
  checked_in_by: string | null,  // ref to User (staff)
  created_date: string,          // ISO 8601 datetime
}
```

### PromoCode Object

```javascript
{
  id: string,
  code: string,                  // uppercase unique code
  event_id: string | null,       // null = platform-wide
  discount_type: string,         // percentage|fixed
  discount_value: number,        // 10 or 5 etc
  usage_limit: number | null,    // max uses
  usage_count: number,           // current uses
  ticket_type_whitelist: string[] | null,  // [tt_id, ...]
  valid_from: string | null,     // ISO 8601
  valid_until: string | null,    // ISO 8601
  is_active: boolean,            // can be used?
  created_date: string,
}
```

---

## Pricing Calculation Reference

```javascript
function calculatePrice(ticketPrice, quantity, discountPercent = 0, discountFixed = 0) {
  const subtotal = ticketPrice * quantity;
  const discount = Math.max(0, (subtotal * discountPercent / 100) + (discountFixed * quantity));
  const discountedSubtotal = subtotal - discount;
  
  const platformFeePercent = discountedSubtotal * 0.05;
  const platformFeeFlat = 0.50 * quantity;
  const platformFee = platformFeePercent + platformFeeFlat;
  
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + platformFee + tax;
  
  return {
    subtotal,
    discount,
    discountedSubtotal,
    platformFee,
    tax,
    total,
    producerPayout: discountedSubtotal - platformFee
  };
}
```

---

## Error Code Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check payload format & required fields |
| 401 | Unauthorized | User must be logged in |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Data conflict (e.g., duplicate code) |
| 500 | Server Error | Backend failure, check logs |
| 503 | Service Unavailable | External service (Stripe, email) down |

---

## Testing with Stripe Test Cards

```
Success: 4242 4242 4242 4242 (any future date, any CVC)
Decline: 4000 0000 0000 0002
Expired: 4000 0000 0000 0069
Declined: 4000 0000 0000 0069
```

Use any future expiration date (e.g., 12/26) and any 3-digit CVC.