# Deployment Guide

This Next.js application **cannot be deployed to GitHub Pages** because it requires:
- Node.js server (for API routes)
- Database connection (PostgreSQL)
- Server-side rendering
- Environment variables

GitHub Pages only serves static HTML files, which won't work for this full-stack application.

## Recommended Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is made by the creators of Next.js and provides the best experience.

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository: `shopifydevguy1-ops/shopify-section-generator`
   - Vercel will auto-detect Next.js
   - Add environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `OPENAI_API_KEY` (optional)
   - Click "Deploy"

3. **Or deploy via CLI:**
   ```bash
   cd standalone-app
   vercel
   ```
   Follow the prompts and add environment variables when asked.

**Your app will be live at:** `https://your-app-name.vercel.app`

### Option 2: Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/login with GitHub**
3. **Click "Add new site" → "Import an existing project"**
4. **Select your GitHub repository**
5. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Install Netlify Next.js plugin (auto-detected)
6. **Add environment variables** in Site settings → Environment variables
7. **Deploy!**

**Your app will be live at:** `https://your-app-name.netlify.app`

### Option 3: Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/login with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the connection string
6. **Add environment variables:**
   - `DATABASE_URL` (from the database you just created)
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (optional)
7. **Railway will auto-deploy!**

**Your app will be live at:** `https://your-app-name.up.railway.app`

### Option 4: Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/login with GitHub**
3. **Click "New" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure:**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment: `Node`
6. **Add PostgreSQL database:**
   - Click "New" → "PostgreSQL"
   - Copy the connection string
7. **Add environment variables**
8. **Deploy!**

### Option 5: Z.com Hosting

Z.com hosting supports Node.js applications. Follow these steps:

#### Prerequisites
1. **Verify Node.js Support:**
   - Ensure your Z.com hosting plan includes Node.js support
   - Check Node.js version (needs 18+)
   - If not available, upgrade your plan or contact support

2. **Access Methods:**
   - SSH access (recommended)
   - FTP/SFTP for file uploads
   - Control panel access

#### Deployment Steps

1. **Build Your Application Locally:**
   ```bash
   cd standalone-app
   npm install
   npm run build
   ```

2. **Upload Files to Z.com:**
   - **Via FTP/SFTP:**
     - Connect using FileZilla or similar
     - Upload entire `standalone-app` folder to your web root
     - Or upload to a subdirectory like `/app` or `/nextjs`
   
   - **Via SSH (if available):**
     ```bash
     # Clone your repository
     git clone https://github.com/shopifydevguy1-ops/shopify-section-generator.git
     cd shopify-section-generator/standalone-app
     ```

3. **Install Dependencies on Server:**
   ```bash
   npm install --production
   ```

4. **Set Up Environment Variables:**
   Create a `.env` file in your application root:
   ```bash
   nano .env
   ```
   Add your variables:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secret-key-here
   OPENAI_API_KEY=sk-your-key-here
   NODE_ENV=production
   PORT=3000
   ```

5. **Install PM2 (Process Manager):**
   ```bash
   npm install -g pm2
   ```

6. **Start Your Application with PM2:**
   ```bash
   pm2 start npm --name "vibecoder-app" -- start
   pm2 save
   pm2 startup
   ```
   This keeps your app running in the background and auto-restarts on server reboot.

7. **Set Up Reverse Proxy (Nginx/Apache):**
   
   **If using Nginx**, create/edit `/etc/nginx/sites-available/your-domain`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   **If using Apache**, edit your virtual host:
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       
       ProxyPreserveHost On
       ProxyPass / http://localhost:3000/
       ProxyPassReverse / http://localhost:3000/
   </VirtualHost>
   ```

8. **Set Up SSL Certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   # Or for Apache:
   sudo certbot --apache -d your-domain.com
   ```

9. **Set Up Database:**
   - Use external PostgreSQL (Supabase, Neon, etc.)
   - Or install PostgreSQL on Z.com server if available
   - Run migrations:
     ```bash
     npm run db:push
     npm run db:seed
     ```

10. **Monitor Your Application:**
    ```bash
    pm2 logs vibecoder-app
    pm2 status
    pm2 monit
    ```

#### Z.com Specific Notes

- **Port Configuration:** Check with Z.com support about which ports are available
- **Node.js Version:** Verify the Node.js version matches your requirements
- **File Permissions:** Ensure proper permissions for your app directory
- **Firewall:** May need to open port 3000 or configure through control panel
- **Resource Limits:** Monitor CPU and memory usage through Z.com control panel

#### Troubleshooting for Z.com

**App not starting:**
- Check PM2 logs: `pm2 logs vibecoder-app`
- Verify Node.js version: `node -v`
- Check if port 3000 is available: `netstat -tulpn | grep 3000`

**Database connection issues:**
- Verify database is accessible from Z.com server IP
- Check firewall rules allow PostgreSQL connections
- Test connection: `psql $DATABASE_URL`

**Reverse proxy not working:**
- Check Nginx/Apache error logs
- Verify proxy_pass URL is correct
- Test: `curl http://localhost:3000`

**PM2 not persisting:**
- Run `pm2 startup` again
- Check systemd service: `systemctl status pm2-root`

## Environment Variables Required

Make sure to add these in your hosting platform:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-key-here  # Optional - app works without it
NODE_ENV=production
```

## Database Setup

You'll need a PostgreSQL database. Options:

1. **Supabase** (Free tier available): [supabase.com](https://supabase.com)
2. **Neon** (Free tier): [neon.tech](https://neon.tech)
3. **Railway** (Includes database)
4. **Render** (Includes database)
5. **AWS RDS** (For production)

After creating the database:
1. Copy the connection string
2. Add it as `DATABASE_URL` in your hosting platform
3. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Post-Deployment Steps

1. **Set up the database:**
   - Connect to your database
   - Run: `npm run db:push`
   - Run: `npm run db:seed`

2. **Create an admin user:**
   - Register a user through the app
   - Update the database to set role to 'admin':
     ```sql
     UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
     ```

3. **Test the deployment:**
   - Visit your live URL
   - Try registering a new user
   - Test section generation

## Custom Domain

Most platforms allow custom domains:

- **Vercel**: Settings → Domains → Add domain
- **Netlify**: Domain settings → Add custom domain
- **Railway**: Settings → Domains

Update your `CNAME` file if using GitHub Pages domain setup (though you'll need a different hosting solution).

## Troubleshooting

**Build fails:**
- Check Node.js version (needs 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from hosting platform
- Ensure database allows connections from hosting IP

**Environment variables not working:**
- Make sure variables are set in hosting platform (not just `.env` file)
- Restart deployment after adding variables
- Check variable names match exactly (case-sensitive)

## Why Not GitHub Pages?

GitHub Pages:
- ✅ Free
- ✅ Easy setup
- ❌ Only serves static files
- ❌ No Node.js runtime
- ❌ No API routes
- ❌ No database connections
- ❌ No environment variables

This app needs a **full-stack hosting platform** that supports Node.js, not static file hosting.

