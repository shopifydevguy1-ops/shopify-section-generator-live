import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { head, getDownloadUrl } from '@vercel/blob'
import fs from "fs"
import path from "path"

export const dynamic = 'force-dynamic'

// Use Blob Storage if token is available, otherwise fallback to filesystem
const USE_BLOB_STORAGE = !!process.env.BLOB_READ_WRITE_TOKEN

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { path: pathArray } = await params
    const imagePath = pathArray.join('/')
    
    // Try Blob Storage first if available
    if (USE_BLOB_STORAGE) {
      try {
        // Check if blob exists and get metadata
        // head() returns blob metadata including url
        // The imagePath should match what was uploaded (e.g., "sg-hero-1.png" or "mobile/sg-hero-1.png")
        const blobInfo = await head(imagePath, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        
        if (!blobInfo) {
          return NextResponse.json(
            { error: "Image not found in Blob Storage", path: imagePath },
            { status: 404 }
          )
        }

        // Get download URL from the blob URL
        const downloadUrl = getDownloadUrl(blobInfo.url)
        
        // Fetch the blob content
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`)
        }
        
        const blobBuffer = await response.arrayBuffer()
        const ext = path.extname(imagePath).toLowerCase()
        
        // Use content type from blob info if available, otherwise infer from extension
        let contentType = blobInfo.contentType || 'image/png'
        if (!blobInfo.contentType) {
          if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg'
          } else if (ext === '.gif') {
            contentType = 'image/gif'
          } else if (ext === '.webp') {
            contentType = 'image/webp'
          } else if (ext === '.svg') {
            contentType = 'image/svg+xml'
          }
        }

        return new NextResponse(blobBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600, must-revalidate',
          },
        })
      } catch (error: any) {
        console.error(`[Image Route] Blob Storage error for ${imagePath}:`, error.message)
        // Fall through to filesystem fallback
      }
    }

    // Fallback to filesystem (for local development or if Blob fails)
    let sectionsPath = process.env.SECTIONS_DIRECTORY_PATH
    
    if (!sectionsPath) {
      const cwd = process.cwd()
      const possiblePaths = [
        path.join(cwd, 'sections'),
        path.join(cwd, '..', 'sections'),
        path.join(cwd, '../..', 'sections'),
        path.resolve(cwd, 'sections'),
        path.resolve('./sections'),
        '/var/task/sections',
        path.join('/var/task', 'sections'),
      ]
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          sectionsPath = possiblePath
          break
        }
      }
      
      if (!sectionsPath) {
        sectionsPath = path.join(process.cwd(), 'sections')
      }
    }
    
    const imageFilePath = path.join(sectionsPath, 'images', imagePath)

    // Security: Ensure the path is within the sections/images directory
    const resolvedPath = path.resolve(imageFilePath)
    const resolvedSectionsPath = path.resolve(path.join(sectionsPath, 'images'))
    
    if (!resolvedPath.startsWith(resolvedSectionsPath)) {
      console.error(`[Image Route] Invalid path: ${resolvedPath} not within ${resolvedSectionsPath}`)
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(imageFilePath)) {
      console.error(`[Image Route] File not found: ${imageFilePath}`)
      return NextResponse.json(
        { error: "Image not found", path: imageFilePath, requested: imagePath },
        { status: 404 }
      )
    }

    // Read and return the image
    const imageBuffer = fs.readFileSync(imageFilePath)
    const ext = path.extname(imagePath).toLowerCase()
    
    // Get file modification time for cache busting
    const stats = fs.statSync(imageFilePath)
    const lastModified = stats.mtime.getTime()
    const etag = `"${lastModified}"`
    
    let contentType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg'
    } else if (ext === '.gif') {
      contentType = 'image/gif'
    } else if (ext === '.webp') {
      contentType = 'image/webp'
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml'
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'ETag': etag,
        'Last-Modified': stats.mtime.toUTCString(),
      },
    })
  } catch (error: any) {
    console.error("Error serving image:", error)
    return NextResponse.json(
      { error: error.message || "Failed to serve image" },
      { status: 500 }
    )
  }
}

