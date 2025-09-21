import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { authMiddleware } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import { setupWebSocket } from './websocket'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})

// Basic middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Apply rate limiting
app.use('/api', rateLimiter)

// Apply auth middleware to protected routes
app.use('/api', authMiddleware)

// Service proxies
const services = [
  {
    path: '/api/core',
    target: process.env.CORE_SERVICE_URL || 'http://localhost:3001',
  },
  {
    path: '/api/workflows',
    target: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3002',
  },
  {
    path: '/api/blocks',
    target: process.env.BLOCK_SERVICE_URL || 'http://localhost:3003',
  },
  {
    path: '/api/ai',
    target: process.env.AI_SERVICE_URL || 'http://localhost:3004',
  },
  {
    path: '/api/execute',
    target: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3005',
  },
]

services.forEach(({ path, target }) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '',
      },
      onProxyReq: (proxyReq, req) => {
        // Forward user info from auth middleware
        if ((req as any).user) {
          proxyReq.setHeader('X-User-Id', (req as any).user.sub)
          proxyReq.setHeader('X-User-Email', (req as any).user.email)
          proxyReq.setHeader('X-User-Roles', JSON.stringify((req as any).user.roles))
        }
      },
      onError: (err, req, res) => {
        logger.error('Proxy error:', err)
        res.status(502).json({ error: 'Service unavailable' })
      },
    })
  )
})

// Setup WebSocket
setupWebSocket(io)

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`)
})