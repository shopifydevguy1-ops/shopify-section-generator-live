// Section Generator Logic
// Loads sections from JSON files in /section-library

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
 * Load all section templates from the section-library directory
 * This function should only be called server-side (in API routes)
 */
export function loadSectionTemplates(): SectionTemplate[] {
  try {
    const sectionLibraryPath = path.join(process.cwd(), 'section-library')
    
    if (!fs.existsSync(sectionLibraryPath)) {
      console.warn('Section library directory not found. Using default templates.')
      return getDefaultTemplates()
    }

    const files = fs.readdirSync(sectionLibraryPath)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    console.log(`Found ${jsonFiles.length} JSON files in section-library`)
    
    const templates: SectionTemplate[] = []
    let loadedCount = 0
    let errorCount = 0
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(sectionLibraryPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const template = JSON.parse(content) as SectionTemplate
        
        // Validate template has required fields
        if (!template.id || !template.liquid_code) {
          console.warn(`Skipping ${file}: missing required fields (id or liquid_code)`)
          errorCount++
          continue
        }
        
        templates.push(template)
        loadedCount++
      } catch (error) {
        console.error(`Error loading template from ${file}:`, error)
        errorCount++
      }
    }
    
    console.log(`Loaded ${loadedCount} templates successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`)
    
    // If no templates found, return defaults
    if (templates.length === 0) {
      console.warn('No templates loaded, using default templates')
      return getDefaultTemplates()
    }
    
    return templates
  } catch (error) {
    console.error('Error loading section templates:', error)
    return getDefaultTemplates()
  }
}

/**
 * Get default templates if section-library is empty
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
 * Clean section name by removing "CUSTOM" prefix
 */
