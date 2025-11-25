# How to Upload Files to Z.com

## The Problem
z.com cannot find `package.json` because the files haven't been uploaded to the server yet.

**Your application root is set to:** `apps/shopifysectiongen/standalone-app`

**You need to upload all files** from your local `standalone-app` folder to that path on z.com.

---

## Upload Methods

### Method 1: Via FTP/SFTP (Recommended for beginners)

#### Step 1: Get FTP/SFTP Credentials
1. Log into your z.com control panel
2. Look for "FTP Accounts" or "File Manager" section
3. Note down:
   - **FTP Host** (usually `ftp.your-domain.com` or your server IP)
   - **FTP Username**
   - **FTP Password**
   - **Port** (usually 21 for FTP, 22 for SFTP)

#### Step 2: Connect Using FTP Client

**Option A: Using FileZilla (Free)**
1. Download FileZilla: https://filezilla-project.org/
2. Open FileZilla
3. Enter your FTP credentials:
   - **Host:** Your FTP host
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** 21 (or 22 for SFTP)
4. Click "Quickconnect"

**Option B: Using VS Code (If you have it)**
1. Install "SFTP" extension in VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "SFTP: Config"
4. Enter your server details

#### Step 3: Navigate to Upload Location
- On the **remote server** (right side), navigate to: `apps/shopifysectiongen/standalone-app`
- If the folders don't exist, create them:
  - `apps/`
  - `apps/shopifysectiongen/`
  - `apps/shopifysectiongen/standalone-app/`

#### Step 4: Upload Files
- On the **local side** (left side), navigate to your local `standalone-app` folder
- Select **ALL files and folders** in `standalone-app`
- Drag and drop them to the remote `standalone-app` folder
- Wait for upload to complete (this may take 5-10 minutes)

**Important Files to Upload:**
- ✅ `package.json` (REQUIRED)
- ✅ `package-lock.json`
- ✅ `server.js`
- ✅ `next.config.ts`
- ✅ `tsconfig.json`
- ✅ `app/` folder (entire folder)
- ✅ `components/` folder
- ✅ `lib/` folder
- ✅ `prisma/` folder
- ✅ `public/` folder
- ✅ `scripts/` folder
- ✅ `middleware.ts`
- ✅ All other files in `standalone-app`

**Files you can SKIP:**
- ❌ `node_modules/` (will be installed via npm)
- ❌ `.next/` (will be built)
- ❌ `.env` (use z.com environment variables instead)
- ❌ `*.md` files (documentation, optional)

---

### Method 2: Via Git (If you have SSH access)

#### Step 1: Connect via SSH
```bash
ssh your-username@your-z.com-server
```

#### Step 2: Navigate to Apps Directory
```bash
cd apps/shopifysectiongen
```

#### Step 3: Clone Your Repository
```bash
# If you have a Git repository
git clone https://github.com/your-username/your-repo.git standalone-app

# Or if you need to create the directory first
mkdir -p standalone-app
cd standalone-app
git init
git remote add origin https://github.com/your-username/your-repo.git
git pull origin main
```

---

### Method 3: Via z.com File Manager (If available)

1. Log into z.com control panel
2. Look for "File Manager" or "Files" section
3. Navigate to `apps/shopifysectiongen/`
4. Create `standalone-app` folder if it doesn't exist
5. Use the upload button to upload files
6. Upload `package.json` first, then other files

---

## Quick Upload Checklist

After uploading, verify these files exist on the server at `apps/shopifysectiongen/standalone-app/`:

- [ ] `package.json` ✅ **MOST IMPORTANT**
- [ ] `package-lock.json`
- [ ] `server.js`
- [ ] `next.config.ts`
- [ ] `tsconfig.json`
- [ ] `app/` folder (with all subfolders)
- [ ] `components/` folder
- [ ] `lib/` folder
- [ ] `prisma/` folder
- [ ] `public/` folder
- [ ] `scripts/` folder
- [ ] `middleware.ts`

---

## After Uploading Files

1. **Go back to z.com Node.js configuration page**
2. **Click "Run NPM Install"** - it should work now!
3. **Wait for installation to complete**
4. **Build the app** (see next steps in `Z.COM_SETUP_STEPS.md`)

---

## Troubleshooting

### "Still can't find package.json"
- Verify the file path: `apps/shopifysectiongen/standalone-app/package.json`
- Check file permissions (should be readable)
- Make sure you uploaded the actual `package.json` file, not a folder

### "Upload is very slow"
- This is normal for first upload
- Consider using SFTP instead of FTP (faster)
- Upload essential files first (`package.json`, `server.js`), then others

### "Don't have FTP access"
- Contact z.com support to enable FTP/SFTP
- Or ask them about alternative upload methods
- Check if they have a web-based file manager

### "Files uploaded but still not found"
- Double-check the application root path in z.com settings
- Make sure files are in the exact path: `apps/shopifysectiongen/standalone-app/`
- Try refreshing the z.com page or restarting the app

---

## Need Help?

If you're stuck:
1. Check z.com documentation for file upload instructions
2. Contact z.com support for FTP/SFTP credentials
3. Verify your application root path matches where you uploaded files

---

## Next Steps After Upload

Once files are uploaded and npm install works:
1. ✅ Run `npm run build` (via SSH or build command)
2. ✅ Change `NODE_ENV` to `production`
3. ✅ Initialize database: `npm run db:push`
4. ✅ Start your application
5. ✅ Test at `shopifysectiongen.com`

Good luck! 🚀

