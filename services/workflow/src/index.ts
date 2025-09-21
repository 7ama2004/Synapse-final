import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import { MongoClient } from 'mongodb'
import { createClient } from 'redis'
import { workflowRouter } from './routes/workflows'
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

const mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017/synapse')

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'workflow-service' })
})

// Routes
app.use('/workflows', workflowRouter)

// Error handling
app.use(errorHandler)

// Start server
async function start() {
  try {
    // Connect to databases
    await mongoClient.connect()
    logger.info('Connected to MongoDB')
    
    await redisClient.connect()
    logger.info('Connected to Redis')
    
    // Make connections available globally
    app.locals.pgPool = pgPool
    app.locals.mongoClient = mongoClient
    app.locals.redisClient = redisClient
    
    const PORT = process.env.PORT || 3002
    app.listen(PORT, () => {
      logger.info(`Workflow service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start service:', error)
    process.exit(1)
  }
}

start()