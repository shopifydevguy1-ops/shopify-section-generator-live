# Environment Variables Setup Guide

Based on your current environment, here are the additional variables you need to add:

## ✅ Already Set
- `DATABASE_URL` - Your Supabase PostgreSQL connection string ✓
- `NODE_ENV` - Set to `production` ✓

## 🔴 Required Variables to Add

### Clerk Authentication (Required)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**How to get:**
1. Go to [clerk.com](https://clerk.com) and sign in
2. Select your application (or create one)
3. Go to "API Keys" section
4. Copy the Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy the Secret Key → `CLERK_SECRET_KEY`
6. Configure the URLs in Clerk dashboard under "Paths"

### PayMongo Payments (Required)
```
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PAYMONGO_PRO_AMOUNT=2000
```

**How to get:**
1. Go to [paymongo.com](https://www.paymongo.com) and sign up for a free account
2. Complete account activation and verification
3. Go to "Developers" → "API Keys"
4. Copy Secret key → `PAYMONGO_SECRET_KEY`
   - Use test keys (`sk_test_...`) for development
   - Use live keys (`sk_live_...`) for production
5. Set up Webhook:
   - Go to "Developers" → "Webhooks"
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `payment.paid`
     - `payment.failed`
     - `payment.refunded`
   - Copy Webhook secret → `PAYMONGO_WEBHOOK_SECRET`
6. Configure Pro Plan Amount:
   - `PAYMONGO_PRO_AMOUNT` is the amount in cents (e.g., 2000 = ₱20.00)
   - Adjust based on your pricing (default: 2000 for ₱20.00/month)

**Note:** PayMongo doesn't have native subscription support like Stripe. This implementation uses manual recurring billing through checkout sessions. For true recurring subscriptions, you'll need to implement a cron job or scheduled task to create new checkout sessions monthly.

### App Configuration (Required)
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Replace `yourdomain.com` with your actual domain.

### Optional Variables
```
PORT=3000
```
(Only needed if running Node.js directly, not for static export)

## 📋 Complete Environment Variables List

Add these to your environment variables interface:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `DATABASE_URL` | `postgresql://...` | ✅ (Already set) |
| `NODE_ENV` | `production` | ✅ (Already set) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | ✅ |
| `CLERK_SECRET_KEY` | `sk_live_...` | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | ✅ |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | ✅ |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | ✅ |
| `PAYMONGO_SECRET_KEY` | `sk_live_...` | ✅ |
| `PAYMONGO_WEBHOOK_SECRET` | `whsec_...` | ✅ |
| `PAYMONGO_PRO_AMOUNT` | `2000` | ✅ (Amount in cents, e.g., 2000 = ₱20.00) |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | ✅ |
| `PORT` | `3000` | ⚪ Optional |
| `JWT_SECRET` | (Keep if used by other services) | ⚪ Optional |

## 🔒 Security Notes

- Use **production keys** (`sk_live_`) for production
- Use **test keys** (`sk_test_`) only for development
- Never commit environment variables to Git
- Keep webhook secrets secure
- PayMongo Secret Key should only be used server-side

## ✅ Verification Checklist

After adding all variables:
- [ ] All Clerk variables set
- [ ] All PayMongo variables set
- [ ] App URL set to your production domain
- [ ] Database URL is correct
- [ ] PayMongo webhook endpoint configured
- [ ] Clerk URLs configured in dashboard
- [ ] PayMongo Pro amount configured (in cents)

## 🚀 Next Steps

1. Add all required environment variables
2. Set up database schema (run SQL from `lib/db.ts`)
3. Deploy your application
4. Test authentication (sign up/login)
5. Test section generation
6. Test PayMongo checkout (use test mode first)
7. **Important:** Since PayMongo doesn't have native subscriptions, consider implementing a cron job or scheduled task for recurring billing

