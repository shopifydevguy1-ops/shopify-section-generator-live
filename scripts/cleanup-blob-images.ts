/**
 * Script to delete all existing images from Vercel Blob Storage
 * Run this before re-uploading to avoid conflicts
 * 
 * Usage: npx tsx scripts/cleanup-blob-images.ts
 */

import { del, list } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

async function cleanupBlobImages() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN environment variable is required')
    console.error('Set it with: export BLOB_READ_WRITE_TOKEN="your_token_here"')
    process.exit(1)
  }

  console.log('Listing all blobs in storage...')
  
  let deleted = 0
  let failed = 0
  let cursor: string | undefined = undefined
  
  try {
    do {
      const result: { blobs: Array<{ url: string; pathname: string }>; cursor?: string } = await list({
        token,
        cursor,
        limit: 1000, // Maximum allowed
      })
      
      console.log(`Found ${result.blobs.length} blobs in this batch`)
      
      for (const blob of result.blobs) {
        try {
          await del(blob.url, { token })
          deleted++
          console.log(`✓ Deleted: ${blob.pathname}`)
        } catch (error: any) {
          console.error(`✗ Failed to delete ${blob.pathname}:`, error.message)
          failed++
        }
      }
      
      cursor = result.cursor
    } while (cursor)
    
    console.log(`\nCleanup complete:`)
    console.log(`  ✓ Deleted: ${deleted}`)
    console.log(`  ✗ Failed: ${failed}`)
    
  } catch (error: any) {
    console.error('Error during cleanup:', error.message)
    process.exit(1)
  }
}

cleanupBlobImages().catch(console.error)

