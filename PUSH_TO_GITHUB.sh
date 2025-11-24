#!/bin/bash

# Script to push Section Generator app to GitHub
# Usage: ./PUSH_TO_GITHUB.sh

echo "🚀 Pushing Shopify Section Generator to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Shopify Section Generator - Standalone app with local section library

- No AI API key required
- Uses local section library for matching
- Smart keyword-based section search
- Copy/paste ready Shopify Liquid code
- Fully responsive UI
- Free and open source"

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote already configured"
else
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/shopifydevguy1-ops/shopify-section-generator.git
fi

# Set main branch
git branch -M main

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/shopifydevguy1-ops/shopify-section-generator"
echo ""
echo "📋 Next steps:"
echo "1. Go to repository Settings → Pages"
echo "2. Select 'Deploy from a branch'"
echo "3. Choose 'main' branch and '/ (root)' folder"
echo "4. Your app will be live at: https://shopifydevguy1-ops.github.io/shopify-section-generator/"
echo ""

