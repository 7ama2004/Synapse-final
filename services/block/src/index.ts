import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import { createClient } from 'redis'
import { blockRouter } from './routes/blocks'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()

// Database connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'block-service' })
})

// Routes
app.use('/blocks', blockRouter)

// Error handling
app.use(errorHandler)

// Start server
async function start() {
  try {
    // Connect to Redis
    await redisClient.connect()
    logger.info('Connected to Redis')
    
    // Make connections available globally
    app.locals.pgPool = pgPool
    app.locals.redisClient = redisClient
    
    const PORT = process.env.PORT || 3003
    app.listen(PORT, () => {
      logger.info(`Block service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start service:', error)
    process.exit(1)
  }
}

start()