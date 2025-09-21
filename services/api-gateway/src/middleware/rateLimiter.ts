import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Different rate limits for different endpoints
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Default limit
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).user?.sub || req.ip
  },
})

// Stricter limit for AI operations
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI rate limit exceeded, please try again later',
  keyGenerator: (req: Request) => {
    return `ai:${(req as any).user?.sub || req.ip}`
  },
})

// Stricter limit for workflow execution
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Execution rate limit exceeded, please try again later',
  keyGenerator: (req: Request) => {
    return `exec:${(req as any).user?.sub || req.ip}`
  },
})