# Quick Deploy to GitHub

## 🚀 Fastest Way (Using the Script)

1. **Open terminal** in the `standalone-app` folder
2. **Run the script:**
   ```bash
   ./PUSH_TO_GITHUB.sh
   ```

That's it! The script will:
- Initialize git (if needed)
- Add all files
- Commit with a message
- Connect to your GitHub repo
- Push everything

## 📋 Manual Steps (If Script Doesn't Work)

```bash
cd standalone-app
git init
git add .
git commit -m "Initial commit: Shopify Section Generator"
git remote add origin https://github.com/shopifydevguy1-ops/shopify-section-generator.git
git branch -M main
git push -u origin main
```

## 🌐 Enable GitHub Pages

After pushing:

1. Go to: https://github.com/shopifydevguy1-ops/shopify-section-generator/settings/pages
2. Under **Source**, select **Deploy from a branch**
3. Choose **main** branch
4. Select **/ (root)** folder
5. Click **Save**

Wait 1-2 minutes, then visit:
**https://shopifydevguy1-ops.github.io/shopify-section-generator/**

## ✅ Verify

- [ ] All files pushed to GitHub
- [ ] GitHub Pages enabled
- [ ] App loads at the GitHub Pages URL
- [ ] Sections library loads correctly
- [ ] Search functionality works

---

**Troubleshooting:**
- If push fails, make sure you're authenticated: `gh auth login`
- Or use SSH: `git remote set-url origin git@github.com:shopifydevguy1-ops/shopify-section-generator.git`

