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
    
    // Get sections directory path
    const sectionsPath = process.env.SECTIONS_DIRECTORY_PATH || path.join(process.cwd(), 'sections')
    const imageFilePath = path.join(sectionsPath, 'images', imagePath)

    // Security: Ensure the path is within the sections/images directory
    const resolvedPath = path.resolve(imageFilePath)
    const resolvedSectionsPath = path.resolve(path.join(sectionsPath, 'images'))
    
    if (!resolvedPath.startsWith(resolvedSectionsPath)) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(imageFilePath)) {
      return NextResponse.json(
        { error: "Image not found" },
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

