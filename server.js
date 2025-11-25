const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

// Check if .next directory exists (build is required for production)
const nextDir = path.join(process.cwd(), '.next')
const buildManifest = path.join(nextDir, 'BUILD_ID')
let isBuilt = fs.existsSync(nextDir) && fs.existsSync(buildManifest)

// If build doesn't exist in production, try to build it
if (!isBuilt && !dev) {
  console.log('⚠️  Build not found. Attempting to build now...')
  console.log('   Current directory:', process.cwd())
  console.log('   Looking for .next in:', nextDir)
  
  try {
    const { execSync } = require('child_process')
    console.log('   Running: npm run build')
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    })
    
    // Check again after build
    isBuilt = fs.existsSync(nextDir) && fs.existsSync(buildManifest)
    
    if (isBuilt) {
      console.log('✅ Build completed successfully!')
    } else {
      console.error('❌ Build completed but .next directory still not found!')
      console.error('   This may indicate a build error or wrong directory.')
    }
  } catch (error) {
    console.error('❌ Failed to build:', error.message)
    console.error('   Please run: npm run build manually')
  }
}

if (!isBuilt && !dev) {
  console.error('❌ ERROR: .next directory or BUILD_ID not found!')
  console.error('   This means the Next.js app was not built.')
  console.error('   Please check the logs above for build errors.')
  console.error('   You can manually build by running: npm run build')
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Track if Next.js is ready
let isNextReady = false

// Health check endpoint (only used before Next.js is ready)
const healthCheck = (req, res) => {
  if (req.url === '/health') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application Status</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Application is starting...</h1>
          <p>Please wait while the application initializes.</p>
        </body>
      </html>
    `)
    return true
  }
  return false
}

app.prepare().then(() => {
  isNextReady = true
  console.log('✅ Next.js app is ready!')
  
  createServer(async (req, res) => {
    try {
      // Only show health check if specifically requested at /health
      if (req.url === '/health') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ status: 'ok', ready: true }))
        return
      }
      
      // Serve the actual Next.js app
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/html')
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>Internal Server Error</h1>
            <p>Please check the server logs.</p>
          </body>
        </html>
      `)
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err)
      process.exit(1)
    }
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  console.error('Error details:', err.message)
  console.error('Stack:', err.stack)
  
  // Start server anyway to serve helpful error page
  createServer((req, res) => {
    if (healthCheck(req, res)) {
      return
    }
    
    res.statusCode = 503
    res.setHeader('Content-Type', 'text/html')
    
    const errorMessage = !isBuilt && !dev 
      ? '<p><strong>The application needs to be built first.</strong></p><p>Please run: <code>npm run build</code></p><p>Check the server logs for build errors.</p>'
      : `<p>The application failed to initialize.</p><p><strong>Error:</strong> ${err.message}</p><p>Please check the server logs for more details.</p>`
    
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Unavailable</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1>Service Unavailable</h1>
          <div class="error">${errorMessage}</div>
        </body>
      </html>
    `)
  }).listen(port, hostname, () => {
    console.log(`> Health check server running on http://${hostname}:${port}`)
    console.log(`> Next.js app failed to prepare, but server is responding`)
    console.log(`> Check the error messages above for details`)
  })
})

