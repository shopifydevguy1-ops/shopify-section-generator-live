# Z.com Deployment - Step-by-Step Guide

## Current Status ✅
- [x] Node.js application created
- [x] Environment variables configured (DATABASE_URL, JWT_SECRET, NODE_ENV)
- [x] Application root set: `apps/shopifysectiongen/standalone-app`
- [x] Startup file set: `server.js`
- [x] Node.js version: 20.19.4

## Next Steps

### Step 1: Run NPM Install

In your z.com control panel:
1. Find the **"Detected configuration files"** section
2. Click the **"Run NPM Install"** button
3. Wait for the installation to complete (this may take 2-5 minutes)

**What this does:** Installs all dependencies from `package.json`

---

### Step 2: Build the Application

After npm install completes, you need to build the Next.js app. You have two options:

#### Option A: Via z.com Control Panel (if available)
- Look for a "Build Command" or "Pre-start Command" field
- Add: `npm run build`
- Save and restart the application

#### Option B: Via SSH (if you have SSH access)
```bash
# Connect via SSH
ssh your-username@your-z.com-server

# Navigate to your app directory
cd apps/shopifysectiongen/standalone-app

# Build the application
npm run build
```

**What this does:** Compiles your Next.js app for production

---

### Step 3: Update Environment Variables (Recommended)

In your z.com environment variables section, update:

1. **Change NODE_ENV to production:**
   - Find `NODE_ENV`
   - Change value from `development` to `production`
   - Click Save

2. **Add OPENAI_API_KEY (Optional but recommended):**
   - Click **"+ ADD VARIABLE"**
   - Name: `OPENAI_API_KEY`
   - Value: `sk-your-openai-api-key-here`
   - Click Save

---

### Step 4: Initialize Database

Once your app is running, you need to set up the database schema. You can do this via SSH:

```bash
# Connect via SSH
ssh your-username@your-z.com-server

# Navigate to your app directory
cd apps/shopifysectiongen/standalone-app

# Push database schema
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

**What this does:**
- `db:push` - Creates all database tables
- `db:seed` - Adds initial section templates (optional)

---

### Step 5: Start/Restart Your Application

In z.com control panel:
1. Look for **"Start Application"** or **"Restart"** button
2. Click it to start your app
3. The app should now be running on `shopifysectiongen.com`

---

### Step 6: Test Your Application

Visit your domain: `https://shopifysectiongen.com`

**Test Checklist:**
- [ ] Homepage loads
- [ ] Can navigate to `/register`
- [ ] Can create a new account
- [ ] Can login with your account
- [ ] Dashboard loads after login
- [ ] JWT authentication works (you stay logged in)

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
- Make sure you clicked "Run NPM Install" in z.com
- Check that all dependencies are installed
- Try running `npm install` again via SSH

### Issue: "Cannot connect to database"

**Solution:**
- Verify your `DATABASE_URL` is correct in environment variables
- Check that your Neon database allows connections from z.com server IP
- Test connection: `psql $DATABASE_URL` (via SSH)

### Issue: "Application not starting"

**Solution:**
- Check application logs in z.com control panel
- Verify `server.js` is set as startup file
- Check that port 3000 is available (z.com should handle this)
- Verify Node.js version is 20.19.4

### Issue: "Build failed"

**Solution:**
- Check build logs in z.com
- Ensure all environment variables are set
- Try building locally first: `npm run build`
- Check for TypeScript errors

### Issue: "JWT authentication not working"

**Solution:**
- Verify `JWT_SECRET` is set in environment variables
- Check that cookies are being set (use browser DevTools)
- Ensure `NODE_ENV` is set correctly
- Check server logs for JWT errors

---

## Quick Command Reference

If you have SSH access, here are useful commands:

```bash
# Navigate to app directory
cd apps/shopifysectiongen/standalone-app

# Check Node.js version
node -v

# Check npm version
npm -v

# View application logs (if using PM2)
pm2 logs vibecoder-app

# Check if app is running
pm2 status

# Restart application
pm2 restart vibecoder-app

# Check database connection
npm run db:push

# View Prisma Studio (database GUI)
npm run db:studio
```

---

## Environment Variables Summary

Make sure these are set in z.com:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | Your Neon PostgreSQL URL | ✅ Set |
| `JWT_SECRET` | `MVUdKZBp/8+9UJ1AwixN0z2ZW2fUaxSYpJrbid91Kcc=` | ✅ Set |
| `NODE_ENV` | `production` (change from development) | ⚠️ Update |
| `OPENAI_API_KEY` | Your OpenAI key (optional) | ⚠️ Add if needed |

---

## What Happens Next?

After completing these steps:

1. ✅ Your app will be live at `shopifysectiongen.com`
2. ✅ Users can register and login
3. ✅ JWT authentication will work
4. ✅ Database will be connected
5. ✅ AI section generation will work (if OPENAI_API_KEY is set)

---

## Need Help?

If you encounter issues:
1. Check z.com application logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test database connection separately
5. Check that npm install completed successfully

---

## Success Indicators

You'll know everything is working when:
- ✅ App loads without errors
- ✅ You can register a new account
- ✅ You can login successfully
- ✅ Dashboard shows your user info
- ✅ No console errors in browser
- ✅ No errors in z.com logs

Good luck! 🚀

