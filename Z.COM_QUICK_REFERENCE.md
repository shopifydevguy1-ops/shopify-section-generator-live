# Z.com Quick Reference Card

## 🎯 Immediate Next Steps

### 1. In Z.com Control Panel:
- [ ] Click **"Run NPM Install"** button
- [ ] Wait for installation to complete
- [ ] Change `NODE_ENV` from `development` to `production`
- [ ] (Optional) Add `OPENAI_API_KEY` environment variable
- [ ] Start/Restart your application

### 2. Build the App:
**Option A:** If z.com has build command field → Add: `npm run build`  
**Option B:** Via SSH → `cd apps/shopifysectiongen/standalone-app && npm run build`

### 3. Setup Database (via SSH):
```bash
cd apps/shopifysectiongen/standalone-app
npm run db:push
npm run db:seed
```

### 4. Test:
Visit `https://shopifysectiongen.com` and try to register/login

---

## 📋 Environment Variables Checklist

| Variable | Current Value | Action Needed |
|----------|---------------|---------------|
| `DATABASE_URL` | ✅ Set (Neon) | None |
| `JWT_SECRET` | ✅ Set | None |
| `NODE_ENV` | ⚠️ `development` | Change to `production` |
| `OPENAI_API_KEY` | ❌ Missing | Add if using AI features |

---

## 🔧 Common Commands (SSH)

```bash
# Navigate to app
cd apps/shopifysectiongen/standalone-app

# Build app
npm run build

# Setup database
npm run db:push
npm run db:seed

# Check logs (if using PM2)
pm2 logs vibecoder-app

# Restart app
pm2 restart vibecoder-app
```

---

## ✅ Success Checklist

- [ ] NPM install completed
- [ ] App built successfully
- [ ] Database schema created
- [ ] App starts without errors
- [ ] Can access `shopifysectiongen.com`
- [ ] Can register new account
- [ ] Can login successfully
- [ ] JWT authentication works

---

## 🆘 Quick Troubleshooting

**App won't start?**
→ Check z.com logs, verify `server.js` is startup file

**Database error?**
→ Verify `DATABASE_URL`, check Neon allows z.com IP

**Build failed?**
→ Check build logs, ensure all env vars set

**JWT not working?**
→ Verify `JWT_SECRET` is set, check browser cookies

---

📖 **Full Guide:** See `Z.COM_SETUP_STEPS.md` for detailed instructions

