import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { logger } from '../utils/logger'

// JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip auth for health checks and public routes
    if (req.path === '/health' || req.path.startsWith('/public')) {
      return next()
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // In development, allow bypassing auth
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      (req as any).user = {
        sub: 'dev-user-id',
        email: 'dev@example.com',
        roles: ['user']
      }
      return next()
    }

    // Verify JWT token
    jwt.verify(token, getKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        logger.error('Token verification failed:', err)
        return res.status(401).json({ error: 'Invalid token' })
      }
      
      (req as any).user = decoded
      next()
    })
  } catch (error) {
    logger.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}