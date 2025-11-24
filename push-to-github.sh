#!/bin/bash

# GitHub Push Script
# Edit the variables below with your GitHub username and repository name

GITHUB_USER="your-username"
REPO_NAME="vibecoder-section-generator"

echo "🚀 Pushing code to GitHub..."
echo "Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"

cd "$(dirname "$0")"

# Check if remote exists, if not add it
if git remote get-url origin &>/dev/null; then
    echo "📝 Updating remote URL..."
    git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
else
    echo "➕ Adding remote repository..."
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

# Ensure we're on main branch
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 View your repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"
else
    echo "❌ Push failed. Please check:"
    echo "   1. Repository exists on GitHub"
    echo "   2. You have write access"
    echo "   3. Your GitHub credentials are correct"
    echo ""
    echo "💡 Tip: You may need to use a Personal Access Token instead of password"
fi

