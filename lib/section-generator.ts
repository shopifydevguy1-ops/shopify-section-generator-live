// Section Generator Logic
// Loads sections from liquid files in the sections directory
// Schema generation ensures all variables are properly converted to Shopify schema settings

import fs from 'fs'
import path from 'path'

export interface SectionTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  type: string
  liquid_code: string
  variables: Record<string, {
    type: string
    default: any
    label: string
    description?: string
  }>
  preview_image?: string
}

export interface SectionCustomization {
  [key: string]: any
}

/**
 * Extract schema from liquid content
 */
function extractSchemaFromLiquid(liquidContent: string): any | null {
  try {
    const schemaMatch = liquidContent.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)
    if (schemaMatch) {
      return JSON.parse(schemaMatch[1])
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return null
}

/**
 * Extract variables from schema settings
 */
function extractVariablesFromSchema(schema: any): Record<string, any> {
  const variables: Record<string, any> = {}
  
  if (schema && schema.settings && Array.isArray(schema.settings)) {
    for (const setting of schema.settings) {
      if (setting.id && setting.type) {
        variables[setting.id] = {
          type: mapSchemaTypeToVariableType(setting.type),
          default: setting.default !== undefined ? setting.default : '',
          label: setting.label || setting.id,
          description: setting.info || ''
        }
      }
    }
  }
  
  return variables
}

/**
 * Map Shopify schema type to variable type
 */
function mapSchemaTypeToVariableType(schemaType: string): string {
  switch (schemaType.toLowerCase()) {
    case "color":
      return "color"
    case "textarea":
      return "textarea"
    case "text":
    default:
      return "text"
  }
}

/**
 * Infer section type from section ID
 * Examples: ss-testimonials-22 -> testimonial, custom-product-tabs -> product
 */
function inferSectionTypeFromId(sectionId: string): string {
  const lowerId = sectionId.toLowerCase()
  
  // Remove common prefixes
  const cleanId = lowerId.replace(/^(ss-|custom-)/, '')
  
  // Common type patterns
  if (cleanId.includes('testimonial')) return 'testimonial'
  if (cleanId.includes('product')) return 'product'
  if (cleanId.includes('hero')) return 'hero'
  if (cleanId.includes('banner')) return 'banner'
  if (cleanId.includes('collection')) return 'collection'
  if (cleanId.includes('faq')) return 'faq'
  if (cleanId.includes('form')) return 'form'
  if (cleanId.includes('gallery')) return 'gallery'
  if (cleanId.includes('video')) return 'video'
  if (cleanId.includes('slider') || cleanId.includes('carousel')) return 'slider'
  if (cleanId.includes('countdown') || cleanId.includes('timer')) return 'countdown'
  if (cleanId.includes('trust') || cleanId.includes('badge')) return 'trust'
  if (cleanId.includes('social')) return 'social'
  if (cleanId.includes('newsletter')) return 'newsletter'
  if (cleanId.includes('blog')) return 'blog'
  if (cleanId.includes('footer')) return 'footer'
  if (cleanId.includes('header') || cleanId.includes('nav')) return 'header'
  
  return 'custom'
}

/**
 * Extract section name from liquid file schema
 */
function extractNameFromSchema(liquidContent: string): string {
  const schema = extractSchemaFromLiquid(liquidContent)
  return schema?.name || ''
}

/**
 * Load all section templates from liquid files directory (primary source)
 * Extracts all metadata from liquid files themselves (no JSON dependencies)
 */
export function loadSectionTemplates(): SectionTemplate[] {
  try {
    const sectionsPath = getSectionsDirectoryPath()
    
    if (!fs.existsSync(sectionsPath)) {
      console.warn(`Sections directory not found at ${sectionsPath}`)
      return getDefaultTemplates()
    }

    const files = fs.readdirSync(sectionsPath)
    const liquidFiles = files.filter(file => file.endsWith('.liquid'))
    
    console.log(`Found ${liquidFiles.length} liquid files in ${sectionsPath}`)
    
    const templates: SectionTemplate[] = []
    let loadedCount = 0
    let errorCount = 0
    
    for (const file of liquidFiles) {
      try {
        // Extract section ID from filename (remove .liquid extension)
        const sectionId = file.replace(/\.liquid$/, '')
        const filePath = path.join(sectionsPath, file)
        const liquidContent = fs.readFileSync(filePath, 'utf-8')
        
        if (!liquidContent || liquidContent.trim().length === 0) {
          console.warn(`Skipping ${file}: file is empty`)
          errorCount++
          continue
        }
        
        // Extract schema from liquid content
        const schema = extractSchemaFromLiquid(liquidContent)
        const hasSchema = !!schema
        
        if (!hasSchema) {
          console.warn(`[loadSectionTemplates] ⚠ ${file} loaded but missing schema tags`)
        }
        
        // Extract metadata from schema
        const nameFromSchema = schema?.name || ''
        const sectionName = cleanSectionName(nameFromSchema || sectionId)
        const sectionDescription = `Section: ${sectionName}`
        
        // Extract variables from schema settings
        const variables = schema ? extractVariablesFromSchema(schema) : {}
        
        // Infer section type from ID (e.g., ss-testimonials-22 -> testimonial)
        const inferredType = inferSectionTypeFromId(sectionId)
        
        // Create template with liquid file as primary source
        const template: SectionTemplate = {
          id: sectionId,
          name: sectionName,
          description: sectionDescription,
          tags: [], // Tags can be extracted from schema if needed in future
          type: inferredType, // Infer type from section ID
          liquid_code: liquidContent, // Use complete liquid file content (includes schema)
          variables: variables,
          preview_image: undefined // Preview images not in liquid files
        }
        
        templates.push(template)
        loadedCount++
      } catch (error) {
        console.error(`Error loading liquid file ${file}:`, error)
        errorCount++
      }
    }
    
    console.log(`Loaded ${loadedCount} templates from liquid files${errorCount > 0 ? `, ${errorCount} errors` : ''}`)
    
    // If no templates found, return defaults
    if (templates.length === 0) {
      console.warn('No liquid files found, using default templates')
      return getDefaultTemplates()
    }
    
    return templates
  } catch (error) {
    console.error('Error loading section templates from liquid files:', error)
    return getDefaultTemplates()
  }
}

/**
 * Get default templates if no liquid files are found
 */
function getDefaultTemplates(): SectionTemplate[] {
  return [
    {
      id: "hero-1",
      name: "Hero Banner",
      description: "A beautiful hero section with heading, subheading, and CTA button",
      tags: ["hero", "banner", "cta"],
      type: "hero",
      liquid_code: `{% comment %}
  Section: {{title}}
  Description: {{description}}
{% endcomment %}

<div class="hero-section" style="background-color: {{bg_color}}; padding: 80px 20px; text-align: center;">
  <h1 style="color: {{text_color}}; font-size: 48px; margin-bottom: 20px;">{{heading}}</h1>
  <p style="color: {{text_color}}; font-size: 20px; margin-bottom: 30px;">{{subheading}}</p>
  <a href="{{cta_url}}" class="cta-button" style="background-color: {{button_color}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
    {{cta_text}}
  </a>
</div>`,
      variables: {
        title: { type: "text", default: "Hero Section", label: "Section Title", description: "Internal title for this section" },
        description: { type: "textarea", default: "Hero banner section", label: "Description", description: "Section description" },
        heading: { type: "text", default: "Welcome to Our Store", label: "Heading", description: "Main heading text" },
        subheading: { type: "textarea", default: "Discover amazing products", label: "Subheading", description: "Subheading text" },
        cta_text: { type: "text", default: "Shop Now", label: "Button Text", description: "Call-to-action button text" },
        cta_url: { type: "text", default: "/collections/all", label: "Button URL", description: "Link for the CTA button" },
        bg_color: { type: "color", default: "#667eea", label: "Background Color", description: "Background color" },
        text_color: { type: "color", default: "#ffffff", label: "Text Color", description: "Text color" },
        button_color: { type: "color", default: "#f5576c", label: "Button Color", description: "Button background color" },
      }
    },
    {
      id: "product-carousel-1",
      name: "Product Carousel",
      description: "A responsive product carousel showcasing featured products",
      tags: ["products", "carousel", "featured"],
      type: "product_carousel",
      liquid_code: `{% comment %}
  Section: {{title}}
  Description: {{description}}
{% endcomment %}

<div class="product-carousel" style="padding: 60px 20px; background-color: {{bg_color}};">
  <h2 style="text-align: center; color: {{heading_color}}; font-size: 36px; margin-bottom: 40px;">{{heading}}</h2>
  <div class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
    {% for product in collections.{{collection_handle}}.products limit: {{product_limit}} %}
      <div class="product-card" style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <a href="{{ product.url }}">
          <img src="{{ product.featured_image | img_url: '400x400' }}" alt="{{ product.title }}" style="width: 100%; height: 250px; object-fit: cover;">
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: {{text_color}};">{{ product.title }}</h3>
            <p style="color: {{price_color}}; font-size: 20px; font-weight: bold; margin: 0;">{{ product.price | money }}</p>
          </div>
        </a>
      </div>
    {% endfor %}
  </div>
</div>`,
      variables: {
        title: { type: "text", default: "Product Carousel", label: "Section Title", description: "Internal title" },
        description: { type: "textarea", default: "Featured products carousel", label: "Description", description: "Section description" },
        heading: { type: "text", default: "Featured Products", label: "Heading", description: "Section heading" },
        collection_handle: { type: "text", default: "all", label: "Collection Handle", description: "Shopify collection handle" },
        product_limit: { type: "text", default: "8", label: "Product Limit", description: "Number of products to show" },
        bg_color: { type: "color", default: "#f8f9fa", label: "Background Color", description: "Section background" },
        heading_color: { type: "color", default: "#333333", label: "Heading Color", description: "Heading text color" },
        text_color: { type: "color", default: "#333333", label: "Text Color", description: "Product title color" },
        price_color: { type: "color", default: "#667eea", label: "Price Color", description: "Price text color" },
      }
    },
    {
      id: "faq-1",
      name: "FAQ Accordion",
      description: "A collapsible FAQ section with questions and answers",
      tags: ["faq", "accordion", "questions"],
      type: "faq",
      liquid_code: `{% comment %}
  Section: {{title}}
  Description: {{description}}
{% endcomment %}

<div class="faq-section" style="padding: 60px 20px; background-color: {{bg_color}}; max-width: 800px; margin: 0 auto;">
  <h2 style="text-align: center; color: {{heading_color}}; font-size: 36px; margin-bottom: 40px;">{{heading}}</h2>
  <div class="faq-items">
    {% for i in (1..{{faq_count}}) %}
      <div class="faq-item" style="margin-bottom: 15px; border: 1px solid {{border_color}}; border-radius: 8px; overflow: hidden;">
        <div class="faq-question" style="padding: 20px; background-color: {{question_bg}}; cursor: pointer; color: {{question_color}}; font-weight: bold;">
          Question {{ i }}
        </div>
        <div class="faq-answer" style="padding: 20px; background-color: {{answer_bg}}; color: {{answer_color}}; display: none;">
          Answer {{ i }} - Edit this in your theme editor
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<script>
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
      const answer = this.nextElementSibling;
      answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    });
  });
</script>`,
      variables: {
        title: { type: "text", default: "FAQ Section", label: "Section Title", description: "Internal title" },
        description: { type: "textarea", default: "Frequently asked questions", label: "Description", description: "Section description" },
        heading: { type: "text", default: "Frequently Asked Questions", label: "Heading", description: "Section heading" },
        faq_count: { type: "text", default: "5", label: "Number of FAQs", description: "How many FAQ items to show" },
        bg_color: { type: "color", default: "#ffffff", label: "Background Color", description: "Section background" },
        heading_color: { type: "color", default: "#333333", label: "Heading Color", description: "Heading text color" },
        border_color: { type: "color", default: "#e0e0e0", label: "Border Color", description: "Border color" },
        question_bg: { type: "color", default: "#f8f9fa", label: "Question Background", description: "Question background color" },
        question_color: { type: "color", default: "#333333", label: "Question Color", description: "Question text color" },
        answer_bg: { type: "color", default: "#ffffff", label: "Answer Background", description: "Answer background color" },
        answer_color: { type: "color", default: "#666666", label: "Answer Color", description: "Answer text color" },
      }
    }
  ]
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: string): SectionTemplate[] {
  const templates = loadSectionTemplates()
  return templates.filter(t => t.type === type)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SectionTemplate | null {
  const templates = loadSectionTemplates()
  return templates.find(t => t.id === id) || null
}

/**
 * Search templates by tags or name
 */
export function searchTemplates(query: string): SectionTemplate[] {
  const templates = loadSectionTemplates()
  const lowerQuery = query.toLowerCase()
  
  return templates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Generate liquid code from template with customizations
 */
export function generateSection(
  template: SectionTemplate,
  customizations: SectionCustomization
): string {
  let liquidCode = template.liquid_code
  
  // Replace variables in the liquid code
  for (const [key, value] of Object.entries(customizations)) {
    const placeholder = `{{${key}}}`
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    liquidCode = liquidCode.replace(regex, String(value))
  }
  
  // Replace default values for variables not customized
  for (const [key, variable] of Object.entries(template.variables)) {
    if (!(key in customizations)) {
      const placeholder = `{{${key}}}`
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      liquidCode = liquidCode.replace(regex, String(variable.default))
    }
  }
  
  return liquidCode
}

/**
 * Get all available section types
 */
export function getAvailableTypes(): string[] {
  const templates = loadSectionTemplates()
  const types = new Set(templates.map(t => t.type))
  return Array.from(types).sort()
}

/**
 * Clean section name by removing "CUSTOM" and "SS-" prefixes
 */
export function cleanSectionName(name: string): string {
  return name
    .replace(/^CUSTOM\s+/i, '')
    .replace(/^SS-\s*/i, '')
    .replace(/^SS\s+/i, '')
    .trim()
}

/**
 * Parse section references from text input
 * Supports comma-separated or newline-separated section IDs/names
 */
export function parseSectionReferences(input: string): string[] {
  // Split by newlines or commas, trim whitespace, filter empty strings
  return input
    .split(/[,\n]/)
    .map(ref => ref.trim())
    .filter(ref => ref.length > 0)
}

/**
 * Find sections using natural language processing
 * Analyzes user text and finds relevant sections based on keywords, tags, and descriptions
 */
export function findSectionsByNaturalLanguage(input: string, maxResults: number = 10): SectionTemplate[] {
  const templates = loadSectionTemplates()
  const lowerInput = input.toLowerCase().trim()
  
  console.log(`[findSectionsByNaturalLanguage] Searching for: "${input}" (${templates.length} templates loaded)`)
  
  // Extract keywords from input (remove common words)
  const commonWords = ['i', 'need', 'a', 'an', 'the', 'want', 'looking', 'for', 'get', 'show', 'me', 'to', 'is', 'are', 'was', 'were']
  let keywords = lowerInput
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0)
  
  // If no keywords after filtering, use the whole input cleaned
  if (keywords.length === 0) {
    const cleaned = lowerInput.replace(/[^\w]/g, '')
    if (cleaned.length > 0) {
      keywords = [cleaned]
    } else {
      keywords = [lowerInput]
    }
  }
  
  console.log(`[findSectionsByNaturalLanguage] Extracted keywords:`, keywords)
  
  // Common section type mappings with synonyms
  const sectionTypeMappings: Record<string, string[]> = {
    'hero': ['hero', 'landing', 'header', 'intro', 'banner'],
    'banner': ['banner', 'hero', 'landing', 'header', 'intro'],
    'product': ['product', 'products', 'shop', 'catalog', 'item', 'items', 'merchandise'],
    'collection': ['collection', 'collections', 'category', 'categories', 'group', 'groups', 'set', 'sets'],
    'testimonial': ['testimonial', 'testimonials', 'review', 'reviews', 'feedback', 'rating', 'ratings', 'quote', 'quotes', 'customer', 'customers'],
    'faq': ['faq', 'faqs', 'question', 'questions', 'answer', 'answers', 'help', 'support'],
    'form': ['form', 'forms', 'contact', 'submit', 'input', 'field', 'fields'],
    'gallery': ['gallery', 'galleries', 'image', 'images', 'photo', 'photos', 'picture', 'pictures', 'media'],
    'video': ['video', 'videos', 'youtube', 'vimeo', 'media'],
    'slider': ['slider', 'sliders', 'carousel', 'carousels', 'slideshow', 'swiper'],
    'countdown': ['countdown', 'timer', 'timers', 'clock', 'deadline'],
    'trust': ['trust', 'badge', 'badges', 'security', 'guarantee', 'certificate'],
    'social': ['social', 'share', 'facebook', 'twitter', 'instagram'],
    'newsletter': ['newsletter', 'email', 'emails', 'subscribe', 'signup'],
    'blog': ['blog', 'blogs', 'article', 'articles', 'post', 'posts', 'news'],
    'footer': ['footer', 'footers', 'bottom', 'links'],
    'header': ['header', 'headers', 'nav', 'navigation', 'menu', 'menus'],
  }
  
  // Score each template based on relevance
  const scoredTemplates = templates.map(template => {
    let score = 0
    const lowerId = template.id.toLowerCase()
    const lowerLiquidCode = template.liquid_code.toLowerCase()
    
    // 1. Check section ID match (filename) - HIGHEST PRIORITY
    keywords.forEach(keyword => {
      // Direct match in ID (this handles both "testimonial" matching "testimonials" and vice versa)
      if (lowerId.includes(keyword)) {
        score += 30 // Very high score for direct ID match
      }
      
      // Also check if keyword is contained in ID (handles "testimonial" in "testimonials")
      // This is important because "testimonial" should match "testimonials-22"
      if (lowerId.includes(keyword) || keyword.includes(lowerId.split('-').find(p => p.includes(keyword)) || '')) {
        score += 30 // Already handled above, but ensure we catch it
      }
      
      // Handle plural/singular variations more aggressively
      const singular = keyword.replace(/s$/, '')
      const plural = keyword + 's'
      
      // Check if ID contains singular form (e.g., "testimonial" keyword matches "testimonials" in ID)
      if (lowerId.includes(singular) && singular.length > 2) {
        score += 25 // High score for singular match in plural ID
      }
      // Check if ID contains plural form (e.g., "testimonials" keyword matches "testimonials" in ID)
      if (lowerId.includes(plural) && plural.length > 2) {
        score += 25 // High score for plural match
      }
      
      // Special handling: if keyword is singular and ID contains plural (or vice versa)
      if (singular !== keyword && lowerId.includes(singular)) {
        score += 30 // Very high score for singular/plural match
      }
    })
    
    // 2. Check type match using inferred type
    const templateType = template.type.toLowerCase()
    Object.entries(sectionTypeMappings).forEach(([type, synonyms]) => {
      if (templateType === type) {
        // Check if any keyword matches synonyms
        keywords.forEach(keyword => {
          if (synonyms.some(syn => syn.includes(keyword) || keyword.includes(syn))) {
            score += 20 // High score for type match
          }
        })
        // Also check full input
        synonyms.forEach(synonym => {
          if (lowerInput.includes(synonym)) {
            score += 15
          }
        })
      }
    })
    
    // 3. Check name match
    const cleanName = cleanSectionName(template.name).toLowerCase()
    keywords.forEach(keyword => {
      if (cleanName.includes(keyword)) {
        score += 10
      }
    })
    
    // 4. Check liquid file content for keywords
    keywords.forEach(keyword => {
      // Search in liquid code (excluding schema to avoid false positives)
      const liquidWithoutSchema = lowerLiquidCode.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '')
      if (liquidWithoutSchema.includes(keyword)) {
        score += 8 // Medium score for content match
      }
    })
    
    // 5. Check description match
    const lowerDescription = template.description.toLowerCase()
    keywords.forEach(keyword => {
      if (lowerDescription.includes(keyword)) {
        score += 5
      }
    })
    
    return { template, score }
  })
  
  // Sort by score and return top results
  let results = scoredTemplates
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.template)
  
  // If no results found, try a more lenient search (partial matches)
  if (results.length === 0 && templates.length > 0) {
    console.log(`[findSectionsByNaturalLanguage] No exact matches, trying lenient search...`)
    
    // Try matching any part of the keyword in the ID
    const lenientResults = templates
      .map(template => {
        const lowerId = template.id.toLowerCase()
        let score = 0
        
        keywords.forEach(keyword => {
          // Very lenient: any substring match
          if (lowerId.includes(keyword) || keyword.includes(lowerId.split('-')[0])) {
            score += 5
          }
          // Check if keyword is in any part of the ID
          const idParts = lowerId.split('-')
          idParts.forEach(part => {
            if (part.includes(keyword) || keyword.includes(part)) {
              score += 3
            }
          })
        })
        
        return { template, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.template)
    
    if (lenientResults.length > 0) {
      console.log(`[findSectionsByNaturalLanguage] Lenient search found ${lenientResults.length} results`)
      results = lenientResults
    }
  }
  
  // Log for debugging
  if (results.length > 0) {
    console.log(`[findSectionsByNaturalLanguage] ✓ Found ${results.length} sections for "${input}":`, results.map(r => `${r.id} (type: ${r.type})`))
  } else {
    console.warn(`[findSectionsByNaturalLanguage] ✗ No sections found for "${input}"`)
    console.warn(`[findSectionsByNaturalLanguage] Total templates: ${templates.length}, Keywords: ${keywords.join(', ')}`)
    // Show sample IDs for debugging
    if (templates.length > 0) {
      const sampleIds = templates.slice(0, 10).map(t => t.id)
      console.warn(`[findSectionsByNaturalLanguage] Sample template IDs:`, sampleIds)
    }
  }
  
  return results
}

/**
 * Find template by ID or name (case-insensitive)
 */
export function findTemplateByIdOrName(idOrName: string): SectionTemplate | null {
  const templates = loadSectionTemplates()
  const lowerIdOrName = idOrName.toLowerCase().trim()
  
  // First try exact ID match
  let template = templates.find(t => t.id.toLowerCase() === lowerIdOrName)
  
  // If not found, try name match
  if (!template) {
    template = templates.find(t => t.name.toLowerCase() === lowerIdOrName)
  }
  
  // If still not found, try partial name match
  if (!template) {
    template = templates.find(t => 
      t.name.toLowerCase().includes(lowerIdOrName) ||
      lowerIdOrName.includes(t.name.toLowerCase())
    )
  }
  
  return template || null
}

/**
 * Generate schema tag from section variables
 */
export function generateSchemaTag(template: SectionTemplate): string {
  const settings: any[] = []
  
  // Ensure variables exist and is an object
  if (template.variables && typeof template.variables === 'object') {
    // Convert variables to schema settings
    for (const [key, variable] of Object.entries(template.variables)) {
      // Skip if variable is null or undefined
      if (!variable || typeof variable !== 'object') {
        continue
      }
      
      const setting: any = {
        type: mapVariableTypeToSchemaType(variable.type || 'text'),
        id: key,
        label: variable.label || key,
      }
      
      // Add default if provided and not empty string
      if (variable.default !== undefined && variable.default !== null && variable.default !== "") {
        // For color type, ensure it's a valid color format
        if (variable.type === "color" && typeof variable.default === "string") {
          setting.default = variable.default
        } else if (variable.type !== "color") {
          setting.default = variable.default
        }
      }
      
      // Add info/description if provided
      if (variable.description) {
        setting.info = variable.description
      }
      
      settings.push(setting)
    }
  }
  
  // Use cleaned name (without CUSTOM prefix)
  const cleanedName = cleanSectionName(template.name)
  
  // Generate presets array
  const presets = [
    {
      name: cleanedName
    }
  ]
  
  const schema = {
    name: cleanedName,
    tag: "section",
    class: "section",
    settings: settings,
    presets: presets
  }
  
  return `{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}`
}

/**
 * Map variable type to Shopify schema type
 */
function mapVariableTypeToSchemaType(variableType: string): string {
  switch (variableType.toLowerCase()) {
    case "color":
      return "color"
    case "textarea":
      return "textarea"
    case "text":
    default:
      return "text"
  }
}

/**
 * Generate section code from text input with references
 * Supports both natural language and explicit section references
 * Returns up to 6 sections for user selection (only from liquid files)
 */
export function generateSectionFromReferences(
  input: string, 
  excludedSectionIds: string[] = [],
  maxResults: number = 6
): Array<{ liquidCode: string; sectionId: string; previewImage?: string; name: string; description: string }> {
  // First, try to parse as explicit references (IDs or names)
  const explicitReferences = parseSectionReferences(input)
  const templates = loadSectionTemplates()
  const foundTemplates: SectionTemplate[] = []
  
  // Try to find sections by explicit references first
  for (const ref of explicitReferences) {
    const template = findTemplateByIdOrName(ref)
    if (template) {
      foundTemplates.push(template)
    }
  }
  
  // If no explicit references found or input looks like natural language, use NLP
  if (foundTemplates.length === 0 || (explicitReferences.length === 1 && explicitReferences[0].split(/\s+/).length > 2)) {
    console.log(`[generateSectionFromReferences] Using NLP search for: "${input}"`)
    const nlpResults = findSectionsByNaturalLanguage(input, 20) // Get more results to have options
    console.log(`[generateSectionFromReferences] NLP found ${nlpResults.length} results`)
    foundTemplates.push(...nlpResults)
  }
  
  // Remove duplicates and excluded sections
  const uniqueTemplates = Array.from(
    new Map(foundTemplates.map(t => [t.id, t])).values()
  ).filter(t => !excludedSectionIds.includes(t.id))
  
  if (uniqueTemplates.length === 0) {
    // Get all templates for better error message
    const allTemplates = loadSectionTemplates()
    const sampleIds = allTemplates.slice(0, 10).map(t => t.id).join(', ')
    throw new Error(`No sections found matching: "${input}". Total sections available: ${allTemplates.length}. Sample IDs: ${sampleIds}`)
  }
  
  // Select more templates initially to account for filtering
  const initialSelection = uniqueTemplates.slice(0, maxResults * 2)
  
  // Generate code for each selected template, filtering out any that fail
  const results: Array<{ liquidCode: string; sectionId: string; previewImage?: string; name: string; description: string }> = []
  
  for (const template of initialSelection) {
    // Stop if we have enough results
    if (results.length >= maxResults) {
      break
    }
    
    try {
      const codeResult = generateSectionCode(template)
      // Clean the name and description to remove CUSTOM prefix
      const cleanedName = cleanSectionName(template.name)
      const cleanedDescription = cleanSectionName(template.description)
      results.push({
        ...codeResult,
        name: cleanedName,
        description: cleanedDescription
      })
    } catch (error) {
      // Skip templates that don't have liquid files
      console.warn(`[generateSectionFromReferences] Skipping ${template.id}: ${error instanceof Error ? error.message : 'No liquid file'}`)
      continue
    }
  }
  
  if (results.length === 0) {
    // Try to get more results if we filtered everything out
    if (uniqueTemplates.length > initialSelection.length) {
      const additionalTemplates = uniqueTemplates.slice(initialSelection.length, initialSelection.length + maxResults * 2)
      for (const template of additionalTemplates) {
        if (results.length >= maxResults) {
          break
        }
        try {
          const codeResult = generateSectionCode(template)
          const cleanedName = cleanSectionName(template.name)
          results.push({
            ...codeResult,
            name: cleanedName,
            description: template.description
          })
        } catch (error) {
          continue
        }
      }
    }
    
    if (results.length === 0) {
      throw new Error(`No valid sections found matching: "${input}". All matching sections are missing liquid files. Try a different search term.`)
    }
  }
  
  return results
}

/**
 * Get the sections directory path from environment variable or use default
 */
function getSectionsDirectoryPath(): string {
  // Check for environment variable first (for deployment flexibility)
  if (process.env.SECTIONS_DIRECTORY_PATH) {
    return process.env.SECTIONS_DIRECTORY_PATH
  }
  
  // Try local sections folder first
  const localSectionsPath = path.join(process.cwd(), 'sections')
  if (fs.existsSync(localSectionsPath)) {
    return localSectionsPath
  }
  
  // Fallback to default path
  return '/Users/kram/Downloads/Updated theme 11-26-25/sections'
}

/**
 * Check if a corresponding .liquid file exists and return its content
 */
function getLiquidFileContent(sectionId: string): string | null {
  try {
    // Get the primary sections directory path
    const primaryPath = getSectionsDirectoryPath()
    
    // Try multiple possible paths where Liquid files might be located
    const possiblePaths = [
      // Local sections folder (highest priority)
      path.join(process.cwd(), 'sections'),
      // Primary path (from env var or default)
      primaryPath,
      // Alternative absolute paths (fallbacks)
      path.join('/Users', 'kram', 'Downloads', 'Updated theme 11-26-25', 'sections'),
      // Relative paths from current working directory (for different environments)
      path.join(process.cwd(), '..', '..', 'Downloads', 'Updated theme 11-26-25', 'sections'),
      path.join(process.cwd(), '..', 'sections'),
    ]
    
    // Remove duplicates
    const uniquePaths = Array.from(new Set(possiblePaths))
    
    console.log(`[getLiquidFileContent] Looking for ${sectionId}.liquid`)
    console.log(`[getLiquidFileContent] Current working directory: ${process.cwd()}`)
    console.log(`[getLiquidFileContent] Primary sections path: ${primaryPath}`)
    
    for (const sectionsPath of uniquePaths) {
      try {
        // Try exact match first
        let liquidFilePath = path.join(sectionsPath, `${sectionId}.liquid`)
        let normalizedPath = path.normalize(liquidFilePath)
        
        console.log(`[getLiquidFileContent] Checking: ${normalizedPath}`)
        
        if (fs.existsSync(normalizedPath)) {
          // Read and return the complete Liquid file content (includes schema)
          const content = fs.readFileSync(normalizedPath, 'utf-8')
          
          if (content && content.length > 0) {
            console.log(`[getLiquidFileContent] ✓ Found Liquid file for ${sectionId} at: ${normalizedPath}`)
            console.log(`[getLiquidFileContent] File size: ${content.length} characters`)
            return content
          } else {
            console.warn(`[getLiquidFileContent] File found but is empty: ${normalizedPath}`)
          }
        } else {
          // Try case-insensitive search if exact match fails
          // This handles cases where section ID might have different casing
          try {
            const files = fs.readdirSync(sectionsPath)
            const matchingFile = files.find(file => 
              file.toLowerCase() === `${sectionId}.liquid`.toLowerCase()
            )
            
            if (matchingFile) {
              const caseInsensitivePath = path.join(sectionsPath, matchingFile)
              const normalizedCasePath = path.normalize(caseInsensitivePath)
              console.log(`[getLiquidFileContent] Found case-insensitive match: ${normalizedCasePath}`)
              
              const content = fs.readFileSync(normalizedCasePath, 'utf-8')
              if (content && content.length > 0) {
                console.log(`[getLiquidFileContent] ✓ Found Liquid file for ${sectionId} at: ${normalizedCasePath}`)
                console.log(`[getLiquidFileContent] File size: ${content.length} characters`)
                return content
              }
            }
          } catch (dirError) {
            // Directory might not exist or not be readable, continue to next path
            console.warn(`[getLiquidFileContent] Cannot read directory ${sectionsPath}:`, dirError)
          }
        }
      } catch (pathError) {
        // Continue to next path if this one fails
        console.warn(`[getLiquidFileContent] Error checking path ${sectionsPath}:`, pathError)
        continue
      }
    }
    
    console.warn(`[getLiquidFileContent] ✗ Liquid file not found for ${sectionId}.liquid after checking ${uniquePaths.length} paths`)
    return null
  } catch (error) {
    console.error(`[getLiquidFileContent] Error checking for Liquid file ${sectionId}.liquid:`, error)
    return null
  }
}

/**
 * Generate liquid code for a single template
 * Only uses liquid files - ensures schema is always present
 */
function generateSectionCode(template: SectionTemplate): { liquidCode: string; sectionId: string; previewImage?: string } {
  let liquidCode = ''
  
  // Get liquid code from template
  if (template.liquid_code && template.liquid_code.trim().length > 0) {
    liquidCode = template.liquid_code
  } else {
    // Fallback: try to get liquid file directly from filesystem
    const liquidFileContent = getLiquidFileContent(template.id)
    if (liquidFileContent) {
      liquidCode = liquidFileContent
    } else {
      // Try alternative naming patterns (e.g., custom-testimonials-10 -> ss-testimonials-10)
      const alternativeIds = [
        template.id.replace(/^custom-/, 'ss-'),
        template.id.replace(/^ss-/, 'custom-'),
        template.id.replace(/^custom-/, ''),
      ]
      
      for (const altId of alternativeIds) {
        if (altId !== template.id) {
          const altContent = getLiquidFileContent(altId)
          if (altContent) {
            liquidCode = altContent
            break
          }
        }
      }
    }
  }
  
  if (!liquidCode || liquidCode.trim().length === 0) {
    throw new Error(`No liquid file found for section: ${template.id}. Only liquid files from the sections directory are supported.`)
  }
  
  // Check if schema exists in the liquid code
  const hasSchema = liquidCode.includes('{% schema %}') && liquidCode.includes('{% endschema %}')
  
  if (!hasSchema) {
    console.warn(`[generateSectionCode] ⚠ Liquid file for ${template.id} missing schema tags, generating schema from variables`)
    
    // Generate schema from template variables
    const schemaTag = generateSchemaTag(template)
    
    // Append schema to the end of the liquid code
    liquidCode = liquidCode.trim() + '\n\n' + schemaTag
    
    console.log(`[generateSectionCode] ✓ Added schema to ${template.id}`)
  } else {
    console.log(`[generateSectionCode] ✓ Using complete Liquid file for ${template.id} (${liquidCode.length} chars, includes schema)`)
  }
  
  return {
    liquidCode: liquidCode,
    sectionId: template.id,
    previewImage: template.preview_image
  }
}

/**
 * Load reference sections from the sections folder based on user input
 */
function loadReferenceSections(input: string, maxReferences: number = 3): string {
  try {
    const sectionsPath = getSectionsDirectoryPath()
    
    if (!fs.existsSync(sectionsPath)) {
      console.warn(`[Reference Sections] Sections directory not found at ${sectionsPath}`)
      return ''
    }

    const files = fs.readdirSync(sectionsPath)
    const liquidFiles = files.filter(file => file.endsWith('.liquid'))
    
    if (liquidFiles.length === 0) {
      return ''
    }

    // Extract keywords from input to find relevant sections
    const lowerInput = input.toLowerCase()
    const keywords = lowerInput
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5)

    // Score and rank sections by relevance
    const scoredFiles = liquidFiles.map(file => {
      const lowerFile = file.toLowerCase()
      let score = 0
      
      keywords.forEach(keyword => {
        if (lowerFile.includes(keyword)) {
          score += 10
        }
        // Check for partial matches
        if (keyword.length > 3 && lowerFile.includes(keyword.substring(0, 3))) {
          score += 5
        }
      })
      
      return { file, score }
    })

    // Sort by score and get top matches
    const topFiles = scoredFiles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxReferences)
      .map(item => item.file)

    // If no matches found, use random samples
    if (topFiles.length === 0) {
      topFiles.push(...liquidFiles.slice(0, maxReferences))
    }

    // Load and format reference sections
    const references: string[] = []
    for (const file of topFiles) {
      try {
        const filePath = path.join(sectionsPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Truncate very long sections (keep first 1500 chars to reduce token usage)
        const truncatedContent = content.length > 1500 
          ? content.substring(0, 1500) + '\n... (truncated)'
          : content
        
        references.push(`\n--- Reference Section: ${file} ---\n${truncatedContent}`)
      } catch (error) {
        console.warn(`[Reference Sections] Error loading ${file}:`, error)
      }
    }

    if (references.length > 0) {
      return `\n\nHere are some example sections from the existing library for reference:\n${references.join('\n\n')}`
    }

    return ''
  } catch (error) {
    console.error('[Reference Sections] Error loading reference sections:', error)
    return ''
  }
}

/**
 * Retry fetch with exponential backoff for rate limiting
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options)
    
    // If 429 (Too Many Requests), retry with exponential backoff
    if (response.status === 429 && attempt < maxRetries - 1) {
      // Longer delays: 2s, 4s, 8s, 16s, 32s
      const delay = baseDelay * Math.pow(2, attempt)
      const delaySeconds = Math.floor(delay / 1000)
      console.log(`[AI Generator] Rate limited (429), waiting ${delaySeconds}s before retry (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    
    return response
  }
  
  // Final attempt
  return await fetch(url, options)
}

/**
 * LLM Provider types
 */
type LLMProvider = 'groq' | 'openrouter' | 'together' | 'gemini' | 'huggingface'

/**
 * Get LLM provider from environment or default to Groq (free and fast)
 */
function getLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase() as LLMProvider
  const validProviders: LLMProvider[] = ['groq', 'openrouter', 'together', 'gemini', 'huggingface']
  return validProviders.includes(provider) ? provider : 'groq'
}

