import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import fs from "fs"
import path from "path"

export const dynamic = 'force-dynamic'

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
    
    // Get sections directory path - try multiple possible locations
    let sectionsPath = process.env.SECTIONS_DIRECTORY_PATH
    
    if (!sectionsPath) {
      // Try common paths in order of preference
      const possiblePaths = [
        path.join(process.cwd(), 'sections'),
        path.join(process.cwd(), '..', 'sections'),
        path.resolve('./sections'),
      ]
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          sectionsPath = possiblePath
          break
        }
      }
      
      // Fallback to default
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
      console.error(`[Image Route] Sections path: ${sectionsPath}`)
      console.error(`[Image Route] Current working directory: ${process.cwd()}`)
      console.error(`[Image Route] Resolved path: ${resolvedPath}`)
      console.error(`[Image Route] Image path requested: ${imagePath}`)
      
      // Try to list what's actually in the images directory for debugging
      try {
        const imagesDir = path.join(sectionsPath, 'images')
        if (fs.existsSync(imagesDir)) {
          const files = fs.readdirSync(imagesDir).slice(0, 10)
          console.error(`[Image Route] Sample files in images dir: ${files.join(', ')}`)
        }
      } catch (e) {
        console.error(`[Image Route] Could not list images directory:`, e)
      }
      
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

