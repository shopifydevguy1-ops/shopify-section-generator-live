// Section Lookup System
// Reads raw section files from /sections folder and provides search functionality
// NO AI generation, NO code modification - pure file lookup

import fs from 'fs'
import path from 'path'

export interface SectionMetadata {
  filename: string
  name: string
  tags: string[]
  description: string
  liquidCode: string
  previewImage?: string
}

/**
 * Extract metadata from HTML/Liquid comments
 * Looks for patterns like:
 * <!-- name: Hero Banner -->
 * <!-- tags: hero, banner, landing -->
 * <!-- description: A hero section with image + text -->
 */
function extractMetadataFromComments(content: string): {
  name?: string
  tags?: string[]
  description?: string
} {
  const metadata: {
    name?: string
    tags?: string[]
    description?: string
  } = {}

  // Match comment patterns
  const nameMatch = content.match(/<!--\s*name:\s*(.+?)\s*-->/i)
  if (nameMatch) {
    metadata.name = nameMatch[1].trim()
  }

  const tagsMatch = content.match(/<!--\s*tags:\s*(.+?)\s*-->/i)
  if (tagsMatch) {
    metadata.tags = tagsMatch[1]
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }

  const descMatch = content.match(/<!--\s*description:\s*(.+?)\s*-->/i)
  if (descMatch) {
    metadata.description = descMatch[1].trim()
  }

  return metadata
}

/**
 * Infer section name from filename
 * Example: sg-hero-banner.liquid -> Hero Banner (removes SG- prefix)
 */
function inferNameFromFilename(filename: string): string {
  // Remove extension
  let nameWithoutExt = filename.replace(/\.(liquid|html)$/i, '')
  // Remove SG- prefix if present
  nameWithoutExt = nameWithoutExt.replace(/^sg-/i, '')
  // Split by dashes/underscores and capitalize
  return nameWithoutExt
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get preview image path for a section
 * Checks /sections/images/{filename}.png
 * Returns API route path for serving the image
 */
function getPreviewImagePath(sectionsPath: string, filename: string): string | undefined {
  const imageDir = path.join(sectionsPath, 'images')
  // Keep the same filename (including SG- prefix) for image
  const imageName = filename.replace(/\.(liquid|html)$/i, '.png')
  const imagePath = path.join(imageDir, imageName)

  if (fs.existsSync(imagePath)) {
    // Return API route path for serving the image
    return `/api/sections/images/${imageName}`
  }

  return undefined
}

/**
 * Load all sections from /sections folder
 * Extracts metadata from comments and file content
 */
export function loadAllSections(): SectionMetadata[] {
  try {
    const sectionsPath = getSectionsDirectoryPath()
    
    if (!fs.existsSync(sectionsPath)) {
      console.warn(`[Section Lookup] Sections directory not found at ${sectionsPath}`)
      return []
    }

    const files = fs.readdirSync(sectionsPath)
    // Filter to only .liquid files (exclude images folder)
    const liquidFiles = files.filter(file => 
      file.endsWith('.liquid') && 
      !file.startsWith('.') &&
      fs.statSync(path.join(sectionsPath, file)).isFile()
    )

    console.log(`[Section Lookup] Found ${liquidFiles.length} section files`)

    const sections: SectionMetadata[] = []

    for (const file of liquidFiles) {
      try {
        const filePath = path.join(sectionsPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')

        if (!content || content.trim().length === 0) {
          console.warn(`[Section Lookup] Skipping empty file: ${file}`)
          continue
        }

        // Extract metadata from comments
        const commentMetadata = extractMetadataFromComments(content)

        // Get name from metadata or infer from filename
        const name = commentMetadata.name || inferNameFromFilename(file)

        // Get tags from metadata or empty array
        const tags = commentMetadata.tags || []

        // Get description from metadata or empty string
        const description = commentMetadata.description || ''

        // Get preview image path
        const previewImage = getPreviewImagePath(sectionsPath, file)

        sections.push({
          filename: file,
          name,
          tags,
          description,
          liquidCode: content,
          previewImage,
        })
      } catch (error) {
        console.error(`[Section Lookup] Error loading ${file}:`, error)
      }
    }

    console.log(`[Section Lookup] Loaded ${sections.length} sections`)
    return sections
  } catch (error) {
    console.error('[Section Lookup] Error loading sections:', error)
    return []
  }
}

/**
 * Get sections directory path
 */
function getSectionsDirectoryPath(): string {
  // Check for environment variable first
  if (process.env.SECTIONS_DIRECTORY_PATH) {
    return process.env.SECTIONS_DIRECTORY_PATH
  }

  // Try local sections folder first
  const localSectionsPath = path.join(process.cwd(), 'sections')
  if (fs.existsSync(localSectionsPath)) {
    return localSectionsPath
  }

  // Fallback to default path
  return path.join(process.cwd(), 'sections')
}

/**
 * Tokenize user input into search terms
 */
function tokenizeInput(input: string): string[] {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(term => term.length > 0)
    .filter(term => !['a', 'an', 'the', 'i', 'need', 'want', 'give', 'me', 'get'].includes(term))
}

/**
 * Score a section against search terms
 * Higher score = better match
 */
function scoreSection(section: SectionMetadata, searchTerms: string[]): number {
  let score = 0
  const lowerName = section.name.toLowerCase()
  const lowerFilename = section.filename.toLowerCase()
  const lowerDescription = section.description.toLowerCase()
  const lowerTags = section.tags.map(t => t.toLowerCase())
  const lowerCode = section.liquidCode.toLowerCase()

  for (const term of searchTerms) {
    // Exact filename match (highest priority)
    if (lowerFilename.includes(term)) {
      score += 50
    }

    // Name match
    if (lowerName.includes(term)) {
      score += 30
    }

    // Tag match
    if (lowerTags.some(tag => tag.includes(term) || term.includes(tag))) {
      score += 25
    }

    // Description match
    if (lowerDescription.includes(term)) {
      score += 15
    }

    // Partial filename match (e.g., "hero" matches "hero-banner")
    const filenameParts = lowerFilename.split(/[-_]/)
    if (filenameParts.some(part => part.includes(term) || term.includes(part))) {
      score += 20
    }

    // Code content match (lower priority)
    if (lowerCode.includes(term)) {
      score += 5
    }
  }

  return score
}

/**
 * Search sections by query
 * Returns sections ranked by relevance
 */
export function searchSections(query: string, allSections?: SectionMetadata[]): SectionMetadata[] {
  const sections = allSections || loadAllSections()
  
  if (!query || query.trim().length === 0) {
    return sections
  }

  const searchTerms = tokenizeInput(query)
  
  if (searchTerms.length === 0) {
    return sections
  }

  // Score each section
  const scoredSections = sections.map(section => ({
    section,
    score: scoreSection(section, searchTerms),
  }))

  // Filter out zero-score sections and sort by score
  return scoredSections
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.section)
}