/**
 * Get list of providers to try (with fallback)
 * Supports comma-separated list: LLM_PROVIDER=groq,openrouter,together
 */
function getLLMProviders(): LLMProvider[] {
  const providerEnv = process.env.LLM_PROVIDER || 'groq'
  const providers = providerEnv.split(',').map(p => p.trim().toLowerCase() as LLMProvider)
  const validProviders: LLMProvider[] = ['groq', 'openrouter', 'together', 'gemini', 'huggingface']
  
  // Filter to only valid providers
  const valid = providers.filter(p => validProviders.includes(p))
  
  // If none valid, default to groq
  return valid.length > 0 ? valid : ['groq']
}

/**
 * Get API key for a specific provider from comma-separated AI_API_KEY
 * Supports multiple API keys: AI_API_KEY=gsk_...,sk-or-v1-...,hf_...
 * Keys are identified by prefix:
 * - gsk_ = Groq
 * - sk-or-v1- = OpenRouter
 * - hf_ = Hugging Face
 * - Together and Gemini use their own keys or fallback to first key
 */
function getAPIKeyForProvider(provider: LLMProvider): string | null {
  const apiKeysEnv = process.env.AI_API_KEY
  if (!apiKeysEnv) {
    return null
  }

  // Split by comma and trim
  const apiKeys = apiKeysEnv.split(',').map(key => key.trim()).filter(key => key.length > 0)

  // Try to match by prefix
  for (const key of apiKeys) {
    switch (provider) {
      case 'groq':
        if (key.startsWith('gsk_')) {
          console.log(`[getAPIKeyForProvider] Groq: Found key (length: ${key.length})`)
          return key
        }
        break
      case 'openrouter':
        if (key.startsWith('sk-or-v1-')) {
          console.log(`[getAPIKeyForProvider] OpenRouter: Found key (length: ${key.length})`)
          return key
        }
        break
      case 'huggingface':
        if (key.startsWith('hf_')) {
          console.log(`[getAPIKeyForProvider] HuggingFace: Found key (length: ${key.length})`)
          return key
        }
        break
      case 'together':
        // Together AI keys are typically long alphanumeric strings (64+ chars) without specific prefixes
        // Check if it's a Together key by length and that it doesn't match other known patterns
        if (!key.startsWith('gsk_') && !key.startsWith('sk-or-v1-') && !key.startsWith('hf_') && key.length >= 40) {
          // Together keys are usually 64+ characters, prioritize longer keys
          console.log(`[getAPIKeyForProvider] Together: Found potential key (length: ${key.length})`)
          return key
        }
        break
      case 'gemini':
        // Gemini keys are typically very long (100+ chars) alphanumeric strings
        // Check last to avoid conflicts with Together
        if (!key.startsWith('gsk_') && !key.startsWith('sk-or-v1-') && !key.startsWith('hf_') && key.length >= 100) {
          console.log(`[getAPIKeyForProvider] Gemini: Found key (length: ${key.length})`)
          return key
        }
        break
    }
  }

  // Fallback: if no specific match found, try to match by position or use appropriate key
  // This handles cases where keys might be in a different format
  if (apiKeys.length > 0) {
    // Get list of providers to match by position if possible
    const providers = getLLMProviders()
    const providerIndex = providers.indexOf(provider)
    
    // If we can match by position and the key exists at that position, use it
    if (providerIndex >= 0 && providerIndex < apiKeys.length) {
      const keyAtPosition = apiKeys[providerIndex]
      // Only use it if it doesn't match other known patterns (to avoid conflicts)
      if (!keyAtPosition.startsWith('gsk_') && !keyAtPosition.startsWith('sk-or-v1-') && !keyAtPosition.startsWith('hf_')) {
        console.log(`[getAPIKeyForProvider] Using key at position ${providerIndex} for ${provider}`)
        return keyAtPosition
      }
    }
    
    // Otherwise, find the first key that doesn't match known patterns
    for (const key of apiKeys) {
      if (!key.startsWith('gsk_') && !key.startsWith('sk-or-v1-') && !key.startsWith('hf_')) {
        console.warn(`[getAPIKeyForProvider] No specific key found for ${provider}, using first non-matching key`)
        return key
      }
    }
    
    // Last resort: use first key
    console.warn(`[getAPIKeyForProvider] No specific key found for ${provider}, using first available key`)
    return apiKeys[0]
  }

  return null
}

