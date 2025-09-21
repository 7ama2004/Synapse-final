import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
    },
  })
}