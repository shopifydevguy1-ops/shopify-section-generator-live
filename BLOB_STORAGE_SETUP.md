# Vercel Blob Storage Setup Guide

## Problem
The application has 277MB of images that exceed Vercel's 250MB serverless function limit. Images need to be moved to external storage.

## Solution: Vercel Blob Storage

### Step 1: Create Vercel Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Storage → Create Database
3. Select "Blob" as the storage type
4. Name it `section-images` (or any name you prefer)
5. Create the store

### Step 2: Get Blob Token

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Get this from Vercel Blob store settings
   - **Environment**: Production, Preview, Development (all)

### Step 3: Upload Images to Blob Storage

Run the upload script locally (requires the token):

```bash
# Set the token temporarily
export BLOB_READ_WRITE_TOKEN=your_token_here

# Run the upload script
npx tsx scripts/upload-images-to-blob.ts
```

This will upload all images from `sections/images/` to Vercel Blob Storage.

### Step 4: Deploy

After uploading images:
1. The image route will automatically use Blob Storage if `BLOB_READ_WRITE_TOKEN` is set
2. Images will be served from Blob Storage instead of filesystem
3. This removes images from the deployment bundle, solving the 250MB limit

### Alternative: Use CDN/External Storage

If you prefer not to use Vercel Blob:
1. Upload images to AWS S3, Cloudinary, or another CDN
2. Update `lib/section-lookup.ts` to return CDN URLs instead of API routes
3. Update `app/api/sections/images/[...path]/route.ts` to redirect to CDN URLs

## Current Implementation

The image route (`app/api/sections/images/[...path]/route.ts`) now:
- First tries to fetch from Vercel Blob Storage (if token is set)
- Falls back to filesystem (for local development)
- This allows gradual migration without breaking local development

