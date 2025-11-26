# Deployment Guide for Z.com Hosting

This guide will help you deploy the Shopify Section Generator to Z.com hosting.

## Prerequisites

- Z.com hosting account
- GitHub repository set up
- PayMongo account configured (free account available)
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

### Method 1a: Using cPanel Git Interface

If using cPanel's Git Version Control:

1. **Ensure `.cpanel.yml` file exists**
   - The `.cpanel.yml` file is required for cPanel deployment
   - This file is already included in the repository root
   - It configures the build and deployment process

2. **If you get "directory already contains files" error:**
   - **Option A**: Change the repository path to a new name (e.g., `repositories/shopify-section-generator-live-v2`)
   - **Option B**: Delete the existing directory via File Manager first, then clone
   - **Option C**: If the directory already has the repo, use "Pull" instead of "Clone"

3. **Clone the repository**
   - Repository URL: `https://github.com/shopifydevguy1-ops/shopify-section-generator-live`
   - Repository Path: Choose a path that doesn't exist or is empty
   - Repository Name: `shopify-section-generator-live`

4. **Deploy the repository**
   - After cloning, cPanel will automatically deploy using the `.cpanel.yml` configuration
   - Or manually click "Deploy HEAD Commit" in the Git Version Control interface
   - The deployment will:
     - Install npm dependencies
     - Build the Next.js application
     - Copy the built files from `/out` to `public_html`

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

PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PAYMONGO_PRO_AMOUNT=2000

DATABASE_URL=postgresql://user:password@host:5432/database

NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Note**: Use production keys (sk_live_) not test keys.

## Step 7: Set Up PayMongo Webhooks

1. **Go to PayMongo Dashboard → Developers → Webhooks**
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events**:
   - `payment.paid`
   - `payment.failed`
   - `payment.refunded`
4. **Copy webhook signing secret** to `PAYMONGO_WEBHOOK_SECRET` environment variable

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

4. **Test payments** (use PayMongo test mode first)
   - Try upgrading to Pro
   - Verify webhook receives events
   - Check subscription status updates

## Step 10: Production Checklist

- [ ] All environment variables set
- [ ] Database schema created
- [ ] API routes deployed (if using separate backend)
- [ ] PayMongo webhooks configured
- [ ] Section library uploaded
- [ ] SSL certificate active (HTTPS)
- [ ] Domain configured
- [ ] Error tracking set up (optional)
- [ ] Analytics configured (optional)

## Troubleshooting

### Git Clone Error: "Directory already contains files"
If you see this error when cloning in cPanel:
- **Solution 1**: Change the repository path to a new directory name
- **Solution 2**: Delete the existing directory via File Manager, then clone
- **Solution 3**: If the directory already has the repo, use "Pull" to update instead of cloning

### Deployment Error: "No .cpanel.yml file" or "The system cannot deploy"
**According to [official cPanel documentation](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/), deployment requires:**
1. A valid checked-in `.cpanel.yml` file in the repository root
2. **A clean working tree (no uncommitted changes)** - This is critical!

**Solutions:**
- **Ensure `.cpanel.yml` exists and is committed**: The file should be in the repository root (same level as `package.json`) and committed to Git
- **Clean working tree requirement**: cPanel **cannot deploy if the working tree contains uncommitted changes**. To fix this:
  - If you have SSH access, run:
    ```bash
    cd /home/azwywnto/repositories/shopify-section-generator-live
    git status
    git reset --hard HEAD  # This discards any uncommitted changes
    ```
  - Or commit any uncommitted changes:
    ```bash
    git add .
    git commit -m "Clean working tree"
    ```
- **Verify YAML syntax**: Check that the file uses proper YAML syntax (indentation matters, use spaces not tabs)
- **Check npm path**: If npm path is incorrect, update to your cPanel's npm path (check with `which npm` via SSH)

### "Deploy HEAD Commit" Button Not Working
If the deploy button is disabled or doesn't work:
1. **Click "Update from Remote" first** - This pulls the latest `.cpanel.yml` from GitHub
2. **Check deployment logs** - In cPanel, look for deployment logs at `$HOME/.cpanel/logs/` or check the "Last Deployment Information" section
3. **Verify .cpanel.yml syntax** - Ensure YAML indentation is correct (use spaces, not tabs)
4. **Check npm availability** - If you have SSH access, verify npm is available: `which npm` or `npm --version`
5. **Verify repository path** - Ensure the repository path in `.cpanel.yml` matches your actual repository path in cPanel
6. **Check for uncommitted changes** - cPanel requires no uncommitted changes. Run `git status` via SSH in the repository directory
7. **Try manual deployment** - If automatic deployment fails, you can manually build and copy files via SSH or File Manager

### "Deploy HEAD Commit" Process Takes Too Long
If the deployment process is very slow (taking 5+ minutes), here are common causes and solutions:

**Common Causes:**
1. **npm install running every time** - Installing all dependencies on each deployment is slow
2. **Large number of dependencies** - This project has many packages (Next.js, React, Radix UI, etc.)
3. **Slow npm registry** - Network latency to npm registry
4. **Limited server resources** - Shared hosting may have CPU/memory limits
5. **Next.js build process** - Building Next.js apps can be resource-intensive

**Solutions:**

1. **Optimized .cpanel.yml (Already Applied)**
   - The `.cpanel.yml` file now checks if `node_modules` exists and is up-to-date before running `npm install`
   - Only installs dependencies when `package.json` or `package-lock.json` changes
   - Uses `npm ci` for faster, more reliable installs

2. **Check Deployment Logs**
   - In cPanel, check the "Last Deployment Information" section
   - Look for which step is taking the longest (usually `npm install` or `npm run build`)
   - Check logs at `$HOME/.cpanel/logs/` via SSH

3. **Pre-build Locally (Fastest Option)**
   - Build the project locally: `npm run build`
   - Commit the `/out` directory to Git (add to `.gitignore` exclusion if needed)
   - Modify `.cpanel.yml` to skip build and just copy files:
     ```yaml
     - /bin/rm -rf $DEPLOYPATH*
     - /bin/cp -R $REPOPATH/out/. $DEPLOYPATH
     ```
   - **Note**: This requires committing build artifacts, which increases repo size

4. **Use SSH for Manual Deployment**
   - If you have SSH access, you can manually build and deploy:
     ```bash
     cd $HOME/repositories/shopify-section-generator-live
     git pull origin main
     npm ci --prefer-offline --no-audit
     npm run build
     rm -rf $HOME/public_html/*
     cp -R out/. $HOME/public_html/
     ```
   - This gives you more control and visibility into the process

5. **Optimize Build Process**
   - Ensure `package-lock.json` is committed to Git (faster installs)
   - Consider using `.npmrc` to configure npm registry and cache settings
   - Check if Z.com allows npm cache configuration

6. **Contact Z.com Support**
   - Ask about server resource limits
   - Inquire about npm registry mirror options
   - Check if they offer faster deployment methods

**Expected Deployment Times:**
- First deployment: 5-10 minutes (full npm install + build)
- Subsequent deployments (no dependency changes): 2-5 minutes (just build)
- With optimized `.cpanel.yml`: 1-3 minutes (skips install if unchanged)

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

