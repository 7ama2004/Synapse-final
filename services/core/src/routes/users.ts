import { Router } from 'express'
import { Pool } from 'pg'
import { logger } from '../utils/logger'

export const userRouter = Router()

// Get current user
userRouter.get('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const userEmail = req.headers['x-user-email'] as string
    const pgPool: Pool = req.app.locals.pgPool
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Check if user exists
    let result = await pgPool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    )
    
    // Create user if doesn't exist (first login)
    if (result.rows.length === 0) {
      result = await pgPool.query(
        'INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING *',
        [userId, userEmail, userEmail?.split('@')[0] || 'User']
      )
    }
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Update user profile
userRouter.put('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const { name, avatarUrl } = req.body
    const pgPool: Pool = req.app.locals.pgPool
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const result = await pgPool.query(
      `UPDATE users SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [name, avatarUrl, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Get user stats
userRouter.get('/me/stats', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const pgPool: Pool = req.app.locals.pgPool
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get workflow count
    const workflowCount = await pgPool.query(
      'SELECT COUNT(*) as count FROM workflows WHERE author_id = $1',
      [userId]
    )
    
    // Get block count
    const blockCount = await pgPool.query(
      'SELECT COUNT(*) as count FROM blocks WHERE author_id = $1',
      [userId]
    )
    
    // Get execution count
    const executionCount = await pgPool.query(
      'SELECT COUNT(*) as count FROM block_usage WHERE user_id = $1',
      [userId]
    )
    
    res.json({
      workflows: parseInt(workflowCount.rows[0].count),
      blocks: parseInt(blockCount.rows[0].count),
      executions: parseInt(executionCount.rows[0].count),
    })
  } catch (error) {
    next(error)
  }
})