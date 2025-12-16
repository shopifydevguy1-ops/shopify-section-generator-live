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
  mobileImage?: string
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
 * Returns API route path for serving the image
 * NOTE: We don't check if file exists here to avoid tracing images during build
 * The image route will return 404 if the image doesn't exist
 */
function getPreviewImagePath(sectionsPath: string, filename: string): string | undefined {
  // Keep the same filename (including SG- prefix) for image
  const imageName = filename.replace(/\.(liquid|html)$/i, '.png')
  // Return API route path - don't check existence to avoid file tracing
  return `/api/sections/images/${imageName}`
}

/**
 * Get mobile preview image path for a section
 * Returns API route path for serving the image
 * NOTE: We don't check if file exists here to avoid tracing images during build
 * The image route will return 404 if the image doesn't exist
 */
function getMobileImagePath(sectionsPath: string, filename: string): string | undefined {
  // Keep the same filename (including SG- prefix) for image
  const imageName = filename.replace(/\.(liquid|html)$/i, '.png')
  // Return API route path - don't check existence to avoid file tracing
  return `/api/sections/images/mobile/${imageName}`
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
        
        // Get mobile image path
        const mobileImage = getMobileImagePath(sectionsPath, file)

        sections.push({
          filename: file,
          name,
          tags,
          description,
          liquidCode: content,
          previewImage,
          mobileImage,
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
 * Keyword mappings for common section types
 * Maps user-friendly keywords to section type identifiers
 */
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  'hero': ['hero', 'landing', 'header', 'intro', 'banner', 'headline', 'main'],
  'feature': ['feature', 'features', 'benefit', 'benefits', 'advantage', 'advantages', 'highlight', 'highlights'],
  'testimonial': ['testimonial', 'testimonials', 'review', 'reviews', 'rating', 'ratings', 'customer', 'feedback'],
  'announcement': ['announcement', 'announcements', 'alert', 'alerts', 'notice', 'notices', 'bar', 'banner'],
  'header': ['header', 'headers', 'navigation', 'nav', 'menu', 'navbar'],
  'banner': ['banner', 'banners', 'promo', 'promotion', 'promotional', 'ad', 'advertisement'],
  'gallery': ['gallery', 'galleries', 'image', 'images', 'photo', 'photos', 'picture', 'pictures'],
  'product': ['product', 'products', 'item', 'items', 'shop', 'shopping'],
  'collection': ['collection', 'collections', 'category', 'categories'],
  'faq': ['faq', 'faqs', 'question', 'questions', 'accordion', 'accordions', 'help'],
  'form': ['form', 'forms', 'contact', 'email', 'subscribe', 'subscription'],
  'video': ['video', 'videos', 'youtube', 'vimeo'],
  'slider': ['slider', 'sliders', 'carousel', 'carousels', 'slideshow', 'slides'],
  'countdown': ['countdown', 'timer', 'timers', 'deadline'],
  'blog': ['blog', 'article', 'articles', 'post', 'posts'],
  'footer': ['footer', 'footers', 'bottom'],
}

/**
 * Expand search terms with keyword mappings
 */
function expandSearchTerms(terms: string[]): string[] {
  const expanded = new Set<string>(terms)
  
  for (const term of terms) {
    // Check if term matches any keyword mapping
    for (const [key, synonyms] of Object.entries(KEYWORD_MAPPINGS)) {
      if (synonyms.some(syn => syn.includes(term) || term.includes(syn))) {
        // Add the main keyword and all synonyms
        expanded.add(key)
        synonyms.forEach(syn => expanded.add(syn))
      }
    }
  }
  
  return Array.from(expanded)
}

/**
 * Tokenize user input into search terms
 */
function tokenizeInput(input: string): string[] {
  const terms = input
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(term => term.length > 0)
    .filter(term => !['a', 'an', 'the', 'i', 'need', 'want', 'give', 'me', 'get', 'show', 'looking', 'for'].includes(term))
  
  // Expand with keyword mappings
  return expandSearchTerms(terms)
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
    // Check keyword mappings for boosted scoring
    let isKeywordMatch = false
    for (const [key, synonyms] of Object.entries(KEYWORD_MAPPINGS)) {
      if (synonyms.includes(term)) {
        // If filename contains the main keyword type, boost score
        if (lowerFilename.includes(key)) {
          score += 60 // Very high score for keyword type match
          isKeywordMatch = true
        }
        // Also check if any synonym appears in filename
        if (synonyms.some(syn => lowerFilename.includes(syn))) {
          score += 55
          isKeywordMatch = true
        }
      }
    }

    // Exact filename match (highest priority if not already matched)
    if (!isKeywordMatch && lowerFilename.includes(term)) {
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

    // Partial filename match (e.g., "hero" matches "hero-banner" or "sg-hero-10")
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

  // Filter and sort by score
  const filtered = scoredSections
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.section)
  
  // If we have good matches (score > 10), return them
  // Otherwise, if no good matches, return sections with any score > 0
  const goodMatches = scoredSections
    .filter(item => item.score > 10)
    .sort((a, b) => b.score - a.score)
    .map(item => item.section)
  
  // Return good matches if available, otherwise return all matches
  return goodMatches.length > 0 ? goodMatches : filtered
}

