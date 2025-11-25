# Deployment Guide for Z.com Hosting

This guide will help you deploy the Shopify Section Generator to Z.com hosting.

## Prerequisites

- Z.com hosting account
- GitHub repository set up
- Stripe account configured
- Clerk account configured
- PostgreSQL database (or Supabase)

## Step 1: Prepare Your Code

1. **Ensure all environment variables are documented**
   - Check `.env.example` for all required variables
   - Never commit `.env.local` to Git

2. **Test locally**
   ```bash
   npm run build
   ```
   Ensure the build completes without errors.

## Step 2: Database Setup

Since Z.com typically offers PHP hosting, you have a few options:

### Option A: Use Supabase (Recommended)
1. Create a free Supabase account
2. Create a new project
3. Run the SQL schema from `lib/db.ts` in the Supabase SQL editor
4. Get your connection string from Supabase settings

### Option B: Use a Separate Database Service
- Railway, Render, or any PostgreSQL hosting service
- Run the schema and get connection string

## Step 3: API Routes Consideration

**Important**: Next.js static export doesn't support API routes. You have two options:

### Option A: Use Serverless Functions (Recommended)
1. Deploy API routes to Vercel, Netlify, or Railway
2. Update API calls in the frontend to point to your serverless functions
3. Deploy the static frontend to Z.com

### Option B: Create a Separate Backend
1. Create a Node.js/Express backend
2. Host it on Railway, Render, or a VPS
3. Point frontend API calls to your backend URL

### Option C: Use Z.com's Serverless Functions (If Available)
1. Check if Z.com offers serverless functions
2. Deploy API routes there
3. Update API URLs accordingly

## Step 4: Build and Export

1. **Build the application**
   ```bash
   npm run build
   ```
   
   This creates a static export in `/out` directory.

2. **Verify the output**
   - Check that `/out` directory contains all static files
   - Ensure no API routes are in the export (they won't work)

## Step 5: Deploy to Z.com

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect GitHub to Z.com**
   - Log into Z.com control panel
   - Find "GitHub Integration" or "Deploy from Git"
   - Connect your repository
   - Set build command: `npm run build`
   - Set output directory: `out`
   - Configure environment variables

### Method 2: Manual Upload

1. **Compress the /out directory**
   ```bash
   cd out
   tar -czf ../deploy.tar.gz .
   ```

2. **Upload to Z.com**
   - Log into Z.com file manager
   - Upload and extract `deploy.tar.gz` to your domain root
   - Or use FTP/SFTP to upload contents of `/out` directory

## Step 6: Configure Environment Variables

In Z.com control panel, set these environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

DATABASE_URL=postgresql://user:password@host:5432/database

NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Note**: Use production keys (pk_live_, sk_live_) not test keys.

## Step 7: Set Up Stripe Webhooks

1. **Go to Stripe Dashboard → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Copy webhook signing secret** to environment variables

**Important**: If using static hosting, webhooks must point to your serverless functions or backend API, not the static site.

## Step 8: Upload Section Library

1. **Upload section templates**
   - Use Z.com file manager or FTP
   - Upload JSON files to `/section-library` directory
   - Or configure to load from a CDN/storage service

2. **Alternative**: Store templates in database
   - Modify `lib/section-generator.ts` to load from database
   - Import templates via admin interface

## Step 9: Test Deployment

1. **Visit your domain**
   - Check landing page loads
   - Test navigation

2. **Test authentication**
   - Try signing up
   - Verify redirects work

3. **Test section generation**
   - Create an account
   - Generate a section
   - Verify download works

4. **Test payments** (use Stripe test mode first)
   - Try upgrading to Pro
   - Verify webhook receives events
   - Check subscription status updates

## Step 10: Production Checklist

- [ ] All environment variables set
- [ ] Database schema created
- [ ] API routes deployed (if using separate backend)
- [ ] Stripe webhooks configured
- [ ] Section library uploaded
- [ ] SSL certificate active (HTTPS)
- [ ] Domain configured
- [ ] Error tracking set up (optional)
- [ ] Analytics configured (optional)

## Troubleshooting

### Static files not loading
- Check file paths are correct
- Verify `.htaccess` or server config for SPA routing
- Ensure `trailingSlash: true` in `next.config.js`

### API calls failing
- Verify API routes are deployed separately
- Check CORS settings
- Verify API URLs in frontend code

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is accessible from Z.com servers
- Ensure firewall allows connections

### Webhooks not working
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure webhook endpoint is accessible (not static)

## Alternative: Full Server Deployment

If Z.com offers Node.js hosting:

1. **Don't use static export**
   - Remove `output: 'export'` from `next.config.js`
   - Deploy as Node.js application

2. **Set up Node.js environment**
   - Configure Node.js version (18+)
   - Set start command: `npm start`
   - Set build command: `npm run build`

3. **Deploy normally**
   - API routes will work
   - No need for separate backend

## Support

For Z.com-specific issues, consult Z.com documentation or support.

For application issues, check the main README.md troubleshooting section.

