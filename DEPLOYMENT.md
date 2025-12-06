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
PRO_PLAN_USD_AMOUNT=20
EXPERT_PLAN_USD_AMOUNT=125
DEFAULT_USD_TO_PHP_RATE=56.0

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

## Alternative: Deploy to GitHub Pages with Custom Domain

GitHub Pages is a free static site hosting service that can host your Next.js static export. It supports custom domains and is perfect if you want a simple, free hosting solution.

### Important Limitations

⚠️ **GitHub Pages only hosts static sites**, which means:
- ✅ Your static Next.js app will work perfectly
- ❌ API routes (`/api/*`) will NOT work on GitHub Pages
- ✅ You can use serverless functions (Vercel, Netlify) for API routes
- ✅ Custom domains are fully supported

### Prerequisites

- GitHub account
- Repository on GitHub
- Custom domain (optional, but you mentioned wanting one)
- PayMongo account configured
- Clerk account configured
- PostgreSQL database (Supabase recommended)

### Step 1: Prepare Your Code for Static Export

Your app is already configured with `output: 'export'` in `next.config.js`, which is perfect for GitHub Pages.

1. **Verify your build works**
   ```bash
   npm run build
   ```
   This creates a static export in the `/out` directory.

2. **Test locally**
   ```bash
   npx serve out
   ```
   Visit `http://localhost:3000` to verify everything works.

### Step 2: Set Up GitHub Actions for Automatic Deployment

GitHub Actions will automatically build and deploy your site on every push.

1. **Create GitHub Actions workflow**
   - Create directory: `.github/workflows/`
   - Create file: `.github/workflows/deploy.yml`

2. **Add the workflow file** (create this file):
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches:
         - main
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
           env:
             # Add any build-time environment variables here
             NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
             NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
         
         - name: Setup Pages
           uses: actions/configure-pages@v4
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './out'

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

3. **Commit and push**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push origin main
   ```

### Step 3: Enable GitHub Pages

1. **Go to your repository on GitHub**
   - Click "Settings" tab
   - Scroll to "Pages" in the left sidebar

2. **Configure Pages**
   - **Source**: Select "GitHub Actions" (not "Deploy from a branch")
   - This will use the workflow we just created

3. **Save settings**
   - Your site will be available at: `https://yourusername.github.io/repository-name`
   - Or if your repo is named `yourusername.github.io`, it will be: `https://yourusername.github.io`

### Step 4: Set Up Custom Domain

1. **Add custom domain in GitHub**
   - Go to repository → Settings → Pages
   - Under "Custom domain", enter your domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
   - Click "Save"
   - GitHub will create a CNAME file automatically

2. **Configure DNS records**
   
   **For apex domain (yourdomain.com):**
   - Add A records pointing to GitHub Pages IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Or use ALIAS/ANAME record if your DNS provider supports it
   
   **For subdomain (www.yourdomain.com):**
   - Add CNAME record:
     ```
     www.yourdomain.com → yourusername.github.io
     ```
   
   **For both apex and www:**
   - Set up both A records (for apex) and CNAME (for www)
   - Or use www as CNAME and apex as A records

3. **Wait for DNS propagation**
   - DNS changes can take 24-48 hours, but usually work within minutes
   - Check propagation: `dig yourdomain.com` or use online tools

4. **Enable HTTPS (Automatic)**
   - GitHub automatically provisions SSL certificates for custom domains
   - Wait a few minutes after DNS is configured
   - Check "Enforce HTTPS" checkbox in Pages settings once SSL is active

### Step 5: Handle API Routes (Required)

Since GitHub Pages is static, your API routes won't work. You have two options:

#### Option A: Deploy API Routes to Vercel (Recommended)

