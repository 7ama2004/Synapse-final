import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { MongoClient } from 'mongodb'
import { WorkflowExecutor } from './executor'
import { logger } from './utils/logger'

// Initialize Redis connection
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

// Initialize MongoDB connection
const mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017')

// Initialize workflow executor
const executor = new WorkflowExecutor()

// Create worker for workflow execution
const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    const { workflowId, userId, inputs } = job.data
    
    logger.info(`Starting workflow execution: ${workflowId} for user: ${userId}`)
    
    try {
      // Get workflow definition from MongoDB
      const db = mongoClient.db('synapse')
      const workflowDef = await db
        .collection('workflow_definitions')
        .findOne({ workflowId })
      
      if (!workflowDef) {
        throw new Error(`Workflow ${workflowId} not found`)
      }
      
      // Execute workflow
      const result = await executor.execute({
        workflowId,
        userId,
        definition: workflowDef,
        inputs,
      })
      
      // Store execution result
      await db.collection('workflow_executions').insertOne({
        executionId: job.id,
        workflowId,
        userId,
        startTime: job.timestamp,
        endTime: Date.now(),
        status: 'completed',
        result,
      })
      
      return result
    } catch (error) {
      logger.error(`Workflow execution failed: ${error}`)
      
      // Store error
      const db = mongoClient.db('synapse')
      await db.collection('workflow_executions').insertOne({
        executionId: job.id,
        workflowId,
        userId,
        startTime: job.timestamp,
        endTime: Date.now(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
)

// Handle worker events
workflowWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`)
})

workflowWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err)
})

// Start the service
async function start() {
  try {
    await mongoClient.connect()
    logger.info('Connected to MongoDB')
    
    logger.info('Workflow execution engine started')
  } catch (error) {
    logger.error('Failed to start execution engine:', error)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await workflowWorker.close()
  await mongoClient.close()
  await redis.quit()
  process.exit(0)
})