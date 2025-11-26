/**
 * Utility functions for converting Liquid code to previewable HTML
 */

/**
 * Extract HTML from Liquid code for preview
 * This function processes Liquid code and converts it to renderable HTML
 */
export function liquidToPreviewHtml(liquidCode: string): string {
  let html = liquidCode

  // Remove schema tags (they don't render)
  html = html.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '')
  
  // Remove comment tags
  html = html.replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/gi, '')
  html = html.replace(/{%\s*-\s*comment\s*-\s*%}[\s\S]*?{%\s*-\s*endcomment\s*-\s*%}/gi, '')
  
  // Process style tags - extract CSS and add to head
  const styleMatches: string[] = []
  html = html.replace(/{%\s*-\s*style\s*-\s*%}([\s\S]*?){%\s*-\s*endstyle\s*-\s*%}/gi, (match, css) => {
    styleMatches.push(css.trim())
    return ''
  })
  
  // Replace section.settings.variable with mock values
  // Handle section.settings.variable with optional filters
  html = html.replace(/section\.settings\.([a-zA-Z0-9_-]+)(?:\s*\|\s*[^}]+)?/g, (match, varName) => {
    // Extract default value from filters if present
    const defaultMatch = match.match(/\|\s*default\s*:\s*['"]([^'"]+)['"]/i)
    if (defaultMatch) {
      return defaultMatch[1]
    }
    
    // Provide mock values based on variable name patterns
    const lowerName = varName.toLowerCase()
    
    if (lowerName.includes('color') || lowerName.includes('background')) {
      return '#ffffff'
    }
    if (lowerName.includes('text') || lowerName.includes('heading') || lowerName.includes('title')) {
      return 'Sample Text'
    }
    if (lowerName.includes('url') || lowerName.includes('link')) {
      return '#'
    }
    if (lowerName.includes('image')) {
      return 'https://via.placeholder.com/400x300?text=Image'
    }
    if (lowerName.includes('padding') || lowerName.includes('margin') || lowerName.includes('width') || lowerName.includes('height')) {
      return '20'
    }
    if (lowerName.includes('size') || lowerName.includes('font')) {
      return '16'
    }
    
    return 'Default Value'
  })
  
  // Replace section.id with a mock ID
  html = html.replace(/section\.id/g, 'preview-section')
  
  // Replace any remaining {{variable}} placeholders that weren't replaced
  // These should already be replaced, but just in case
  html = html.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmed = varName.trim().toLowerCase()
    if (trimmed.includes('color')) {
      return '#000000'
    }
    if (trimmed.includes('url') || trimmed.includes('link')) {
      return '#'
    }
    if (trimmed.includes('image')) {
      return 'https://via.placeholder.com/400x300?text=Image'
    }
    return 'Sample Value'
  })
  
  // Process remaining Liquid filters - simplify common ones
  html = html.replace(/\|\s*times\s*[0-9.]+/gi, '') // Remove times filters (already processed in section.settings)
  html = html.replace(/\|\s*round\s*:\s*[0-9]+/gi, '') // Remove round filters
  html = html.replace(/\|\s*default\s*:\s*['"]([^'"]+)['"]/gi, '$1') // Extract default values
  html = html.replace(/\|\s*default\s*:\s*([0-9]+)/gi, '$1') // Extract numeric defaults
  html = html.replace(/\{\{\s*([^|]+)\s*\|\s*[^}]+\s*\}\}/g, '{{$1}}') // Simplify complex filters to basic variables
  
  // Build the full HTML document
  const styles = styleMatches.length > 0 ? `<style>${styleMatches.join('\n')}</style>` : ''
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section Preview</title>
  ${styles}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${html.trim()}
</body>
</html>`
}

/**
 * Check if the Liquid code contains renderable content
 */
export function hasRenderableContent(liquidCode: string): boolean {
  // Remove schema and comments
  const withoutSchema = liquidCode.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '')
  const withoutComments = withoutSchema.replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/gi, '')
  
  // Check if there's any HTML-like content
  return /<[a-z][\s\S]*>/i.test(withoutComments)
}

