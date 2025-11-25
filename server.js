const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

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
  // Start server anyway to serve health check
  createServer((req, res) => {
    healthCheck(req, res) || (() => {
      res.statusCode = 503
      res.setHeader('Content-Type', 'text/html')
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Service Unavailable</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>Service Unavailable</h1>
            <p>The application is still initializing. Please try again in a moment.</p>
          </body>
        </html>
      `)
    })()
  }).listen(port, hostname, () => {
    console.log(`> Health check server running on http://${hostname}:${port}`)
    console.log(`> Next.js app failed to prepare, but server is responding`)
  })
})

