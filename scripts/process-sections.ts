// Script to process all sections:
// 1. Remove copyright comments
// 2. Replace SS- with SG- in filenames and content
// 3. Update section names to include SG prefix

import fs from 'fs'
import path from 'path'

/**
 * Get sections directory path
 */
function getSectionsDirectoryPath(): string {
  if (process.env.SECTIONS_DIRECTORY_PATH) {
    return process.env.SECTIONS_DIRECTORY_PATH
  }
  const localSectionsPath = path.join(process.cwd(), 'sections')
  if (fs.existsSync(localSectionsPath)) {
    return localSectionsPath
  }
  return path.join(process.cwd(), 'sections')
}

/**
 * Remove copyright comments from liquid code
 */
function removeCopyrightComments(content: string): string {
  // Remove comment blocks that contain copyright text
  const copyrightPatterns = [
    /{%\s*comment\s*%}[\s\S]*?Copyright[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?Section Store[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?Unauthorized copying[\s\S]*?{%\s*endcomment\s*%}/gi,
    /<!--[\s\S]*?Copyright[\s\S]*?-->/gi,
    /<!--[\s\S]*?Section Store[\s\S]*?-->/gi,
  ]

  let cleaned = content
  for (const pattern of copyrightPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned.trim()
}

/**
 * Replace SS- with SG- in content
 */
function replaceSSWithSG(content: string): string {
  // Replace SS- with SG- in various contexts
  return content
    .replace(/ss-/gi, 'sg-')
    .replace(/SS-/g, 'SG-')
    .replace(/\bss_/gi, 'sg_')
    .replace(/\bSS_/g, 'SG_')
    .replace(/\.ss-/gi, '.sg-')
    .replace(/\.SS-/g, '.SG-')
    .replace(/#ss-/gi, '#sg-')
    .replace(/#SS-/g, '#SG-')
}

/**
 * Update section name in schema to include SG prefix
 */
function updateSectionName(content: string): string {
  // Find schema block and update name
  const schemaRegex = /{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/
  const match = content.match(schemaRegex)
  
  if (!match) {
    return content
  }

  try {
    const schemaJson = JSON.parse(match[1])
    
    // Update name to include SG prefix if not already present
    if (schemaJson.name && !schemaJson.name.startsWith('SG-') && !schemaJson.name.startsWith('SG ')) {
      // Remove any existing SS- prefix first
      let cleanName = schemaJson.name.replace(/^SS-\s*/i, '').trim()
      schemaJson.name = `SG-${cleanName}`
    }

    // Rebuild schema block
    const updatedSchema = `{% schema %}\n${JSON.stringify(schemaJson, null, 2)}\n{% endschema %}`
    return content.replace(schemaRegex, updatedSchema)
  } catch (e) {
    // If JSON parsing fails, try simple string replacement
    return content.replace(/"name"\s*:\s*"([^"]*)"/g, (match, name) => {
      if (!name.startsWith('SG-') && !name.startsWith('SG ')) {
        const cleanName = name.replace(/^SS-\s*/i, '').trim()
        return `"name": "SG-${cleanName}"`
      }
      return match
    })
  }
}

/**
 * Process a single section file
 */
function processSectionFile(filePath: string): { renamed: boolean; newPath?: string } {
  const originalContent = fs.readFileSync(filePath, 'utf-8')
  
  // Step 1: Remove copyright comments
  let content = removeCopyrightComments(originalContent)
  
  // Step 2: Replace SS- with SG- in content
  content = replaceSSWithSG(content)
  
  // Step 3: Update section name in schema
  content = updateSectionName(content)
  
  // Step 4: Check if filename needs to be changed
  const dir = path.dirname(filePath)
  const filename = path.basename(filePath)
  let newFilename = filename
  
  if (filename.toLowerCase().includes('ss-')) {
    newFilename = filename.replace(/ss-/gi, 'sg-')
  }
  
  const newPath = path.join(dir, newFilename)
  const renamed = newPath !== filePath
  
  // Write the processed content
  if (renamed) {
    fs.writeFileSync(newPath, content, 'utf-8')
    fs.unlinkSync(filePath) // Delete old file
    console.log(`✓ Processed and renamed: ${filename} → ${newFilename}`)
  } else {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✓ Processed: ${filename}`)
  }
  
  return { renamed, newPath: renamed ? newPath : filePath }
}

/**
 * Main processing function
 */
export function processAllSections(): void {
  const sectionsPath = getSectionsDirectoryPath()
  
  if (!fs.existsSync(sectionsPath)) {
    console.error(`Sections directory not found: ${sectionsPath}`)
    return
  }

  const files = fs.readdirSync(sectionsPath)
  const liquidFiles = files.filter(file => 
    file.endsWith('.liquid') && 
    !file.startsWith('.') &&
    fs.statSync(path.join(sectionsPath, file)).isFile()
  )

  console.log(`Found ${liquidFiles.length} section files to process\n`)

  let processed = 0
  let renamed = 0

  for (const file of liquidFiles) {
    try {
      const filePath = path.join(sectionsPath, file)
      const result = processSectionFile(filePath)
      processed++
      if (result.renamed) {
        renamed++
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error)
    }
  }

  console.log(`\n✅ Processing complete!`)
  console.log(`   - Processed: ${processed} files`)
  console.log(`   - Renamed: ${renamed} files`)
  console.log(`\n📝 Note: Preview images should be placed in:`)
  console.log(`   ${path.join(sectionsPath, 'images')}`)
  console.log(`   Format: sg-{section-name}.png (matching the new filenames)`)
}

// Run if executed directly
if (require.main === module) {
  processAllSections()
}

