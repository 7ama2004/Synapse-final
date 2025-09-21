import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import { Redis } from 'ioredis'
import { Queue, Worker } from 'bullmq'
import { executor } from './executor'
import { logger } from './utils/logger'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()

// Database connections
const mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017/synapse')
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// BullMQ queue for workflow execution
const executionQueue = new Queue('workflow-execution', { connection: redis })

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'execution-engine' })
})

// Start workflow execution
app.post('/execute', async (req, res) => {
  try {
    const { workflowId, inputs, userId } = req.body
    
    if (!workflowId || !userId) {
      return res.status(400).json({ error: 'Workflow ID and User ID required' })
    }

    // Add job to queue
    const job = await executionQueue.add('execute-workflow', {
      workflowId,
      inputs,
      userId,
      timestamp: new Date()
    })

    res.json({
      executionId: job.id,
      status: 'queued',
      message: 'Workflow execution queued'
    })
  } catch (error) {
    logger.error('Error queuing workflow execution:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get execution status
app.get('/execution/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get job from queue
    const job = await executionQueue.getJob(id)
    
    if (!job) {
      return res.status(404).json({ error: 'Execution not found' })
    }

    res.json({
      executionId: id,
      status: await job.getState(),
      progress: job.progress,
      result: job.returnvalue,
      error: job.failedReason
    })
  } catch (error) {
    logger.error('Error fetching execution status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Cancel execution
app.post('/execution/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get job from queue
    const job = await executionQueue.getJob(id)
    
    if (!job) {
      return res.status(404).json({ error: 'Execution not found' })
    }

    await job.remove()
    
    res.json({
      executionId: id,
      status: 'cancelled',
      message: 'Execution cancelled successfully'
    })
  } catch (error) {
    logger.error('Error cancelling execution:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start server and worker
async function start() {
  try {
    // Connect to MongoDB
    await mongoClient.connect()
    logger.info('Connected to MongoDB')
    
    // Make connections available globally
    app.locals.mongoClient = mongoClient
    app.locals.redis = redis
    app.locals.executionQueue = executionQueue
    
    // Start worker
    const worker = new Worker('workflow-execution', executor, { connection: redis })
    
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`)
    })
    
    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err)
    })
    
    const PORT = process.env.PORT || 3005
    app.listen(PORT, () => {
      logger.info(`Execution engine running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start service:', error)
    process.exit(1)
  }
}

start()