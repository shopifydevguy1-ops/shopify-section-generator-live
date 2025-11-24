# Quick Z.com Deployment Guide

## Quick Start Checklist

### 1. Verify Requirements
- [ ] Z.com hosting plan supports Node.js (18+)
- [ ] SSH or FTP/SFTP access available
- [ ] PostgreSQL database (external or on server)

### 2. Prepare Locally
```bash
cd standalone-app
npm install
npm run build
```

### 3. Upload to Z.com
**Option A: Via Git (SSH)**
```bash
ssh your-username@your-z.com-server
git clone https://github.com/shopifydevguy1-ops/shopify-section-generator.git
cd shopify-section-generator/standalone-app
```

**Option B: Via FTP/SFTP**
- Upload entire `standalone-app` folder to your web root

### 4. Install & Configure on Server
```bash
npm install --production
nano .env  # Add your environment variables
```

### 5. Start with PM2
```bash
npm install -g pm2
pm2 start npm --name "vibecoder-app" -- start
pm2 save
pm2 startup
```

### 6. Set Up Reverse Proxy
Configure Nginx or Apache to proxy requests to `http://localhost:3000`

### 7. Set Up Database
```bash
npm run db:push
npm run db:seed
```

### 8. SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## Environment Variables (.env file)

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-key-here
NODE_ENV=production
PORT=3000
```

## Useful Commands

**Check app status:**
```bash
pm2 status
pm2 logs vibecoder-app
```

**Restart app:**
```bash
pm2 restart vibecoder-app
```

**Stop app:**
```bash
pm2 stop vibecoder-app
```

**View logs:**
```bash
pm2 logs vibecoder-app --lines 100
```

## Common Issues

**Port 3000 not accessible:**
- Check Z.com firewall settings
- Verify reverse proxy configuration
- Test: `curl http://localhost:3000`

**Database connection fails:**
- Verify database allows connections from Z.com server IP
- Check `DATABASE_URL` format
- Test: `psql $DATABASE_URL`

**App crashes:**
- Check PM2 logs: `pm2 logs vibecoder-app`
- Verify Node.js version: `node -v`
- Check memory usage: `pm2 monit`

## Need Help?

See full instructions in [DEPLOYMENT.md](./DEPLOYMENT.md) under "Option 5: Z.com Hosting"

