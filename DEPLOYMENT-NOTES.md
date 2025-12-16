# Deployment Notes

## Pricing Configuration

The pricing is controlled by environment variables in Vercel. If these are set, they will override the code defaults.

**To update pricing in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update or add:
   - `PRO_PLAN_USD_AMOUNT` = `4.99` (default if not set)
   - `EXPERT_PLAN_USD_AMOUNT` = `49.99` (default if not set)

**Current Defaults (in code):**
- Pro Plan: $4.99/month
- Expert Plan: $49.99 one-time

If environment variables are set to old values (e.g., `20` or `125`), update them in Vercel to match the new pricing.

## Image Serving

Images are served via `/api/sections/images/[...path]` route. The `sections/images` directory is excluded from most serverless function bundles to reduce size, but remains accessible at runtime for the image serving route.

If images are not displaying:
1. Check that `sections/images` directory exists in the deployment
2. Verify the image route is accessible (requires authentication)
3. Check server logs for image path errors