1. **Create a separate Vercel project for API routes**
   - Go to [vercel.com](https://vercel.com)
   - Create new project
   - Import your repository
   - Set root directory to `/app/api` (or create a separate API-only project)

2. **Update API calls in your frontend**
   - Change API URLs from `/api/...` to `https://your-api.vercel.app/api/...`
   - Or use environment variable: `NEXT_PUBLIC_API_URL`

3. **Example update in your code:**
   ```typescript
   // Instead of: fetch('/api/templates')
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.vercel.app'
   fetch(`${API_URL}/api/templates`)
   ```

#### Option B: Use Serverless Functions on Netlify

Similar to Vercel, deploy API routes separately and point frontend to them.

### Step 6: Configure Environment Variables

Since GitHub Pages is static, you can't use server-side environment variables. Use client-side variables:

1. **Add to GitHub Secrets** (for build time)
   - Go to repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `NEXT_PUBLIC_APP_URL` (your custom domain)
     - `NEXT_PUBLIC_API_URL` (if using separate API)

2. **Update your workflow** (already done in Step 2)
   - The workflow uses these secrets during build

3. **Client-side variables**
   - All `NEXT_PUBLIC_*` variables are embedded in the build
   - Never put secrets in `NEXT_PUBLIC_*` variables (they're visible in browser)

### Step 7: Update PayMongo Webhooks

Since API routes are on a separate service:

1. **Update webhook URL**
   - Point to your API service: `https://your-api.vercel.app/api/webhooks/stripe`
   - Not your GitHub Pages domain

2. **Configure in PayMongo**
   - Go to PayMongo Dashboard → Developers → Webhooks
   - Update endpoint URL
   - Copy webhook secret to your API service environment variables

### Step 8: Test Your Deployment

1. **Check GitHub Actions**
   - Go to repository → "Actions" tab
   - Verify workflow runs successfully
   - Check deployment logs if there are errors

2. **Visit your site**
   - GitHub Pages URL: `https://yourusername.github.io/repository-name`
   - Custom domain: `https://yourdomain.com` (after DNS propagates)

3. **Test functionality**
   - Verify pages load
   - Test authentication (Clerk)
   - Test API calls (should point to your separate API service)

### Step 9: Automatic Deployments

Every time you push to the `main` branch:
- GitHub Actions automatically builds your site
- Deploys to GitHub Pages
- Updates your custom domain (if configured)

### Troubleshooting GitHub Pages

#### Build Fails in GitHub Actions

1. **Check workflow logs**
   - Go to repository → Actions tab
   - Click on failed workflow
   - Review error messages

2. **Common issues**
   - Missing environment variables (add to Secrets)
   - Build errors (test locally first with `npm run build`)
   - Node version mismatch

#### Custom Domain Not Working

1. **Check DNS records**
   ```bash
   dig yourdomain.com
   nslookup yourdomain.com
   ```
   Verify records point to GitHub Pages IPs

2. **Wait for propagation**
   - DNS changes can take up to 48 hours
   - Usually works within minutes to hours

3. **Check GitHub Pages settings**
   - Verify domain is entered correctly
   - Check for DNS verification errors
   - Ensure "Enforce HTTPS" is enabled (after SSL is active)

#### SSL Certificate Not Issuing

1. **Wait longer**
   - SSL certificates can take 24 hours to provision
   - Usually active within minutes to hours

2. **Check DNS**
   - Ensure DNS is correctly configured
   - GitHub can't issue SSL if DNS doesn't point to GitHub

3. **Remove and re-add domain**
   - Sometimes removing and re-adding the domain helps

#### API Routes Returning 404

- **Expected behavior** - API routes don't work on GitHub Pages
- **Solution** - Deploy API routes to a separate service (Vercel, Netlify)
- **Update frontend** - Point API calls to your separate API service

### GitHub Pages vs Other Options

| Feature | GitHub Pages | Vercel | Z.com |
|---------|--------------|--------|-------|
| Cost | ✅ Free | ✅ Free tier | ⚠️ Paid |
| Custom Domain | ✅ Yes | ✅ Yes | ✅ Yes |
| SSL Certificate | ✅ Automatic | ✅ Automatic | ⚠️ Manual |
| API Routes | ❌ No (static only) | ✅ Yes | ❌ No (static only) |
| Auto Deploy | ✅ Yes (via Actions) | ✅ Yes | ⚠️ Manual/Config |
| Build Time | ⚡ 2-5 minutes | ⚡ 1-3 minutes | 🐌 5-10 minutes |
| CDN | ✅ Included | ✅ Included | ⚠️ May need separate |

### Advantages of GitHub Pages

- ✅ **Completely free** - No cost for hosting
- ✅ **Custom domain support** - Full DNS control
- ✅ **Automatic SSL** - HTTPS by default
- ✅ **Git integration** - Deploy on every push
- ✅ **Global CDN** - Fast worldwide
- ✅ **Unlimited bandwidth** - No traffic limits

### Disadvantages

- ❌ **Static only** - No server-side code
- ❌ **No API routes** - Need separate backend
- ❌ **Build time** - Can be slower than Vercel
- ❌ **Limited build resources** - May timeout on large builds

### Next Steps

1. Set up your API routes on Vercel or Netlify
2. Update frontend API calls to point to your API service
3. Configure environment variables
4. Test everything thoroughly
5. Enjoy your free hosting with custom domain!

## Alternative: Deploy to Vercel (Recommended for Next.js)

Vercel is the platform created by the makers of Next.js and offers the best experience for deploying Next.js applications. Unlike static hosting, Vercel supports API routes, serverless functions, and automatic optimizations.

### Why Choose Vercel?

- ✅ **Native Next.js support** - Built by the Next.js team
- ✅ **API routes work out of the box** - No need for separate backend
- ✅ **Automatic deployments** - Deploy on every Git push
- ✅ **Free tier available** - Generous free tier for personal projects
- ✅ **Built-in SSL** - HTTPS by default
- ✅ **Global CDN** - Fast performance worldwide
- ✅ **Environment variables** - Easy configuration via dashboard
- ✅ **Preview deployments** - Test changes before production

### Prerequisites

- Vercel account (free tier available)
- GitHub repository (or GitLab/Bitbucket)
- PayMongo account configured
- Clerk account configured
- PostgreSQL database (Supabase recommended)

### Step 1: Prepare Your Code

1. **Ensure your Next.js app is ready**
   ```bash
   npm run build
   ```
   Verify the build completes without errors.

2. **Remove static export (if present)**
   - If you have `output: 'export'` in `next.config.js`, remove it
   - Vercel supports full Next.js features including API routes

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Method 1: Via Vercel Dashboard (Recommended)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended) or email

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository: `shopify-section-generator-live`

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Set Environment Variables**
   - Click "Environment Variables" before deploying
   - Add all required variables (see Step 3 below)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 1-3 minutes)
   - Your app will be live at `your-project.vercel.app`

