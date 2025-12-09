// Client-side device fingerprinting
// This creates a unique fingerprint based on device/browser characteristics

export function generateDeviceFingerprint(): string {
  const components: string[] = []
  
  // Screen resolution
  if (typeof window !== 'undefined') {
    components.push(`screen:${window.screen.width}x${window.screen.height}`)
    components.push(`avail:${window.screen.availWidth}x${window.screen.availHeight}`)
    components.push(`color:${window.screen.colorDepth}`)
    components.push(`pixel:${window.devicePixelRatio || 1}`)
    
    // Timezone
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
    
    // Language
    components.push(`lang:${navigator.language}`)
    components.push(`langs:${navigator.languages?.join(',') || ''}`)
    
    // Platform
    components.push(`platform:${navigator.platform}`)
    components.push(`vendor:${navigator.vendor}`)
    
    // Hardware concurrency
    components.push(`cores:${navigator.hardwareConcurrency || 0}`)
    
    // Canvas fingerprint (more unique)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Device fingerprint test 🔒', 2, 2)
        const canvasHash = canvas.toDataURL().substring(0, 100)
        components.push(`canvas:${canvasHash}`)
      }
    } catch (e) {
      // Canvas not available
    }
    
    // WebGL fingerprint
    try {
      const gl = document.createElement('canvas').getContext('webgl') || 
                 document.createElement('canvas').getContext('experimental-webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          components.push(`gl:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`)
          components.push(`glv:${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}`)
        }
      }
    } catch (e) {
      // WebGL not available
    }
  }
  
  // Create hash from components
  const fingerprintString = components.join('|')
  
  // Simple hash function (for client-side)
  let hash = 0
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `fp_${Math.abs(hash).toString(36)}`
}

// Enhanced fingerprint with more entropy
export async function generateEnhancedFingerprint(): Promise<string> {
  const components: string[] = []
  
  if (typeof window !== 'undefined') {
    // Basic components
    components.push(`screen:${window.screen.width}x${window.screen.height}`)
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
    components.push(`lang:${navigator.language}`)
    components.push(`platform:${navigator.platform}`)
    
    // Canvas fingerprint
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 50
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = '#f60'
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.font = '11pt Arial'
        ctx.fillText('Fingerprint 🔒', 2, 15)
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
        ctx.font = '11pt Arial'
        ctx.fillText('Fingerprint 🔒', 4, 17)
        components.push(`canvas:${canvas.toDataURL().substring(22, 100)}`)
      }
    } catch (e) {
      // Ignore
    }
    
    // Audio context fingerprint (if available)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
      
      gainNode.gain.value = 0
      oscillator.connect(analyser)
      analyser.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.start(0)
      scriptProcessor.onaudioprocess = () => {
        const audioHash = analyser.frequencyData.length.toString()
        components.push(`audio:${audioHash}`)
        oscillator.stop()
        audioContext.close()
      }
    } catch (e) {
      // Audio not available or blocked
    }
  }
  
  const fingerprintString = components.join('|')
  
  // Use Web Crypto API for better hashing if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(fingerprintString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return `fp_${hashHex.substring(0, 32)}`
    } catch (e) {
      // Fallback to simple hash
    }
  }
  
  // Fallback: simple hash
  let hash = 0
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return `fp_${Math.abs(hash).toString(36)}`
}

