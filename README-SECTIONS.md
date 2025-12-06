# Section Processing Guide

## Overview
This guide explains how to process your sections to:
- Remove copyright comments
- Replace "SS-" with "SG-" prefix
- Update section names
- Add preview images

## Running the Processing Script

### Option 1: Using npm script
```bash
npm run process-sections
```

### Option 2: Direct execution
```bash
node scripts/process-sections.js
```

## What the Script Does

1. **Removes Copyright Comments**
   - Removes all comment blocks containing "Copyright", "Section Store", or "Unauthorized copying"
   - Works with both `{% comment %}` and `<!-- -->` style comments

2. **Replaces SS- with SG-**
   - Updates filenames: `ss-hero-banner.liquid` → `sg-hero-banner.liquid`
   - Updates content: All `ss-`, `SS-`, `ss_`, `SS_` references become `sg-`, `SG-`, `sg_`, `SG_`
   - Updates CSS classes: `.ss-hero` → `.sg-hero`
   - Updates IDs: `#ss-hero` → `#sg-hero`

3. **Updates Section Names**
   - Updates schema names: `"name": "Hero Banner"` → `"name": "SG-Hero Banner"`
   - Removes any existing "SS-" prefix before adding "SG-"

## Preview Images

### Where to Place Images

Place preview images in:
```
/sections/images/
```

### Image Naming Convention

Images should match the section filename:
- Section: `sg-hero-banner.liquid`
- Image: `sg-hero-banner.png`

### Supported Formats
- `.png` (recommended)
- `.jpg` / `.jpeg`
- `.gif`
- `.webp`
- `.svg`

### Example Structure
```
/sections/
  sg-hero-banner.liquid
  sg-testimonial-slider.liquid
  sg-product-upsell.liquid
  ...

/sections/images/
  sg-hero-banner.png
  sg-testimonial-slider.png
  sg-product-upsell.png
  ...
```

## After Processing

1. **Verify Changes**
   - Check that filenames are updated
   - Verify section names in schema have "SG-" prefix
   - Confirm copyright comments are removed

2. **Add Preview Images**
   - Create or move images to `/sections/images/`
   - Name them to match the section filenames
   - Images will automatically appear in the UI

3. **Test the System**
   - Search for sections using the new names
   - Verify preview images display correctly
   - Check that section code is intact

## Notes

- The script processes files in place (or renames them)
- **Backup your sections folder before running the script**
- The script will not modify files outside the `/sections` folder
- Preview images are optional - sections will work without them