#### Method 2: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - For production: `vercel --prod`

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

**Clerk Configuration:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**PayMongo Configuration:**
```
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PRO_PLAN_USD_AMOUNT=20
EXPERT_PLAN_USD_AMOUNT=125
DEFAULT_USD_TO_PHP_RATE=56.0
```

**Database:**
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

**App URL:**
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```
Or your custom domain if configured.

**Important:**
- Set variables for **Production**, **Preview**, and **Development** environments
- Use production keys (`sk_live_`) for production environment
- After adding variables, redeploy for changes to take effect

### Step 4: Set Up Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your custom domain (e.g., `yourdomain.com`)

2. **Configure DNS**
   - Add the DNS records Vercel provides
   - Usually a CNAME record pointing to `cname.vercel-dns.com`
   - Or A records for apex domain

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Wait a few minutes for DNS propagation and SSL activation

4. **Update Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain
   - Redeploy the application

### Step 5: Set Up PayMongo Webhooks

1. **Get Your Webhook URL**
   - Production: `https://your-project.vercel.app/api/webhooks/stripe`
   - Or with custom domain: `https://yourdomain.com/api/webhooks/stripe`

2. **Configure in PayMongo**
   - Go to PayMongo Dashboard → Developers → Webhooks
   - Click "Add Endpoint"
   - Enter your webhook URL
   - Select events:
     - `payment.paid`
     - `payment.failed`
     - `payment.refunded`
   - Copy the webhook signing secret

3. **Update Environment Variable**
   - Add `PAYMONGO_WEBHOOK_SECRET` in Vercel dashboard
   - Redeploy if needed

### Step 6: Database Setup

1. **Create Supabase Project** (Recommended)
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database to be ready

2. **Run Database Schema**
   - Go to Supabase SQL Editor
   - Run the SQL schema from `lib/db.ts`
   - Or create tables manually based on your schema

3. **Get Connection String**
   - Go to Supabase → Settings → Database
   - Copy the connection string
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

4. **Add to Vercel**
   - Add `DATABASE_URL` environment variable in Vercel
   - Redeploy application

### Step 7: Test Deployment

1. **Visit Your App**
   - Go to `https://your-project.vercel.app`
   - Check landing page loads correctly

