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
  
  // Remove comment tags (both with and without whitespace control)
  html = html.replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/gi, '')
  html = html.replace(/{%\s*-\s*comment\s*-\s*%}[\s\S]*?{%\s*-\s*endcomment\s*-\s*%}/gi, '')
  
  // Process style tags - extract CSS and add to head
  const styleMatches: string[] = []
  html = html.replace(/{%\s*-\s*style\s*-\s*%}([\s\S]*?){%\s*-\s*endstyle\s*-\s*%}/gi, (match: string, css: string) => {
    let processedCss = css.trim()
    // Replace section.id in CSS
    processedCss = processedCss.replace(/section\.id/g, 'preview-section')
    // Replace section.settings in CSS
    processedCss = processedCss.replace(/\{\{\s*section\.settings\.([a-zA-Z0-9_-]+)(?:\s*\|\s*[^}]+)?\s*\}\}/g, (match: string, varName: string) => {
      const lowerName = varName.toLowerCase()
      if (lowerName.includes('padding') || lowerName.includes('margin') || lowerName.includes('width') || lowerName.includes('height')) {
        return '20'
      }
      return '0'
    })
    styleMatches.push(processedCss)
    return ''
  })
  
  // Replace section.id with a mock ID (handle both in and out of Liquid tags)
  html = html.replace(/\{\{\s*section\.id\s*\}\}/g, 'preview-section')
  html = html.replace(/section\.id/g, 'preview-section')
  
  // Replace section.settings.variable inside Liquid tags {{ section.settings.var }}
  html = html.replace(/\{\{\s*section\.settings\.([a-zA-Z0-9_-]+)(?:\s*\|\s*[^}]+)?\s*\}\}/g, (match: string, varName: string) => {
    // Extract default value from filters if present
    const defaultMatch = match.match(/\|\s*default\s*:\s*['"]([^'"]+)['"]/i)
    if (defaultMatch) {
      return defaultMatch[1]
    }
    
    const numericDefaultMatch = match.match(/\|\s*default\s*:\s*([0-9]+)/i)
    if (numericDefaultMatch) {
      return numericDefaultMatch[1]
    }
    
    // Provide mock values based on variable name patterns
    const lowerName = varName.toLowerCase()
    
    if (lowerName.includes('color') || lowerName.includes('background')) {
      return '#ffffff'
    }
    if (lowerName.includes('text') || lowerName.includes('heading') || lowerName.includes('title') || lowerName.includes('subheading')) {
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
  
  // Replace any remaining {{variable}} placeholders that weren't replaced
  // These should already be replaced with defaults, but handle edge cases
  html = html.replace(/\{\{([^}]+)\}\}/g, (match: string, varName: string) => {
    const trimmed = varName.trim()
    const lowerTrimmed = trimmed.toLowerCase()
    
    // Skip if it's a Liquid tag (if, for, etc.)
    if (trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('unless ') || 
        trimmed.startsWith('case ') || trimmed.startsWith('when ') || trimmed.startsWith('assign ') ||
        trimmed.startsWith('include ') || trimmed.startsWith('render ') || trimmed.startsWith('end')) {
      return ''
    }
    
    // Handle filters
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|')
      const varPart = parts[0].trim()
      const filters = parts.slice(1).join('|')
      
      // Extract default from filters
      const defaultMatch = filters.match(/default\s*:\s*['"]([^'"]+)['"]/i)
      if (defaultMatch) {
        return defaultMatch[1]
      }
      
      const numericDefaultMatch = filters.match(/default\s*:\s*([0-9]+)/i)
      if (numericDefaultMatch) {
        return numericDefaultMatch[1]
      }
      
      // Remove filters and process the variable
      const cleanVar = varPart.toLowerCase()
      if (cleanVar.includes('color')) {
        return '#000000'
      }
      if (cleanVar.includes('url') || cleanVar.includes('link')) {
        return '#'
      }
      if (cleanVar.includes('image')) {
        return 'https://via.placeholder.com/400x300?text=Image'
      }
      return 'Sample Value'
    }
    
    // Simple variable replacement
    if (lowerTrimmed.includes('color')) {
      return '#000000'
    }
    if (lowerTrimmed.includes('url') || lowerTrimmed.includes('link')) {
      return '#'
    }
    if (lowerTrimmed.includes('image')) {
      return 'https://via.placeholder.com/400x300?text=Image'
    }
    if (lowerTrimmed.includes('text') || lowerTrimmed.includes('heading') || lowerTrimmed.includes('title')) {
      return 'Sample Text'
    }
    return 'Sample Value'
  })
  
  // Remove Liquid control flow tags (if, for, etc.) - just remove them for preview
  html = html.replace(/{%\s*(if|unless|for|case|when|assign|include|render|end\w+)[^%]*%}/gi, '')
  
  // Process remaining Liquid filters - remove them
  html = html.replace(/\|\s*times\s*[0-9.]+/gi, '')
  html = html.replace(/\|\s*round\s*:\s*[0-9]+/gi, '')
  html = html.replace(/\|\s*default\s*:\s*['"]([^'"]+)['"]/gi, '$1')
  html = html.replace(/\|\s*default\s*:\s*([0-9]+)/gi, '$1')
  
  // Clean up any remaining Liquid tag syntax
  html = html.replace(/{%\s*[^%]*\s*%}/g, '')
  
  // Trim and clean up whitespace
  html = html.trim()
  
  // If no HTML content remains, return a placeholder
  if (!html || html.length === 0) {
    html = '<div style="padding: 40px; text-align: center; color: #666;">No preview content available</div>'
  }
  
  // Check if the section already has page-width or container classes
  const hasPageWidth = html.includes('page-width') || html.includes('container')
  const hasSectionWrapper = html.includes('class="section') || html.includes("class='section")
  
  // Build the full HTML document with Shopify theme base
  const styles = styleMatches.length > 0 ? `<style>${styleMatches.join('\n')}</style>` : ''
  
  // Shopify theme base CSS
  const shopifyBaseStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #ffffff;
    }
    
    /* Shopify theme common classes */
    .page-width {
      max-width: 120rem;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    @media screen and (min-width: 750px) {
      .page-width {
        padding: 0 5rem;
      }
    }
    
    .section {
      width: 100%;
    }
    
    .section-padding {
      padding-top: 2.5rem;
      padding-bottom: 2.5rem;
    }
    
    @media screen and (min-width: 750px) {
      .section-padding {
        padding-top: 3.6rem;
        padding-bottom: 3.6rem;
      }
    }
    
    /* Common typography */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 1rem;
    }
    
    h1 { font-size: 3.2rem; }
    h2 { font-size: 2.4rem; }
    h3 { font-size: 2rem; }
    h4 { font-size: 1.8rem; }
    h5 { font-size: 1.6rem; }
    h6 { font-size: 1.4rem; }
    
    @media screen and (min-width: 750px) {
      h1 { font-size: 4rem; }
      h2 { font-size: 3.2rem; }
      h3 { font-size: 2.4rem; }
    }
    
    p {
      margin-bottom: 1rem;
    }
    
    a {
      color: inherit;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    button, .button, a.button {
      display: inline-block;
      padding: 1.2rem 2.4rem;
      background-color: #000;
      color: #fff;
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
      font-size: 1.4rem;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    
    button:hover, .button:hover {
      opacity: 0.8;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* Container utilities */
    .container {
      width: 100%;
      max-width: 120rem;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    @media screen and (min-width: 750px) {
      .container {
        padding: 0 5rem;
      }
    }
    
    /* Grid utilities */
    .grid {
      display: grid;
      gap: 2rem;
    }
    
    .flex {
      display: flex;
    }
    
    .flex-center {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Text utilities */
    .text-center {
      text-align: center;
    }
    
    .text-left {
      text-align: left;
    }
    
    .text-right {
      text-align: right;
    }
  `
  
  // Wrap content only if it doesn't already have structure
  const wrappedContent = hasPageWidth || hasSectionWrapper 
    ? html 
    : `<div class="section"><div class="page-width section-padding">${html}</div></div>`
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section Preview</title>
  <style>${shopifyBaseStyles}</style>
  ${styles}
</head>
<body>
  ${wrappedContent}
</body>
</html>`
}

/**
 * Check if the Liquid code contains renderable content
 */
export function hasRenderableContent(liquidCode: string): boolean {
  if (!liquidCode || !liquidCode.trim()) {
    return false
  }
  
  // Remove schema and comments
  const withoutSchema = liquidCode.replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/gi, '')
  const withoutComments = withoutSchema.replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/gi, '')
  const withoutComments2 = withoutComments.replace(/{%\s*-\s*comment\s*-\s*%}[\s\S]*?{%\s*-\s*endcomment\s*-\s*%}/gi, '')
  
  // Check if there's any HTML-like content (tags like <div>, <h1>, <p>, etc.)
  const hasHtmlTags = /<[a-z][a-z0-9]*[\s\S]*>/i.test(withoutComments2)
  
  // Also check for style tags that might contain CSS
  const hasStyleTags = /{%\s*-\s*style\s*-\s*%}/i.test(liquidCode)
  
  return hasHtmlTags || hasStyleTags
}

