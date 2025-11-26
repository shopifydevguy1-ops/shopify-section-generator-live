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
  
  const schema = {
    name: template.name,
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
 */
export function generateSectionFromReferences(input: string): string {
  const references = parseSectionReferences(input)
  const templates = loadSectionTemplates()
  const sections: string[] = []
  const notFound: string[] = []
  
  for (const ref of references) {
    const template = findTemplateByIdOrName(ref)
    
    if (!template) {
      notFound.push(ref)
      continue
    }
    
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
    sections.push(`${liquidCode}\n\n${schemaTag}`)
  }
  
  // If no sections found, throw error with helpful message
  if (sections.length === 0) {
    if (notFound.length > 0) {
      throw new Error(`No valid sections found. Could not find: ${notFound.join(', ')}. Please check your section references.`)
    }
    throw new Error("No valid sections found. Please check your section references.")
  }
  
  // If some sections not found, log warning but continue
  if (notFound.length > 0) {
    console.warn(`Some sections not found: ${notFound.join(', ')}`)
  }
  
  // If multiple sections, join them with separators
  if (sections.length > 1) {
    return sections.join("\n\n{% comment %} --- Next Section --- {% endcomment %}\n\n")
  }
  
  return sections[0]
}

