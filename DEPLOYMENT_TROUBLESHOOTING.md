# Deployment Troubleshooting Guide

## Issue: Cannot Deploy HEAD Commit

### Step 1: Fix Application Root
Set the Application root to:
```
apps/shopifysectiongen/standalone-app
```

This is the relative path from your home directory (`/home/azwywnto/`).

### Step 2: Check Build Configuration

Your hosting service needs these settings:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command (if required):**
- For static export: Leave empty or use `npm start`
- For Node.js hosting: `npm start`

**Node Version:**
- Use Node.js 18 or higher (20.19.4 is recommended)

### Step 3: API Routes Problem

⚠️ **Important:** Your app uses API routes (`/api/templates`, `/api/generate`, `/api/checkout`, etc.), but with `output: 'export'` in `next.config.js`, these won't work in static hosting.

**Solutions:**

#### Option A: Deploy API Routes Separately (Recommended)

1. **Deploy API to Vercel/Railway:**
   - Create a separate deployment for API routes
   - Use a service like Vercel (free) or Railway
   - Deploy only the `/app/api` directory

2. **Update API URLs:**
   - Change all `/api/` calls to your API server URL
   - Example: `https://your-api.vercel.app/api/templates`

#### Option B: Use Node.js Hosting

If your hosting service supports Node.js:

1. **Remove static export:**
   ```js
   // next.config.js
   const nextConfig = {
     // Remove: output: 'export',
     images: {
       unoptimized: true,
     },
     trailingSlash: true,
   }
   ```

2. **Update build command:**
   ```bash
   npm install && npm run build
   ```

3. **Update start command:**
   ```bash
   npm start
   ```

#### Option C: Convert to Client-Side Only

Modify the app to work without API routes (more complex, requires refactoring).

### Step 4: Environment Variables

Make sure these are set in your hosting dashboard:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PAYMONGO_PRO_AMOUNT=2000
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 5: Check Logs

After setting the application root, try deploying again and check:
- Build logs for errors
- Deployment logs
- Application logs after deployment

### Common Errors and Solutions

**Error: "Directory '.' not in user home"**
- ✅ Solution: Set Application root to `apps/shopifysectiongen/standalone-app`

**Error: "Build failed"**
- Check Node.js version (needs 18+)
- Verify `package.json` has all dependencies
- Check build logs for specific errors

**Error: "API routes not found"**
- This is expected with static export
- Use Option A or B above

**Error: "Module not found"**
- Run `npm install` locally first
- Check all dependencies are in `package.json`

### Quick Fix Checklist

- [ ] Application root set to `apps/shopifysectiongen/standalone-app`
- [ ] Build command configured: `npm install && npm run build`
- [ ] Node.js version set to 18+ (20.19.4 recommended)
- [ ] Environment variables configured
- [ ] API routes deployment strategy decided (Option A or B)
- [ ] Try deploying again

### Need Help?

1. Check your hosting service's documentation for:
   - Node.js deployment
   - Build configuration
   - Static file hosting

2. For API routes, consider:
   - Vercel (free tier available)
   - Railway (easy deployment)
   - Your own VPS/server

3. Check deployment logs for specific error messages

