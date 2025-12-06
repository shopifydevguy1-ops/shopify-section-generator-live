// Script to process all sections (JavaScript version for direct execution)
// Run with: node scripts/process-sections.js

const fs = require('fs')
const path = require('path')

function getSectionsDirectoryPath() {
  if (process.env.SECTIONS_DIRECTORY_PATH) {
    return process.env.SECTIONS_DIRECTORY_PATH
  }
  const localSectionsPath = path.join(process.cwd(), 'sections')
  if (fs.existsSync(localSectionsPath)) {
    return localSectionsPath
  }
  return path.join(process.cwd(), 'sections')
}

function removeCopyrightComments(content) {
  // More comprehensive copyright detection patterns
  const copyrightPatterns = [
    // Liquid comment blocks with copyright
    /{%\s*comment\s*%}[\s\S]*?Copyright[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?Section Store[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?Unauthorized copying[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?All rights reserved[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?prosecuted[\s\S]*?{%\s*endcomment\s*%}/gi,
    /{%\s*comment\s*%}[\s\S]*?daniel@section\.store[\s\S]*?{%\s*endcomment\s*%}/gi,
    // HTML comment blocks with copyright
    /<!--[\s\S]*?Copyright[\s\S]*?-->/gi,
    /<!--[\s\S]*?Section Store[\s\S]*?-->/gi,
    /<!--[\s\S]*?Unauthorized copying[\s\S]*?-->/gi,
    /<!--[\s\S]*?All rights reserved[\s\S]*?-->/gi,
    // Multi-line copyright blocks (with dashes)
    /{%\s*comment\s*%}[\s\S]*?-{10,}[\s\S]*?Copyright[\s\S]*?-{10,}[\s\S]*?{%\s*endcomment\s*%}/gi,
    /<!--[\s\S]*?-{10,}[\s\S]*?Copyright[\s\S]*?-{10,}[\s\S]*?-->/gi,
  ]

  let cleaned = content
  for (const pattern of copyrightPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Also remove any comment blocks at the very beginning of the file that look like copyright
  // This handles cases where the pattern might not match exactly
  cleaned = cleaned.replace(/^({%\s*comment\s*%}[\s\S]{0,500}?{%\s*endcomment\s*%}\s*)+/i, '')
  cleaned = cleaned.replace(/^(<!--[\s\S]{0,500}?-->\s*)+/i, '')

  return cleaned.trim()
}

function replaceSSWithSG(content) {
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

function updateSectionName(content) {
  const schemaRegex = /{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/
  const match = content.match(schemaRegex)
  
  if (!match) {
    return content
  }

  try {
    const schemaJson = JSON.parse(match[1])
    
    // Update name field: Replace SS- with SG-, or add SG- if not present
    if (schemaJson.name) {
      // Remove any existing SS- or SS prefix (with or without space)
      // Handle patterns like: "SS - Name", "SS- Name", "SS Name", "SG-- Name"
      let cleanName = schemaJson.name
        .replace(/^SS\s*-\s*/i, '')  // "SS - " or "SS- "
        .replace(/^SS\s+/i, '')      // "SS "
        .replace(/^SS-/i, '')        // "SS-"
        .trim()
      
      // Fix any existing SG-- (double dash) issues first
      cleanName = cleanName.replace(/^SG--\s*/, '')
      
      // Remove leading dash if present
      cleanName = cleanName.replace(/^-\s*/, '')
      
      // Add SG- prefix if not already present
      if (!cleanName.startsWith('SG-') && !cleanName.startsWith('SG ')) {
        schemaJson.name = `SG-${cleanName}`
      } else {
        schemaJson.name = cleanName
      }
    }

    // Also update presets if they exist
    if (schemaJson.presets && Array.isArray(schemaJson.presets)) {
      schemaJson.presets = schemaJson.presets.map(preset => {
        if (preset.name) {
          let cleanPresetName = preset.name
            .replace(/^SS\s*-\s*/i, '')  // "SS - " or "SS- "
            .replace(/^SS\s+/i, '')      // "SS "
            .replace(/^SS-/i, '')        // "SS-"
            .trim()
          
          // Fix any existing SG-- (double dash) issues first
          cleanPresetName = cleanPresetName.replace(/^SG--\s*/, '')
          
          // Remove leading dash if present
          cleanPresetName = cleanPresetName.replace(/^-\s*/, '')
          
          if (!cleanPresetName.startsWith('SG-') && !cleanPresetName.startsWith('SG ')) {
            preset.name = `SG-${cleanPresetName}`
          } else {
            preset.name = cleanPresetName
          }
        }
        return preset
      })
    }

    const updatedSchema = `{% schema %}\n${JSON.stringify(schemaJson, null, 2)}\n{% endschema %}`
    return content.replace(schemaRegex, updatedSchema)
  } catch (e) {
    // Fallback: simple string replacement if JSON parsing fails
    let updated = content.replace(/"name"\s*:\s*"([^"]*)"/g, (match, name) => {
      if (!name.startsWith('SG-') && !name.startsWith('SG ')) {
        let cleanName = name
          .replace(/^SS\s*-\s*/i, '')  // "SS - " or "SS- "
          .replace(/^SS\s+/i, '')      // "SS "
          .replace(/^SS-/i, '')        // "SS-"
          .trim()
        
        // Fix any existing SG-- (double dash) issues first
        cleanName = cleanName.replace(/^SG--\s*/, '')
        
        // Remove leading dash if present
        cleanName = cleanName.replace(/^-\s*/, '')
        return `"name": "SG-${cleanName}"`
      }
      return match
    })
    return updated
  }
}

function processSectionFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf-8')
  
  let content = removeCopyrightComments(originalContent)
  content = replaceSSWithSG(content)
  content = updateSectionName(content)
  
  const dir = path.dirname(filePath)
  const filename = path.basename(filePath)
  let newFilename = filename
  
  if (filename.toLowerCase().includes('ss-')) {
    newFilename = filename.replace(/ss-/gi, 'sg-')
  }
  
  const newPath = path.join(dir, newFilename)
  const renamed = newPath !== filePath
  
  if (renamed) {
    fs.writeFileSync(newPath, content, 'utf-8')
    fs.unlinkSync(filePath)
    console.log(`✓ Processed and renamed: ${filename} → ${newFilename}`)
  } else {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✓ Processed: ${filename}`)
  }
  
  return { renamed, newPath: renamed ? newPath : filePath }
}

function processAllSections() {
  const sectionsPath = getSectionsDirectoryPath()
  
  if (!fs.existsSync(sectionsPath)) {
    console.error(`❌ Sections directory not found: ${sectionsPath}`)
    console.error(`   Please ensure the sections folder exists or set SECTIONS_DIRECTORY_PATH environment variable`)
    return
  }

  const files = fs.readdirSync(sectionsPath)
  const liquidFiles = files.filter(file => 
    file.endsWith('.liquid') && 
    !file.startsWith('.') &&
    fs.statSync(path.join(sectionsPath, file)).isFile()
  )

  if (liquidFiles.length === 0) {
    console.log(`⚠️  No .liquid files found in ${sectionsPath}`)
    return
  }

  console.log(`📁 Sections directory: ${sectionsPath}`)
  console.log(`📄 Found ${liquidFiles.length} section files to process\n`)
  console.log(`⚠️  IMPORTANT: Make sure you have a backup of your sections folder!\n`)

  let processed = 0
  let renamed = 0
  let errors = 0

  for (const file of liquidFiles) {
    try {
      const filePath = path.join(sectionsPath, file)
      const result = processSectionFile(filePath)
      processed++
      if (result.renamed) {
        renamed++
      }
    } catch (error) {
      errors++
      console.error(`❌ Error processing ${file}:`, error.message)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ Processing complete!`)
  console.log(`   ✓ Processed: ${processed} files`)
  if (renamed > 0) {
    console.log(`   ↻ Renamed: ${renamed} files (SS- → SG-)`)
  }
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors} files`)
  }
  console.log(`\n📝 Preview Images:`)
  console.log(`   Location: ${path.join(sectionsPath, 'images')}`)
  console.log(`   Format: sg-{section-name}.png`)
  console.log(`   Example: sg-hero-banner.liquid → sg-hero-banner.png`)
  console.log(`${'='.repeat(50)}\n`)
}

// Run the script
processAllSections()

