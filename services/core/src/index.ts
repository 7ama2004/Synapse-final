import express from 'express'
import { Pool } from 'pg'
import { createClient } from 'redis'
import { Queue } from 'bullmq'
import { userRouter } from './routes/users'
import { executionRouter } from './routes/executions'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Database connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

// BullMQ queue for workflow execution
const executionQueue = new Queue('workflow-execution', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

// Middleware
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'core-service' })
})

// Routes
app.use('/users', userRouter)
app.use('/execute', executionRouter)

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
    app.locals.executionQueue = executionQueue
    
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => {
      logger.info(`Core service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start service:', error)
    process.exit(1)
  }
}

start()