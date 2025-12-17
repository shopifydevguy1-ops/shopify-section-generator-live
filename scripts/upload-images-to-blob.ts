/**
 * Script to upload all section images to Vercel Blob Storage
 * Run this once to migrate images from local filesystem to Blob Storage
 * 
 * Usage: npx tsx scripts/upload-images-to-blob.ts
 */

import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const BLOB_STORE_NAME = 'section-images' // You'll need to create this in Vercel

async function uploadImagesToBlob() {
  const sectionsPath = path.join(process.cwd(), 'sections')
  const imagesPath = path.join(sectionsPath, 'images')
  const mobileImagesPath = path.join(imagesPath, 'mobile')

  if (!fs.existsSync(imagesPath)) {
    console.error('Images directory not found:', imagesPath)
    process.exit(1)
  }

  // Get all image files
  const imageFiles = fs.readdirSync(imagesPath)
    .filter(file => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file))
    .map(file => ({ file, path: path.join(imagesPath, file), isMobile: false }))

  // Get mobile images
  if (fs.existsSync(mobileImagesPath)) {
    const mobileFiles = fs.readdirSync(mobileImagesPath)
      .filter(file => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file))
      .map(file => ({ 
        file, 
        path: path.join(mobileImagesPath, file), 
        isMobile: true 
      }))
    imageFiles.push(...mobileFiles)
  }

  console.log(`Found ${imageFiles.length} images to upload`)

  const uploaded: string[] = []
  const failed: Array<{ file: string; error: string }> = []

  for (const { file, path: filePath, isMobile } of imageFiles) {
    try {
      const blobPath = isMobile ? `mobile/${file}` : file
      const buffer = fs.readFileSync(filePath)
      
      console.log(`Uploading ${blobPath}...`)
      
      const blob = await put(blobPath, buffer, {
        access: 'public',
        addRandomSuffix: false,
      })

      uploaded.push(blob.url)
      console.log(`✓ Uploaded ${blobPath} -> ${blob.url}`)
    } catch (error: any) {
      console.error(`✗ Failed to upload ${file}:`, error.message)
      failed.push({ file, error: error.message })
    }
  }

  console.log(`\nUpload complete:`)
  console.log(`  ✓ Uploaded: ${uploaded.length}`)
  console.log(`  ✗ Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\nFailed uploads:')
    failed.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`)
    })
  }

  // Save mapping for reference
  const mapping = {
    uploaded: uploaded.length,
    failed: failed.length,
    timestamp: new Date().toISOString(),
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'blob-upload-mapping.json'),
    JSON.stringify(mapping, null, 2)
  )

  console.log('\nNext steps:')
  console.log('1. Set BLOB_READ_WRITE_TOKEN in Vercel environment variables')
  console.log('2. Update image route to fetch from Blob Storage')
  console.log('3. Redeploy the application')
}

uploadImagesToBlob().catch(console.error)

