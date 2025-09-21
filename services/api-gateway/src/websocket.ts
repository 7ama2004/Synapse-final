import { Server as SocketIOServer } from 'socket.io'
import { logger } from './utils/logger'

export const setupWebSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`)

    // Join execution room for real-time updates
    socket.on('join-execution', (executionId: string) => {
      socket.join(`execution:${executionId}`)
      logger.info(`Client ${socket.id} joined execution room: ${executionId}`)
    })

    // Leave execution room
    socket.on('leave-execution', (executionId: string) => {
      socket.leave(`execution:${executionId}`)
      logger.info(`Client ${socket.id} left execution room: ${executionId}`)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
    })
  })

  // Broadcast execution updates
  const broadcastExecutionUpdate = (executionId: string, update: any) => {
    io.to(`execution:${executionId}`).emit('execution-update', update)
  }

  return { broadcastExecutionUpdate }
}