2. **Test Authentication**
   - Try signing up
   - Verify Clerk redirects work
   - Check user is created in database

3. **Test API Routes**
   - Try generating a section
   - Verify API endpoints respond correctly
   - Check serverless function logs in Vercel dashboard

4. **Test Payments**
   - Try upgrading to Pro (use test mode first)
   - Verify webhook receives events
   - Check PayMongo dashboard for events
   - Verify subscription status updates in database

### Step 8: Enable Automatic Deployments

Vercel automatically deploys on every push to your main branch:

1. **Production Deployments**
   - Every push to `main` branch → Production deployment
   - Automatic and instant

2. **Preview Deployments**
   - Every push to other branches → Preview deployment
   - Get a unique URL for each branch/PR
   - Perfect for testing before merging

3. **Configure in Vercel**
   - Settings → Git → Production Branch: `main`
   - Preview deployments are enabled by default

### Vercel-Specific Advantages

1. **API Routes Work Automatically**
   - No need for static export
   - All API routes in `/app/api` work as serverless functions
   - No separate backend needed

2. **Automatic Optimizations**
   - Image optimization
   - Code splitting
   - Edge caching
   - Automatic HTTPS

3. **Analytics & Monitoring**
   - Built-in analytics (on paid plans)
   - Function logs in dashboard
   - Real-time error tracking

4. **Easy Rollbacks**
   - One-click rollback to previous deployments
   - View deployment history

### Troubleshooting Vercel Deployment

#### Build Fails

1. **Check Build Logs**
   - Go to Deployment → View Function Logs
   - Look for error messages

2. **Common Issues**
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies in `package.json`

3. **Fix and Redeploy**
   - Fix issues locally first
   - Push to GitHub
   - Vercel will automatically redeploy

#### API Routes Not Working

1. **Verify Route Structure**
   - Ensure routes are in `/app/api` directory
   - Check file exports `GET`, `POST`, etc.

2. **Check Function Logs**
   - Vercel Dashboard → Functions tab
   - View real-time logs

3. **Test Locally First**
   ```bash
   npm run dev
   ```
   Test API routes at `http://localhost:3000/api/...`

#### Environment Variables Not Working

1. **Verify Variable Names**
   - Check for typos
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables

2. **Redeploy After Changes**
   - Environment variable changes require redeployment
   - Go to Deployments → Redeploy

3. **Check Environment Scope**
   - Ensure variables are set for correct environment (Production/Preview/Development)

#### Database Connection Issues

1. **Verify Connection String**
   - Check `DATABASE_URL` format
   - Ensure database allows connections from Vercel IPs

2. **Supabase Configuration**
   - Go to Supabase → Settings → Database
   - Check "Connection Pooling" settings
   - Use connection pooler URL if available

3. **Check Function Logs**
   - View logs for database connection errors
   - Verify SSL is enabled in connection string

#### Webhooks Not Receiving Events

1. **Verify Webhook URL**
   - Check URL is correct in PayMongo dashboard
   - Ensure it's the production URL, not preview

2. **Check Webhook Secret**
   - Verify `PAYMONGO_WEBHOOK_SECRET` matches PayMongo
   - Check function logs for signature validation errors

3. **Test Webhook**
   - Use PayMongo test mode
   - Send test events from PayMongo dashboard
   - Check Vercel function logs

### Vercel vs Z.com Comparison

| Feature | Vercel | Z.com (Static) |
|---------|--------|-----------------|
| API Routes | ✅ Native support | ❌ Requires separate backend |
| Deploy Speed | ⚡ 1-3 minutes | 🐌 5-10 minutes |
| Automatic Deploys | ✅ Yes | ⚠️ Manual/Config required |
| Preview Deployments | ✅ Yes | ❌ No |
| SSL Certificate | ✅ Automatic | ⚠️ Manual setup |
| Global CDN | ✅ Included | ⚠️ May require separate CDN |
| Free Tier | ✅ Generous | ⚠️ Limited |
| Next.js Optimization | ✅ Built-in | ❌ Manual configuration |

### Vercel Pricing

- **Hobby (Free)**: Perfect for personal projects
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless functions included
  
- **Pro ($20/month)**: For professional projects
  - Everything in Hobby
  - Team collaboration
  - Advanced analytics
  - More bandwidth

For most projects, the free tier is sufficient to start.

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

