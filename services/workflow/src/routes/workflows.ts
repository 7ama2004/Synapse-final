import { Router } from 'express'
import { Pool } from 'pg'
import { Db } from 'mongodb'
import { RedisClientType } from 'redis'
import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'

export const workflowRouter = Router()

// Validation schemas
const createWorkflowSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().max(1000),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublic: Joi.boolean().optional().default(false),
})

const updateCanvasSchema = Joi.object({
  blocks: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    blockId: Joi.string().required(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
    }).required(),
    size: Joi.object({
      width: Joi.number().required(),
      height: Joi.number().required(),
    }).optional(),
    config: Joi.object().optional(),
  })).required(),
  connections: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    source: Joi.object({
      blockId: Joi.string().required(),
      port: Joi.string().required(),
    }).required(),
    target: Joi.object({
      blockId: Joi.string().required(),
      port: Joi.string().required(),
    }).required(),
    type: Joi.string().valid('data', 'control').required(),
  })).required(),
  viewport: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
    zoom: Joi.number().required(),
  }).required(),
})

// Get all workflows for a user
workflowRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    
    const result = await pgPool.query(
      `SELECT * FROM workflows WHERE author_id = $1 ORDER BY updated_at DESC`,
      [userId]
    )
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Get public workflows
workflowRouter.get('/public', async (req, res, next) => {
  try {
    const pgPool: Pool = req.app.locals.pgPool
    const { page = 1, limit = 20, tags } = req.query
    
    let query = 'SELECT * FROM workflows WHERE is_public = true'
    const params: any[] = []
    
    if (tags) {
      query += ' AND tags && $1'
      params.push(tags)
    }
    
    query += ' ORDER BY star_count DESC, updated_at DESC'
    query += ` LIMIT ${limit} OFFSET ${(Number(page) - 1) * Number(limit)}`
    
    const result = await pgPool.query(query, params)
    
    res.json({
      items: result.rows,
      page: Number(page),
      limit: Number(limit),
    })
  } catch (error) {
    next(error)
  }
})

// Get workflow by ID
workflowRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const mongoDb: Db = req.app.locals.mongoDb
    
    // Get workflow metadata
    const workflowResult = await pgPool.query(
      'SELECT * FROM workflows WHERE id = $1 AND (author_id = $2 OR is_public = true)',
      [id, userId]
    )
    
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    const workflow = workflowResult.rows[0]
    
    // Get workflow definition from MongoDB
    const definition = await mongoDb
      .collection('workflow_definitions')
      .findOne({ workflowId: id })
    
    res.json({
      ...workflow,
      definition,
    })
  } catch (error) {
    next(error)
  }
})

// Create new workflow
workflowRouter.post('/', async (req, res, next) => {
  try {
    const { error, value } = createWorkflowSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const mongoDb: Db = req.app.locals.mongoDb
    
    // Create workflow metadata
    const workflowId = uuidv4()
    const result = await pgPool.query(
      `INSERT INTO workflows (id, name, description, author_id, tags, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [workflowId, value.name, value.description, userId, value.tags || [], value.isPublic]
    )
    
    const workflow = result.rows[0]
    
    // Create empty workflow definition in MongoDB
    await mongoDb.collection('workflow_definitions').insertOne({
      workflowId,
      canvas: {
        blocks: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      metadata: {
        version: 1,
        lastModified: new Date(),
        checksum: '',
      },
    })
    
    res.status(201).json(workflow)
  } catch (error) {
    next(error)
  }
})

// Update workflow canvas
workflowRouter.put('/:id/canvas', async (req, res, next) => {
  try {
    const { error, value } = updateCanvasSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const mongoDb: Db = req.app.locals.mongoDb
    
    // Check ownership
    const ownerCheck = await pgPool.query(
      'SELECT 1 FROM workflows WHERE id = $1 AND author_id = $2',
      [id, userId]
    )
    
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    
    // Update canvas in MongoDB
    await mongoDb.collection('workflow_definitions').updateOne(
      { workflowId: id },
      {
        $set: {
          canvas: value,
          'metadata.lastModified': new Date(),
          'metadata.version': { $inc: 1 },
        },
      }
    )
    
    // Update timestamp in PostgreSQL
    await pgPool.query(
      'UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    )
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// Delete workflow
workflowRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const mongoDb: Db = req.app.locals.mongoDb
    
    // Delete from PostgreSQL (cascade will handle related tables)
    const result = await pgPool.query(
      'DELETE FROM workflows WHERE id = $1 AND author_id = $2',
      [id, userId]
    )
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    // Delete from MongoDB
    await mongoDb.collection('workflow_definitions').deleteOne({ workflowId: id })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})