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
const isBuilt = fs.existsSync(nextDir)

if (!isBuilt && !dev) {
  console.warn('⚠️  Warning: .next directory not found. Next.js app needs to be built first.')
  console.warn('⚠️  Run: npm run build')
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Health check endpoint that always returns HTML
const healthCheck = (req, res) => {
  if (req.url === '/health' || req.url === '/') {
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
  createServer(async (req, res) => {
    try {
      // Handle health check before Next.js is ready
      if (healthCheck(req, res)) {
        return
      }
      
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
  
  // Start server anyway to serve helpful error page
  createServer((req, res) => {
    if (healthCheck(req, res)) {
      return
    }
    
    res.statusCode = 503
    res.setHeader('Content-Type', 'text/html')
    
    const errorMessage = !isBuilt && !dev 
      ? '<p><strong>The application needs to be built first.</strong></p><p>Please run: <code>npm run build</code></p>'
      : `<p>The application failed to initialize.</p><p>Error: ${err.message}</p><p>Please check the server logs for more details.</p>`
    
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Unavailable</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Service Unavailable</h1>
          ${errorMessage}
        </body>
      </html>
    `)
  }).listen(port, hostname, () => {
    console.log(`> Health check server running on http://${hostname}:${port}`)
    console.log(`> Next.js app failed to prepare, but server is responding`)
  })
})

