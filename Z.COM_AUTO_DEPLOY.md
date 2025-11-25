# Z.com Auto-Deployment Setup Guide

This guide will help you set up automatic deployment from GitHub to Z.com.

## Quick Setup Steps

### 1. Connect GitHub Repository in Z.com Control Panel

1. **Log in to Z.com Control Panel**
   - Go to your Node.js application settings
   - Look for "Git Repository", "Source Code", or "Deployment" section

2. **Link Your GitHub Repository**
   - Click "Connect Repository" or "Link GitHub"
   - Authorize Z.com to access your GitHub account
   - Select repository: `shopifydevguy1-ops/shopify-section-generator`
   - Set branch: `main`
   - Set application root: `standalone-app`

### 2. Configure Build Settings

In your Z.com application settings, configure:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node.js Version:** `20.19.4` (or latest 20.x)
- **Application Root:** `standalone-app`

### 3. Set Environment Variables

Add these in Z.com control panel → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-key-here
NODE_ENV=production
PORT=3000
```

### 4. Enable Auto-Deploy

- Enable "Auto Deploy" or "Auto Pull" option
- This will automatically deploy when you push to GitHub

### 5. Trigger Initial Deployment

- Click "Deploy" or "Pull from Repository" button
- Wait for the deployment to complete

## How It Works

Once set up, every time you push to the `main` branch on GitHub:

1. ✅ Z.com automatically detects the push
2. ✅ Pulls the latest code from GitHub
3. ✅ Runs `npm install` to install dependencies
4. ✅ Runs `npm run build` to build the Next.js app
5. ✅ Runs `npm start` to start the server
6. ✅ Your app is live with the latest changes!

## Manual Deployment

If you need to manually trigger a deployment:

1. Go to Z.com control panel
2. Find your application
3. Click "Deploy" or "Pull from Repository"
4. Wait for deployment to complete

## Troubleshooting

**Deployment fails:**
- Check the build logs in Z.com control panel
- Verify all environment variables are set correctly
- Ensure Node.js version is 20.x

**App not updating:**
- Check if auto-deploy is enabled
- Verify you're pushing to the `main` branch
- Check deployment logs for errors

**Build errors:**
- Check Node.js version matches requirements
- Verify all dependencies are in `package.json`
- Check build logs for specific error messages

## Notes

- Make sure your GitHub repository is **public** or Z.com has access to it
- The first deployment may take 5-10 minutes
- Subsequent deployments are usually faster (2-5 minutes)
- Your app will be temporarily unavailable during deployment (usually 30-60 seconds)

