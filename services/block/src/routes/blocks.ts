import { Router } from 'express'
import { Pool } from 'pg'
import { RedisClientType } from 'redis'
import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'

export const blockRouter = Router()

// Validation schemas
const createBlockSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required().max(1000),
  category: Joi.string().required(),
  configSchema: Joi.object().required(),
  inputs: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().valid('input').required(),
    dataType: Joi.string().required(),
    label: Joi.string().required(),
    required: Joi.boolean().optional(),
  })).required(),
  outputs: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().valid('output').required(),
    dataType: Joi.string().required(),
    label: Joi.string().required(),
  })).required(),
  icon: Joi.string().optional(),
  color: Joi.string().optional(),
})

// Get all blocks (system + user's private blocks)
blockRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const redisClient: RedisClientType = req.app.locals.redisClient
    
    // Check cache
    const cacheKey = `blocks:${userId}`
    const cached = await redisClient.get(cacheKey)
    if (cached) {
      return res.json(JSON.parse(cached))
    }
    
    // Query database
    const result = await pgPool.query(
      `SELECT * FROM blocks 
       WHERE type = 'system' OR (type = 'private' AND author_id = $1)
       ORDER BY category, name`,
      [userId]
    )
    
    // Cache result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows)) // 5 min cache
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Get public/community blocks
blockRouter.get('/public', async (req, res, next) => {
  try {
    const pgPool: Pool = req.app.locals.pgPool
    const { category, search, page = 1, limit = 20 } = req.query
    
    let query = 'SELECT b.*, u.name as author_name FROM blocks b LEFT JOIN users u ON b.author_id = u.id WHERE b.is_published = true'
    const params: any[] = []
    
    if (category) {
      params.push(category)
      query += ` AND b.category = $${params.length}`
    }
    
    if (search) {
      params.push(`%${search}%`)
      query += ` AND (b.name ILIKE $${params.length} OR b.description ILIKE $${params.length})`
    }
    
    query += ' ORDER BY b.created_at DESC'
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

// Get block by ID
blockRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    
    const result = await pgPool.query(
      `SELECT * FROM blocks 
       WHERE id = $1 AND (type = 'system' OR is_published = true OR author_id = $2)`,
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Create new block
blockRouter.post('/', async (req, res, next) => {
  try {
    const { error, value } = createBlockSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const redisClient: RedisClientType = req.app.locals.redisClient
    
    const blockId = uuidv4()
    const result = await pgPool.query(
      `INSERT INTO blocks 
       (id, name, description, category, type, author_id, version, config_schema, inputs, outputs, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        blockId,
        value.name,
        value.description,
        value.category,
        'private', // User-created blocks start as private
        userId,
        '1.0.0',
        JSON.stringify(value.configSchema),
        JSON.stringify(value.inputs),
        JSON.stringify(value.outputs),
        value.icon || null,
        value.color || null,
      ]
    )
    
    // Clear cache
    await redisClient.del(`blocks:${userId}`)
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Publish block to community
blockRouter.post('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    
    const result = await pgPool.query(
      `UPDATE blocks SET is_published = true 
       WHERE id = $1 AND author_id = $2 AND type = 'private'
       RETURNING *`,
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found or unauthorized' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Delete block
blockRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    const redisClient: RedisClientType = req.app.locals.redisClient
    
    const result = await pgPool.query(
      'DELETE FROM blocks WHERE id = $1 AND author_id = $2 AND type = \'private\'',
      [id, userId]
    )
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Block not found or unauthorized' })
    }
    
    // Clear cache
    await redisClient.del(`blocks:${userId}`)
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})