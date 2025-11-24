# Shopify Section Generator - Standalone Web App

A standalone web application for finding and using Shopify sections from your library. **No AI API key required!** Users can access this app via a URL, search for sections, and copy/paste the code into their Shopify theme.

**Repository:** [shopifydevguy1-ops/shopify-section-generator](https://github.com/shopifydevguy1-ops/shopify-section-generator)

## 🌐 Live Demo

- **GitHub Pages:** [View Live App](https://shopifydevguy1-ops.github.io/shopify-section-generator/)
- **Repository:** [View Source Code](https://github.com/shopifydevguy1-ops/shopify-section-generator)

## 🚀 Quick Start

### Option 1: Deploy to Netlify (Recommended)

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Drag and drop** the `standalone-app` folder to Netlify dashboard
   - Or connect to GitHub and deploy from there

3. **Your app is live!** 
   - Netlify will give you a URL like: `https://your-app-name.netlify.app`

4. **Share the URL** with users

### Option 2: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to the app folder:**
   ```bash
   cd standalone-app
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts** and your app will be live!

### Option 3: Deploy to GitHub Pages

1. **Create a GitHub repository**

2. **Upload all files** from `standalone-app` folder

3. **Go to Settings → Pages**

4. **Select source branch** (usually `main`)

5. **Your app will be at:** `https://your-username.github.io/repo-name`

### Option 4: Host on Your Own Server

1. **Upload all files** to your web server

2. **Ensure the server serves `index.html` as the default**

3. **Access via:** `https://your-domain.com`

## 📁 File Structure

```
standalone-app/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js             # Main application logic
├── suggestions.js     # Section suggestions engine
└── README.md          # This file
```

## ⚙️ Configuration

### Adding Your Section Library

**No API key needed!** This app uses your local section library.

1. **Open `sections-library.js`**
2. **Add your Shopify sections** to the array
3. **Each section needs:**
   - `id` - Unique identifier
   - `title` - Display name
   - `description` - What it does
   - `tags` - Keywords for matching (important!)
   - `category` - Section category
   - `code` - Complete Shopify Liquid code

See `HOW_TO_ADD_SECTIONS.md` for detailed instructions.

### Pre-loaded Sections

The app comes with 5 pre-built sections:
- Hero Banner with Image
- Product Grid
- Image with Text
- Testimonials Slider
- Feature Columns

Add more by editing `sections-library.js`!

## 🎯 How It Works

1. **User enters a description** of the section they want (e.g., "hero banner", "product grid")
2. **App searches** your section library using smart matching
3. **Best matching section** is found and displayed
4. **User copies code** to clipboard
5. **User pastes code** into Shopify theme editor

**No AI needed!** Uses intelligent keyword matching to find the right section from your library.

## 📋 Usage Instructions for End Users

### Finding a Section

1. **Open the app** at your assigned URL
2. **Enter keywords** describing the section you want:
   - Example: "hero banner", "product grid", "testimonials"
3. **Click "Find Section"** or press `Ctrl/Cmd + Enter`
4. **Best match appears** instantly (no waiting!)
5. **Click "Copy Code"** button
6. **Paste into Shopify:**
   - Go to Shopify Admin → Online Store → Themes
   - Click "Actions" → "Edit code"
   - Navigate to `/sections/` folder
   - Click "Add a new section"
   - Name it (e.g., `custom-section.liquid`)
   - Paste the code
   - Save

### Using Suggestions

- Browse suggested sections on the left
- Click **"Use This Template"** to auto-fill the prompt
- Modify the prompt if needed
- Generate the section

## 🔒 Security & Privacy

- **100% Free** - No API keys or costs
- **No server-side storage** of user data
- **No external API calls** - everything runs locally
- **No data collection** or tracking
- **All sections stored** in your `sections-library.js` file

## 💰 Cost Considerations

- **Completely FREE!** 
- **No API costs** - uses your local library
- **No subscription fees**
- **No limits** on searches or usage

## 🎨 Customization

### Changing Colors

Edit `styles.css` and modify CSS variables:
```css
:root {
    --primary: #2563eb;  /* Change this */
    --primary-hover: #1d4ed8;
    /* ... */
}
```

### Adding More Suggestions

Edit `suggestions.js` and add to `sectionLibrary` array:
```javascript
{
    id: "my-section",
    title: "My Section",
    tags: ["tag1", "tag2"],
    description: "Description here"
}
```

### Adding More Sections

Edit `sections-library.js` and add section objects. See `HOW_TO_ADD_SECTIONS.md` for complete guide.

## 🐛 Troubleshooting

### "No matching section found"
- Try different keywords in your search
- Check that sections are added to `sections-library.js`
- Make sure sections have good `tags` for matching
- See `HOW_TO_ADD_SECTIONS.md` for help

### "No sections available in library"
- Open `sections-library.js` and verify sections are added
- Check browser console for JavaScript errors
- Make sure `sections-library.js` is loaded before `app.js`

### Code not copying
- Make sure you've generated a section first
- Check browser permissions for clipboard access
- Try the download button instead

### Suggestions not showing
- Check browser console for JavaScript errors
- Ensure `suggestions.js` is loaded correctly

## 📱 Mobile Support

The app is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🔄 Updates

To update the app:
1. Make changes to files
2. Re-deploy to your hosting platform
3. Changes go live immediately

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Verify OpenAI API key is correct
3. Check OpenAI account has credits
4. Try a different browser

## 📄 License

This codebase is provided as-is. Modify and customize as needed.

---

**Ready to deploy?** Choose your hosting platform above and get started! 🚀

