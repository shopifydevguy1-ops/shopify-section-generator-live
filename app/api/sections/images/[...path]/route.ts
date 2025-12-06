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
    const { path } = await params
    const imagePath = path.join('/')
    
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

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
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

