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
    body: req.body,
    user: (req as any).user?.sub,
  })

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(isDev && { stack: err.stack }),
    },
  })
}