export function cleanSectionName(name: string): string {
  return name.replace(/^CUSTOM\s+/i, '').trim()
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
  const lowerInput = input.toLowerCase()
  
  // Extract keywords from input
  const keywords = lowerInput
    .split(/\s+/)
    .filter(word => word.length > 2)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0)
  
  // Score each template based on relevance
  const scoredTemplates = templates.map(template => {
    let score = 0
    
    // Check name match
    const cleanName = cleanSectionName(template.name).toLowerCase()
    if (cleanName.includes(lowerInput) || lowerInput.includes(cleanName)) {
      score += 10
    }
    
    // Check keyword matches in name
    keywords.forEach(keyword => {
      if (cleanName.includes(keyword)) {
        score += 5
      }
    })
    
    // Check description match
    const lowerDescription = template.description.toLowerCase()
    if (lowerDescription.includes(lowerInput)) {
      score += 8
    }
    keywords.forEach(keyword => {
      if (lowerDescription.includes(keyword)) {
        score += 3
      }
    })
    
    // Check tag matches
    template.tags.forEach(tag => {
      const lowerTag = tag.toLowerCase()
      if (lowerTag === lowerInput) {
        score += 10
      } else if (lowerTag.includes(lowerInput) || lowerInput.includes(lowerTag)) {
        score += 7
      }
      keywords.forEach(keyword => {
        if (lowerTag.includes(keyword) || keyword.includes(lowerTag)) {
          score += 4
        }
      })
    })
    
    // Check type match
    if (template.type.toLowerCase().includes(lowerInput) || lowerInput.includes(template.type.toLowerCase())) {
      score += 6
    }
    
    // Common section type mappings
    const sectionTypeMappings: Record<string, string[]> = {
      'hero': ['hero', 'banner', 'landing', 'header', 'intro'],
      'product': ['product', 'shop', 'catalog', 'item', 'merchandise'],
      'collection': ['collection', 'category', 'group', 'set'],
      'testimonial': ['testimonial', 'review', 'feedback', 'rating', 'quote'],
      'faq': ['faq', 'question', 'answer', 'help', 'support'],
      'form': ['form', 'contact', 'submit', 'input', 'field'],
      'gallery': ['gallery', 'image', 'photo', 'picture', 'media'],
      'video': ['video', 'youtube', 'vimeo', 'media'],
      'slider': ['slider', 'carousel', 'slideshow', 'swiper'],
      'countdown': ['countdown', 'timer', 'clock', 'deadline'],
      'trust': ['trust', 'badge', 'security', 'guarantee', 'certificate'],
      'social': ['social', 'share', 'facebook', 'twitter', 'instagram'],
      'newsletter': ['newsletter', 'email', 'subscribe', 'signup'],
      'blog': ['blog', 'article', 'post', 'news'],
      'footer': ['footer', 'bottom', 'links'],
      'header': ['header', 'nav', 'navigation', 'menu'],
    }
    
    // Check type mappings
    Object.entries(sectionTypeMappings).forEach(([type, synonyms]) => {
      if (template.type.toLowerCase() === type) {
        synonyms.forEach(synonym => {
          if (lowerInput.includes(synonym)) {
            score += 5
          }
        })
      }
    })
    
    // Check for specific feature keywords
    const featureKeywords: Record<string, string[]> = {
      'animated': ['animated', 'animation', 'moving', 'dynamic'],
      'interactive': ['interactive', 'click', 'hover', 'effect'],
      'responsive': ['responsive', 'mobile', 'tablet', 'desktop'],
      'customizable': ['custom', 'customizable', 'configurable', 'settings'],
    }
    
    Object.entries(featureKeywords).forEach(([feature, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerInput.includes(keyword)) {
          if (template.tags.some(tag => tag.toLowerCase().includes(feature))) {
            score += 3
          }
        }
      })
    })
    
    return { template, score }
  })
  
  // Sort by score and return top results
  return scoredTemplates
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.template)
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
  
  // Convert variables to schema settings
  for (const [key, variable] of Object.entries(template.variables)) {
    const setting: any = {
      type: mapVariableTypeToSchemaType(variable.type),
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
  
  // Use cleaned name (without CUSTOM prefix)
  const cleanedName = cleanSectionName(template.name)
  
  const schema = {
    name: cleanedName,
    tag: "section",
    class: "section",
    settings: settings
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
 * Returns only 1 section, excluding previously generated sections
 */
export function generateSectionFromReferences(
  input: string, 
  excludedSectionIds: string[] = []
): { liquidCode: string; sectionId: string } {
  // First, try to parse as explicit references (IDs or names)
  const explicitReferences = parseSectionReferences(input)
  const templates = loadSectionTemplates()
  const notFound: string[] = []
  const foundTemplates: SectionTemplate[] = []
  
  // Try to find sections by explicit references first
  for (const ref of explicitReferences) {
    const template = findTemplateByIdOrName(ref)
    if (template) {
      foundTemplates.push(template)
    } else {
      notFound.push(ref)
    }
  }
  
  // If no explicit references found or input looks like natural language, use NLP
  if (foundTemplates.length === 0 || (explicitReferences.length === 1 && explicitReferences[0].split(/\s+/).length > 2)) {
    const nlpResults = findSectionsByNaturalLanguage(input, 10) // Get more results to have options
    foundTemplates.push(...nlpResults)
  }
  
  // Remove duplicates and excluded sections
  const uniqueTemplates = Array.from(
    new Map(foundTemplates.map(t => [t.id, t])).values()
  ).filter(t => !excludedSectionIds.includes(t.id))
  
  if (uniqueTemplates.length === 0) {
    // If all sections are excluded, reset and try again without exclusions
    const allTemplates = Array.from(
      new Map(foundTemplates.map(t => [t.id, t])).values()
    )
    if (allTemplates.length === 0) {
      throw new Error(`No sections found matching: "${input}". Try being more specific or use section IDs.`)
    }
    // Use all templates if we've exhausted the excluded ones
    const selectedTemplate = allTemplates[Math.floor(Math.random() * allTemplates.length)]
    return generateSectionCode(selectedTemplate)
  }
  
  // Select one random template from the available ones
  const selectedTemplate = uniqueTemplates[Math.floor(Math.random() * uniqueTemplates.length)]
  
  return generateSectionCode(selectedTemplate)
}

/**
 * Generate liquid code for a single template
 */
function generateSectionCode(template: SectionTemplate): { liquidCode: string; sectionId: string } {
  // Generate liquid code with default values
  let liquidCode = template.liquid_code
  
  // Check if liquid_code uses {{variable}} placeholders or section.settings directly
  const usesPlaceholders = liquidCode.includes('{{') && !liquidCode.includes('section.settings')
  
  if (usesPlaceholders) {
    // Replace all variables with their default values
    for (const [key, variable] of Object.entries(template.variables)) {
      const placeholder = `{{${key}}}`
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const defaultValue = variable.default !== undefined && variable.default !== null 
        ? String(variable.default) 
        : ""
      liquidCode = liquidCode.replace(regex, defaultValue)
    }
  }
  // If liquid_code already uses section.settings, no replacement needed
  
  // Generate schema tag
  const schemaTag = generateSchemaTag(template)
  
  // Combine liquid code and schema
  const fullCode = `${liquidCode}\n\n${schemaTag}`
  
  return {
    liquidCode: fullCode,
    sectionId: template.id
  }
}