/**
 * Get model name for a specific provider from AI_MODEL environment variable
 * Handles comma-separated model lists and selects the appropriate model for each provider
 */
function getModelForProvider(provider: LLMProvider): string {
  const modelEnv = process.env.AI_MODEL
  if (!modelEnv) {
    // Return provider-specific defaults (using more accessible models)
    switch (provider) {
      case 'groq':
        // Use llama-3.1-8b-instant as it's more commonly available
        return 'llama-3.1-8b-instant'
      case 'openrouter':
        // Use a model that definitely exists on OpenRouter
        return 'meta-llama/llama-3.1-8b-instruct:free'
      case 'together':
        return 'meta-llama/Llama-3-70b-chat-hf'
      case 'huggingface':
        return 'meta-llama/Meta-Llama-3-70B-Instruct'
      case 'gemini':
        return 'gemini-2.0-flash-exp'
      default:
        return 'llama-3.1-8b-instant'
    }
  }

  // Split by comma or space, then trim and filter
  const models = modelEnv
    .split(/[,\s]+/)
    .map(m => m.trim())
    .filter(m => m.length > 0 && !m.match(/^(and|or|,)$/i))

  // Collect matching models for each provider, then select the best one
  const groqModels: string[] = []
  const openRouterModels: string[] = []
  const togetherModels: string[] = []
  const huggingFaceModels: string[] = []
  const geminiModels: string[] = []
  
  for (const model of models) {
    const lowerModel = model.toLowerCase()
    
    // Groq models: llama-3.1-70b-instruct, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma-7b-it
    if (lowerModel.includes('llama-3.1') || lowerModel.includes('mixtral') || lowerModel.includes('gemma')) {
      // Remove any provider prefix (e.g., "meta-llama/") and any suffix (e.g., ":free")
      let cleanModel = model.replace(/^[^\/]+\//, '').split(':')[0].trim()
      // Ensure it's a valid Groq model format (no slashes)
      if (!cleanModel.includes('/')) {
        groqModels.push(cleanModel)
      }
    }
    
    // OpenRouter models: meta-llama/llama-3.1-70b-instruct:free
    if (lowerModel.includes('meta-llama') && (lowerModel.includes(':free') || lowerModel.includes('openrouter'))) {
      openRouterModels.push(model)
    }
    
    // Together models: meta-llama/Llama-3-70b-chat-hf
    if (lowerModel.includes('llama-3') || lowerModel.includes('together')) {
      togetherModels.push(model)
    }
    
    // Hugging Face models: meta-llama/Meta-Llama-3-70B-Instruct
    if (lowerModel.includes('meta-llama') && !lowerModel.includes(':free') && !lowerModel.includes('openrouter')) {
      huggingFaceModels.push(model)
    }
    
    // Gemini models: gemini-2.0-flash-exp
    if (lowerModel.includes('gemini')) {
      geminiModels.push(model)
    }
  }
  
  // Select the best model for the provider (prefer more accessible models)
  let selectedModel: string | null = null
  switch (provider) {
    case 'groq':
      // Prefer 8b-instant (more accessible) over 70b-instruct
      selectedModel = groqModels.find(m => m.includes('8b-instant')) || 
                     groqModels.find(m => m.includes('8b')) || 
                     groqModels[0] || null
      if (selectedModel) {
        console.log(`[getModelForProvider] Groq: Found ${groqModels.length} models, selected: ${selectedModel}`)
        return selectedModel
      }
      break
    case 'openrouter':
      // Prefer 8b models over 70b (more accessible)
      selectedModel = openRouterModels.find(m => m.toLowerCase().includes('8b')) || 
                     openRouterModels[0] || null
      if (selectedModel) {
        console.log(`[getModelForProvider] OpenRouter: Found ${openRouterModels.length} models, selected: ${selectedModel}`)
        return selectedModel
      }
      break
    case 'together':
      selectedModel = togetherModels[0] || null
      if (selectedModel) {
        console.log(`[getModelForProvider] Together: Found ${togetherModels.length} models, selected: ${selectedModel}`)
        return selectedModel
      }
      break
    case 'huggingface':
      selectedModel = huggingFaceModels[0] || null
      if (selectedModel) {
        console.log(`[getModelForProvider] HuggingFace: Found ${huggingFaceModels.length} models, selected: ${selectedModel}`)
        return selectedModel
      }
      break
    case 'gemini':
      selectedModel = geminiModels[0] || null
      if (selectedModel) {
        console.log(`[getModelForProvider] Gemini: Found ${geminiModels.length} models, selected: ${selectedModel}`)
        return selectedModel
      }
      break
  }

  // If no match found, use provider-specific defaults (using more accessible models)
  const defaultModel = (() => {
    switch (provider) {
      case 'groq':
        // Use llama-3.1-8b-instant as it's more commonly available
        return 'llama-3.1-8b-instant'
      case 'openrouter':
        // Use a model that definitely exists on OpenRouter
        return 'meta-llama/llama-3.1-8b-instruct:free'
      case 'together':
        return 'meta-llama/Llama-3-70b-chat-hf'
      case 'huggingface':
        return 'meta-llama/Meta-Llama-3-70B-Instruct'
      case 'gemini':
        return 'gemini-2.0-flash-exp'
      default:
        return models[0] || 'llama-3.1-8b-instant'
    }
  })()
  console.log(`[getModelForProvider] ${provider}: No matching model found in AI_MODEL, using default: ${defaultModel}`)
  return defaultModel
}

/**
 * Generate with Groq (Free, Fast, No Rate Limits)
 * Get API key: https://console.groq.com/
 */
async function generateWithGroq(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  // Updated to currently supported Groq models
  // Available models: llama-3.1-70b-instruct, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma-7b-it
  const model = getModelForProvider('groq')
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Generate with OpenRouter (Free models available)
 * Get API key: https://openrouter.ai/
 */
async function generateWithOpenRouter(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = getModelForProvider('openrouter')
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Shopify Section Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Generate with Together AI (Free tier available)
 * Get API key: https://together.ai/
 */
async function generateWithTogether(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = getModelForProvider('together')
  const url = 'https://api.together.xyz/v1/chat/completions'
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Together AI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Generate with Hugging Face (Free Inference API)
 * Get API key: https://huggingface.co/settings/tokens
 */
async function generateWithHuggingFace(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = getModelForProvider('huggingface')
  
  // Try router API endpoint first (new format)
  const url = `https://router.huggingface.co/hf-inference/models/${model}`
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: `${systemPrompt}\n\n${userPrompt}`,
      parameters: {
        temperature: 0.7,
        max_new_tokens: 4000,
        return_full_text: false,
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Hugging Face API error: ${response.status} - ${errorText}`
    
    // 403 errors indicate permission issues - provide clearer message
    if (response.status === 403) {
      errorMessage = `Hugging Face API permission error (403): ${errorText}. Please verify your token has 'Inference API' permissions enabled in your Hugging Face account settings.`
    }
    
    // If 404, the endpoint format might be wrong - try alternative format
    if (response.status === 404) {
      console.warn(`[Hugging Face] Router API returned 404, endpoint format may be incorrect`)
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  // Hugging Face returns array or object with generated_text
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text
  }
  if (data.generated_text) {
    return data.generated_text
  }
  return ''
}

/**
 * Generate with Google Gemini (original implementation)
 */
async function generateWithGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
  const model = getModelForProvider('gemini')
  
  const response = await fetchWithRetry(`${apiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        topP: 0.95,
        topK: 40,
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AI Generator] API Error:', errorText)
    
    if (response.status === 429) {
      let errorDetails = 'Rate limit exceeded'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorDetails = errorData.error.message
        }
      } catch (e) {
        // Use default message
      }
      throw new Error(`Rate limit exceeded. ${errorDetails}. Please wait 30-60 seconds before trying again, or check your Gemini API quota.`)
    }
    
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.error) {
    console.error('[AI Generator] API Error in response:', data.error)
    throw new Error(data.error.message || 'API returned an error')
  }
  
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!responseText) {
    console.error('[AI Generator] Unexpected response format:', JSON.stringify(data, null, 2))
    throw new Error('No response from AI. Please try again.')
  }
  
  return responseText
}

/**
 * Generate Shopify liquid section using AI (supports multiple free LLM providers)
 */
export async function generateSectionWithAI(
  input: string,
  maxResults: number = 6
): Promise<Array<{ liquidCode: string; sectionId: string; previewImage?: string; name: string; description: string }>> {
  const providers = getLLMProviders()
  
  // Check if at least one API key is configured
  const apiKeysEnv = process.env.AI_API_KEY
  if (!apiKeysEnv) {
    throw new Error(`AI API key not configured. Please set AI_API_KEY environment variable. Trying providers: ${providers.join(', ')}`)
  }

  // Load reference sections from the sections folder (reduced to 1 to save tokens and avoid rate limits)
  const referenceSections = loadReferenceSections(input, 1)
  console.log(`[AI Generator] Loaded ${referenceSections ? 'reference sections' : 'no reference sections'} for context`)

  const systemPrompt = `You are an expert Shopify theme developer. Generate complete Shopify liquid section files based on user descriptions.

Requirements:
1. Generate valid Shopify liquid code with proper syntax
2. Include a complete {% schema %} block at the end with:
   - name: A descriptive section name
   - tag: "section"
   - class: "section"
   - settings: Array of customizable settings (text, textarea, color, etc.)
   - presets: Array with at least one preset
3. Use modern, responsive HTML/CSS
4. Include proper Shopify liquid tags and filters
5. Make sections customizable through schema settings
6. Use semantic HTML and accessible markup
7. Include inline styles or CSS classes for styling
8. Follow the style and patterns from the reference sections provided${referenceSections ? ' (if any)' : ''}

Generate ${maxResults} different variations of the requested section. Each variation should be unique but match the user's description. Return ONLY valid liquid code for each section, nothing else.`

  const userPrompt = `Generate ${maxResults} Shopify liquid section variations for: "${input}"

Each section should be complete with:
- HTML/Liquid markup
- Inline CSS or classes for styling
- Complete {% schema %} block with settings
- Responsive design
- Modern, professional appearance${referenceSections ? '\n\nUse the reference sections below as style guides and examples of proper Shopify liquid section structure:' : ''}

Return each section as a separate complete liquid file.${referenceSections}`

  try {
    const providers = getLLMProviders()
    console.log(`[AI Generator] Trying providers in order: ${providers.join(', ').toUpperCase()}`)
    
    let responseText: string | null = null
    let lastError: Error | null = null
    const attemptedProviders: string[] = []
    const failedProviders: Array<{ provider: string; error: string }> = []
    
    // Try each provider in order until one succeeds
    for (const provider of providers) {
      try {
        attemptedProviders.push(provider)
        console.log(`[AI Generator] Attempting with ${provider.toUpperCase()} for: "${input}"`)
        
        // Get the correct API key for this provider
        const apiKey = getAPIKeyForProvider(provider)
        if (!apiKey) {
          const errorMsg = `No API key found for ${provider}`
          console.warn(`[AI Generator] ${errorMsg}, skipping`)
          failedProviders.push({ provider, error: errorMsg })
          continue
        }
        
        switch (provider) {
          case 'groq':
            responseText = await generateWithGroq(apiKey, systemPrompt, userPrompt)
            break
          case 'openrouter':
            responseText = await generateWithOpenRouter(apiKey, systemPrompt, userPrompt)
            break
          case 'together':
            responseText = await generateWithTogether(apiKey, systemPrompt, userPrompt)
            break
          case 'huggingface':
            responseText = await generateWithHuggingFace(apiKey, systemPrompt, userPrompt)
            break
          case 'gemini':
            responseText = await generateWithGemini(apiKey, systemPrompt, userPrompt)
            break
          default:
            throw new Error(`Unknown provider: ${provider}`)
        }

        if (responseText && responseText.trim().length > 0) {
          console.log(`[AI Generator] ✓ Success with ${provider.toUpperCase()}`)
          break
        } else {
          throw new Error('Empty response from provider')
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error'
        console.warn(`[AI Generator] ✗ ${provider.toUpperCase()} failed: ${errorMsg}`)
        failedProviders.push({ provider, error: errorMsg })
        lastError = error
        // Continue to next provider
        continue
      }
    }

    if (!responseText || responseText.trim().length === 0) {
      let errorMsg = 'All providers failed. '
      
      if (failedProviders.length > 0) {
        const failures = failedProviders.map(f => `${f.provider.toUpperCase()}: ${f.error}`).join('; ')
        errorMsg += `Attempted: ${attemptedProviders.join(', ').toUpperCase()}. Errors: ${failures}`
      } else if (lastError) {
        errorMsg += `Last error: ${lastError.message}`
      } else {
        errorMsg += 'No response from any AI provider. Please try again.'
      }
      
      throw new Error(errorMsg)
    }

    console.log(`[AI Generator] Received response (${responseText.length} chars)`)

    // Parse the response to extract individual sections
    const sections = parseAIGeneratedSections(responseText, input)
    
    if (sections.length === 0) {
      throw new Error('Failed to parse AI-generated sections. Please try again.')
    }

    console.log(`[AI Generator] Successfully generated ${sections.length} sections`)
    return sections.slice(0, maxResults)
  } catch (error: any) {
    console.error('[AI Generator] Error:', error)
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Save generated section to the sections folder
 */
function saveSectionToFolder(sectionId: string, liquidCode: string): void {
  try {
    const sectionsPath = getSectionsDirectoryPath()
    
    // Ensure the sections directory exists
    if (!fs.existsSync(sectionsPath)) {
      console.warn(`[saveSectionToFolder] Sections directory not found at ${sectionsPath}, creating it...`)
      fs.mkdirSync(sectionsPath, { recursive: true })
    }
    
    const filePath = path.join(sectionsPath, `${sectionId}.liquid`)
    
    // Write the liquid code to the file
    fs.writeFileSync(filePath, liquidCode, 'utf-8')
    console.log(`[saveSectionToFolder] ✓ Saved section ${sectionId} to ${filePath}`)
  } catch (error) {
    console.error(`[saveSectionToFolder] Error saving section ${sectionId}:`, error)
    throw error
  }
}

/**
 * Parse AI-generated response into individual sections
 */
function parseAIGeneratedSections(response: string, input: string): Array<{ liquidCode: string; sectionId: string; previewImage?: string; name: string; description: string }> {
  const sections: Array<{ liquidCode: string; sectionId: string; previewImage?: string; name: string; description: string }> = []
  
  // Try to split by common delimiters
  const delimiters = [
    /(?:^|\n\n)(?=.*?{%\s*schema\s*%})/gm, // Sections with schema blocks
    /(?:^|\n\n)(?=.*?<div)/gm, // Sections starting with div
    /(?:^|\n\n)(?=.*?<section)/gm, // Sections starting with section
  ]

  let parts: string[] = []
  
  // Try each delimiter
  for (const delimiter of delimiters) {
    const matches = response.split(delimiter).filter(p => p.trim().length > 0)
    if (matches.length > 1) {
      parts = matches
      break
    }
  }

  // If no clear delimiter found, treat entire response as one section
  if (parts.length === 0) {
    parts = [response]
  }

  // Process each part
  for (let i = 0; i < parts.length; i++) {
    let liquidCode = parts[i].trim()
    
    // Remove markdown code blocks if present
    liquidCode = liquidCode.replace(/^```(?:liquid|html)?\n?/gm, '').replace(/\n?```$/gm, '')
    liquidCode = liquidCode.trim()

    // Ensure it has schema
    if (!liquidCode.includes('{% schema %}')) {
      // Try to extract schema from the code or generate a basic one
      const schemaMatch = liquidCode.match(/{%\s*endschema\s*%}/)
      if (!schemaMatch) {
        // Add a basic schema if missing
        const sectionName = extractSectionNameFromCode(liquidCode) || `Generated Section ${i + 1}`
        const basicSchema = generateBasicSchema(sectionName)
        liquidCode += '\n\n' + basicSchema
      }
    }

    // Extract section name from schema or generate one
    const schema = extractSchemaFromLiquid(liquidCode)
    const sectionName = schema?.name || extractSectionNameFromCode(liquidCode) || `Generated Section ${i + 1}`
    // Clean the section name to remove SS- prefix
    const cleanedSectionName = cleanSectionName(sectionName)
    const sectionId = generateSectionId(cleanedSectionName, i)
    const description = `AI-generated section: ${input}`

    if (liquidCode.length > 100) { // Only add if it's substantial
      // Update schema name to use cleaned name (remove SS-)
      if (schema && schema.name && schema.name !== cleanedSectionName) {
        // Replace the name in the schema JSON
        const schemaRegex = /{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/
        const schemaMatch = liquidCode.match(schemaRegex)
        if (schemaMatch) {
          try {
            const schemaJson = JSON.parse(schemaMatch[1])
            schemaJson.name = cleanedSectionName
            const updatedSchema = `{% schema %}\n${JSON.stringify(schemaJson, null, 2)}\n{% endschema %}`
            liquidCode = liquidCode.replace(schemaRegex, updatedSchema)
          } catch (e) {
            // If JSON parsing fails, try simple string replacement
            liquidCode = liquidCode.replace(
              /"name"\s*:\s*"[^"]*"/,
              `"name": "${cleanedSectionName.replace(/"/g, '\\"')}"`
            )
          }
        }
      }
      
      // Save to sections folder
      try {
        saveSectionToFolder(sectionId, liquidCode)
      } catch (error) {
        console.warn(`[parseAIGeneratedSections] Failed to save section ${sectionId} to folder:`, error)
        // Continue even if save fails
      }
      
      sections.push({
        liquidCode,
        sectionId,
        name: cleanedSectionName,
        description,
      })
    }
  }

  return sections
}

/**
 * Extract section name from liquid code
 */
function extractSectionNameFromCode(code: string): string | null {
  const schema = extractSchemaFromLiquid(code)
  if (schema?.name) {
    return schema.name
  }
  
  // Try to find a heading or title
  const headingMatch = code.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i)
  if (headingMatch) {
    return headingMatch[1].trim()
  }
  
  return null
}

/**
 * Generate a basic schema for a section
 */
function generateBasicSchema(sectionName: string): string {
  return `{% schema %}
{
  "name": "${sectionName}",
  "tag": "section",
  "class": "section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "${sectionName}"
    }
  ],
  "presets": [
    {
      "name": "${sectionName}"
    }
  ]
}
{% endschema %}`
}

/**
 * Generate a unique section ID from name and index
 */
function generateSectionId(name: string, index: number): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
  
  return `ai-generated-${cleanName}-${index + 1}`
}

