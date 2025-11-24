# Deploy to GitHub Repository

This guide will help you push your Section Generator app to your GitHub repository: [shopifydevguy1-ops/shopify-section-generator](https://github.com/shopifydevguy1-ops/shopify-section-generator)

## 🚀 Quick Setup

### Step 1: Initialize Git Repository

Open terminal in the `standalone-app` folder and run:

```bash
cd standalone-app
git init
git add .
git commit -m "Initial commit: Shopify Section Generator standalone app"
```

### Step 2: Connect to Your GitHub Repository

```bash
git remote add origin https://github.com/shopifydevguy1-ops/shopify-section-generator.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will automatically deploy when you push to the `main` branch

Your app will be live at:
`https://shopifydevguy1-ops.github.io/shopify-section-generator/`

#### 🌐 Setting Up a Custom Domain

If you want to use a custom domain (e.g., `u-dong.com`):

1. **Add the CNAME file** (already included in this repo):
   - The `CNAME` file contains your custom domain
   - Make sure it's in the root of your repository

2. **Configure DNS** (at your domain registrar):
   - Add a CNAME record pointing to: `shopifydevguy1-ops.github.io`
   - Or add A records pointing to GitHub's IP addresses:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

3. **Add custom domain in GitHub**:
   - Go to **Settings** → **Pages**
   - Under **Custom domain**, enter your domain (e.g., `u-dong.com`)
   - Click **Save**
   - Wait for DNS verification (may take a few minutes)

4. **Enable HTTPS** (recommended):
   - Check the **Enforce HTTPS** checkbox
   - GitHub will automatically provision an SSL certificate

**Important:** The `CNAME` file must be in the repository root and will be automatically included in deployments.

## 📝 Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
cd standalone-app
gh repo create shopifydevguy1-ops/shopify-section-generator --public --source=. --remote=origin
git push -u origin main
```

## 🔄 Updating Your Repository

When you make changes:

```bash
git add .
git commit -m "Your commit message"
git push
```

## 🌐 GitHub Pages Configuration

If deploying to GitHub Pages, you may need to update the base path in your HTML. Add this to `index.html` if needed:

```html
<base href="/shopify-section-generator/">
```

Or use relative paths (which we already do, so no changes needed).

## 📋 Repository Structure

Your repository should have:

```
shopify-section-generator/
├── index.html
├── styles.css
├── app.js
├── suggestions.js
├── sections-library.js
├── CNAME (for custom domain)
├── README.md
├── HOW_TO_ADD_SECTIONS.md
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml
└── netlify.toml (optional, for Netlify)
```

## ✅ Verification

After pushing:

1. Visit your repository: https://github.com/shopifydevguy1-ops/shopify-section-generator
2. Verify all files are uploaded (including `CNAME` if using custom domain)
3. Check the **Actions** tab to see if the deployment workflow ran successfully
4. Wait a few minutes for GitHub Pages deployment
5. Visit your live URL to test

## 🔧 Troubleshooting Custom Domain 404 Errors

If your custom domain shows a 404 page:

1. **Verify CNAME file exists**:
   - Check that `CNAME` file is in the repository root
   - The file should contain only your domain (e.g., `u-dong.com`)
   - No trailing slashes or `https://` prefix

2. **Check DNS configuration**:
   - Verify DNS records are correct at your domain registrar
   - Wait up to 24-48 hours for DNS propagation
   - Use `dig` or `nslookup` to verify DNS resolution

3. **Verify GitHub Pages settings**:
   - Go to **Settings** → **Pages**
   - Ensure **Source** is set to **GitHub Actions**
   - Check that the custom domain shows "DNS check successful"
   - Make sure **Enforce HTTPS** is enabled

4. **Check workflow deployment**:
   - Go to **Actions** tab in your repository
   - Verify the latest workflow run completed successfully
   - The workflow should deploy from the root directory (`.`)

5. **Clear browser cache**:
   - Try accessing the site in incognito/private mode
   - Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)

6. **Wait for propagation**:
   - DNS changes can take 24-48 hours to fully propagate
   - GitHub Pages deployment may take 5-10 minutes after push

## 🎯 Next Steps

- Add a README.md with project description
- Add screenshots to the repository
- Set up GitHub Actions for automated deployments (optional)
- Add issues template for bug reports

---

**Need help?** Check GitHub's documentation: https://docs.github.com/en/pages

