import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { logger } from '../utils/logger'

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/workflows/public',
  '/api/blocks/public',
  '/api/auth/login',
  '/api/auth/register',
]

// Initialize JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err)
    } else {
      const signingKey = key?.getPublicKey()
      callback(null, signingKey)
    }
  })
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip auth for public endpoints
  if (PUBLIC_ENDPOINTS.some(endpoint => req.path.startsWith(endpoint))) {
    return next()
  }

  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    // Verify JWT token
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          logger.error('JWT verification failed:', err)
          return res.status(401).json({ error: 'Invalid token' })
        }

        // Attach user info to request
        (req as any).user = decoded
        next()
      }
    )
  } catch (error) {
    logger.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}