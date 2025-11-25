# GitHub Repository Setup

This guide will help you push the Shopify Section Generator to your GitHub repository.

## Step 1: Initialize Git Repository

If you haven't already, initialize a git repository:

```bash
cd "Section Generator App"
git init
```

## Step 2: Add Remote Repository

Add your GitHub repository as the remote origin:

```bash
git remote add origin https://github.com/shopifydevguy1-ops/shopify-section-generator.git
```

Or if you prefer SSH:

```bash
git remote add origin git@github.com:shopifydevguy1-ops/shopify-section-generator.git
```

## Step 3: Stage All Files

```bash
git add .
```

## Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: Shopify Section Generator"
```

## Step 5: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## Step 6: Verify Upload

1. Visit your repository on GitHub: https://github.com/shopifydevguy1-ops/shopify-section-generator
2. Verify all files are present
3. Check that `.env.local` is NOT in the repository (it should be in `.gitignore`)

## Important Notes

### Files NOT to Commit

The following files should NOT be committed (they're in `.gitignore`):
- `.env.local` - Contains sensitive keys
- `.env` - Environment variables
- `node_modules/` - Dependencies
- `.next/` - Build output
- `out/` - Static export output

### Files to Commit

✅ Commit these files:
- All source code (`app/`, `components/`, `lib/`, etc.)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`README.md`, `DEPLOYMENT.md`)
- `.env.example` - Example environment variables (safe to commit)
- `section-library/` - Your section templates

## Future Updates

When making changes:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

## Branch Strategy (Optional)

For production deployments, consider using branches:

```bash
# Create a development branch
git checkout -b develop

# Make changes and commit
git add .
git commit -m "New feature"

# Merge to main when ready
git checkout main
git merge develop
git push origin main
```

## GitHub Actions (Optional)

You can set up GitHub Actions for automated deployments. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Z.com

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy
        # Add your deployment steps here
```

## Repository Settings

1. **Go to Settings → Secrets and variables → Actions**
2. Add any required secrets for CI/CD
3. **Go to Settings → Pages** (if using GitHub Pages)
4. Configure deployment source

## Troubleshooting

### Authentication Issues

If you get authentication errors:

```bash
# Use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/shopifydevguy1-ops/shopify-section-generator.git
```

### Large Files

If you have large files:

```bash
# Install Git LFS (if needed)
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

### Undo Last Commit

If you need to undo:

```bash
# Soft reset (keeps changes)
git reset --soft HEAD~1

# Hard reset (discards changes)
git reset --hard HEAD~1
```

## Next Steps

After pushing to GitHub:

1. Set up deployment (see `DEPLOYMENT.md`)
2. Configure environment variables in your hosting
3. Set up database
4. Configure Stripe webhooks
5. Test the application

---

**Repository URL**: https://github.com/shopifydevguy1-ops/shopify-section-generator

