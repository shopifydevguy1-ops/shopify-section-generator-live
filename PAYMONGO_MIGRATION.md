# PayMongo Migration Guide

This document explains the migration from Stripe to PayMongo payment gateway.

## ✅ What Was Changed

### Code Changes
1. **Created PayMongo Client** (`lib/paymongo.ts`)
   - Custom REST API client (PayMongo doesn't have an npm package)
   - Handles checkout session creation
   - Webhook signature verification
   - Payment intent management

2. **Updated API Routes**
   - `/api/checkout` - Now uses PayMongo Checkout API
   - `/api/webhooks/stripe` - Updated to handle PayMongo webhook events
   - `/api/cancel-subscription` - Updated for PayMongo (manual cancellation)

3. **Database Schema Updates**
   - Changed `stripe_subscription_id` → `paymongo_payment_id`
   - Changed `stripe_customer_id` → `paymongo_payment_intent_id`
   - Updated indexes accordingly

4. **Removed Dependencies**
   - Removed `stripe` npm package from `package.json`

### Environment Variables Changed

**Old (Stripe):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
```

**New (PayMongo):**
```env
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PAYMONGO_PRO_AMOUNT=2000
```

## ⚠️ Important Differences

### 1. No Native Subscription Support
PayMongo **does not have native subscription/recurring payment support** like Stripe. This implementation uses:
- One-time checkout sessions for monthly payments
- Manual tracking of subscription periods
- Webhooks to handle payment events

### 2. Recurring Billing Solution
For true recurring subscriptions, you have two options:

**Option A: Manual Monthly Checkout**
- Users pay monthly through checkout sessions
- You track subscription periods in your database
- Send reminders when subscription is about to expire

**Option B: Implement Cron Job**
- Create a scheduled task (cron job) that:
  - Checks for subscriptions expiring soon
  - Creates new checkout sessions for renewals
  - Sends payment links to users via email
- This requires a backend service that can run scheduled tasks

### 3. Payment Methods Supported
PayMongo supports:
- Credit/Debit Cards (Visa, Mastercard)
- GCash
- Maya (formerly PayMaya)
- GrabPay

### 4. Currency
PayMongo primarily uses PHP (Philippine Peso). Amounts are in **cents**:
- ₱20.00 = 2000 cents
- Set `PAYMONGO_PRO_AMOUNT=2000` for ₱20.00

## 🔧 Setup Instructions

### 1. Create PayMongo Account
1. Go to [paymongo.com](https://www.paymongo.com)
2. Sign up for a free account
3. Complete account verification

### 2. Get API Keys
1. Go to Dashboard → Developers → API Keys
2. Copy your Secret Key → `PAYMONGO_SECRET_KEY`
3. Use test keys (`sk_test_...`) for development
4. Use live keys (`sk_live_...`) for production

### 3. Set Up Webhooks
1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment.paid`
   - `payment.failed`
   - `payment.refunded`
4. Copy webhook secret → `PAYMONGO_WEBHOOK_SECRET`

### 4. Configure Amount
Set `PAYMONGO_PRO_AMOUNT` in your environment variables:
- Amount in cents (e.g., 2000 = ₱20.00)
- Adjust based on your pricing

### 5. Update Database Schema
Run this SQL to update your database schema:

```sql
-- Rename columns
ALTER TABLE subscriptions 
  RENAME COLUMN stripe_subscription_id TO paymongo_payment_id;

ALTER TABLE subscriptions 
  RENAME COLUMN stripe_customer_id TO paymongo_payment_intent_id;

-- Update indexes
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_id 
  ON subscriptions(paymongo_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_intent_id 
  ON subscriptions(paymongo_payment_intent_id);
```

## 🧪 Testing

### Test Mode
1. Use test API keys (`sk_test_...`)
2. Use PayMongo test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Webhooks
PayMongo provides a webhook testing tool in their dashboard. Use it to test webhook events.

## 📊 Fee Structure

PayMongo charges:
- **Credit/Debit Cards**: 3.5% + ₱15 per transaction
- **E-wallets (GCash, Maya)**: 3% per transaction
- **No setup fees**
- **No monthly fees**

Compare this to Stripe's fees (if you were using it):
- Stripe: 3.6% + ₱15 for international cards
- Stripe is not available in the Philippines

## 🚀 Next Steps

1. **Set up PayMongo account** and get API keys
2. **Update environment variables** in your hosting
3. **Update database schema** (run SQL above)
4. **Test checkout flow** in test mode
5. **Set up webhooks** and test them
6. **Implement recurring billing solution** (cron job or manual reminders)

## 📝 Notes

- The webhook endpoint path is still `/api/webhooks/stripe` for backward compatibility
- You can rename it to `/api/webhooks/paymongo` if you prefer
- All payment processing is now handled through PayMongo's Checkout API
- Subscription management is manual - you'll need to track periods and handle renewals

## 🆘 Support

- PayMongo Documentation: https://developers.paymongo.com
- PayMongo Support: support@paymongo.com
- PayMongo Help Center: https://paymongo.help

---

**Migration completed successfully!** 🎉

