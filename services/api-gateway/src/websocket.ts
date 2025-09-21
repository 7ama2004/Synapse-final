import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { logger } from './utils/logger'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
}

export function setupWebSocket(io: SocketIOServer) {
  // Authentication middleware for WebSocket
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Authentication required'))
    }
    
    try {
      // TODO: Verify JWT token properly with Auth0
      // For now, decode without verification (DEVELOPMENT ONLY)
      const decoded = jwt.decode(token) as any
      
      if (!decoded) {
        return next(new Error('Invalid token'))
      }
      
      socket.userId = decoded.sub
      socket.userEmail = decoded.email
      
      next()
    } catch (err) {
      logger.error('WebSocket auth error:', err)
      next(new Error('Authentication failed'))
    }
  })
  
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId}`)
    
    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
    }
    
    // Handle workflow execution events
    socket.on('execution:subscribe', (executionId: string) => {
      socket.join(`execution:${executionId}`)
      logger.info(`User ${socket.userId} subscribed to execution ${executionId}`)
    })
    
    socket.on('execution:unsubscribe', (executionId: string) => {
      socket.leave(`execution:${executionId}`)
    })
    
    // Handle canvas collaboration events
    socket.on('canvas:join', (workflowId: string) => {
      socket.join(`canvas:${workflowId}`)
      
      // Notify others in the room
      socket.to(`canvas:${workflowId}`).emit('canvas:user-joined', {
        userId: socket.userId,
        userEmail: socket.userEmail,
      })
    })
    
    socket.on('canvas:leave', (workflowId: string) => {
      socket.leave(`canvas:${workflowId}`)
      
      socket.to(`canvas:${workflowId}`).emit('canvas:user-left', {
        userId: socket.userId,
      })
    })
    
    socket.on('canvas:update', (data: {
      workflowId: string
      changes: any
    }) => {
      // Broadcast changes to others in the room
      socket.to(`canvas:${data.workflowId}`).emit('canvas:updated', {
        userId: socket.userId,
        changes: data.changes,
        timestamp: new Date(),
      })
    })
    
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`)
    })
  })
  
  // Function to emit execution updates from services
  ;(global as any).emitExecutionUpdate = (
    executionId: string,
    update: any
  ) => {
    io.to(`execution:${executionId}`).emit('execution:update', update)
  }
}