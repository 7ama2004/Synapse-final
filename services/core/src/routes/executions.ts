import { Router } from 'express'
import { Pool } from 'pg'
import { Queue } from 'bullmq'
import { v4 as uuidv4 } from 'uuid'
import Joi from 'joi'
import { logger } from '../utils/logger'

export const executionRouter = Router()

// Validation schema
const executeWorkflowSchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  inputs: Joi.object().optional().default({}),
})

// Execute workflow
executionRouter.post('/', async (req, res, next) => {
  try {
    const { error, value } = executeWorkflowSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const executionQueue: Queue = req.app.locals.executionQueue
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Check workflow exists and user has access
    const workflowCheck = await pgPool.query(
      'SELECT id FROM workflows WHERE id = $1 AND (author_id = $2 OR is_public = true)',
      [value.workflowId, userId]
    )
    
    if (workflowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found or unauthorized' })
    }
    
    // Create execution job
    const executionId = uuidv4()
    const job = await executionQueue.add('execute-workflow', {
      executionId,
      workflowId: value.workflowId,
      userId,
      inputs: value.inputs,
    }, {
      jobId: executionId,
    })
    
    res.json({
      executionId,
      status: 'queued',
      workflowId: value.workflowId,
    })
  } catch (error) {
    next(error)
  }
})

// Get execution status
executionRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const executionQueue: Queue = req.app.locals.executionQueue
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get job from queue
    const job = await executionQueue.getJob(id)
    
    if (!job) {
      return res.status(404).json({ error: 'Execution not found' })
    }
    
    // Check user owns this execution
    if (job.data.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    
    // Get job state
    const state = await job.getState()
    const progress = job.progress
    
    res.json({
      executionId: id,
      workflowId: job.data.workflowId,
      status: state,
      progress,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    })
  } catch (error) {
    next(error)
  }
})

// Get user's execution history
executionRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { page = 1, limit = 20 } = req.query
    const executionQueue: Queue = req.app.locals.executionQueue
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get jobs from queue
    // Note: In production, this should query from a database instead
    const jobs = await executionQueue.getJobs(
      ['completed', 'failed', 'delayed', 'active', 'waiting'],
      0,
      100
    )
    
    // Filter by user
    const userJobs = jobs
      .filter(job => job.data.userId === userId)
      .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit))
      .map(job => ({
        executionId: job.id,
        workflowId: job.data.workflowId,
        status: job.progress,
        createdAt: new Date(job.timestamp),
      }))
    
    res.json({
      items: userJobs,
      page: Number(page),
      limit: Number(limit),
    })
  } catch (error) {
    next(error)
  }
})