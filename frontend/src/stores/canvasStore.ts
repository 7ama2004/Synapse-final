import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { BlockNode, Connection, Port, Viewport } from '@/types/canvas'
import { nanoid } from 'nanoid'

interface CanvasState {
  // Canvas state
  blocks: Map<string, BlockNode>
  connections: Map<string, Connection>
  selectedBlocks: Set<string>
  viewport: Viewport
  
  // Actions
  addBlock: (block: Omit<BlockNode, 'id'>) => string
  updateBlock: (id: string, updates: Partial<BlockNode>) => void
  moveBlock: (id: string, x: number, y: number) => void
  deleteBlock: (id: string) => void
  
  connectBlocks: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void
  disconnectBlocks: (connectionId: string) => void
  
  selectBlock: (id: string, multi?: boolean) => void
  deselectBlock: (id: string) => void
  deselectAll: () => void
  
  setViewport: (viewport: Viewport) => void
  
  // Workflow operations
  clearCanvas: () => void
  loadWorkflow: (blocks: BlockNode[], connections: Connection[]) => void
  exportWorkflow: () => { blocks: BlockNode[]; connections: Connection[] }
}

export const useCanvasStore = create<CanvasState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        blocks: new Map(),
        connections: new Map(),
        selectedBlocks: new Set(),
        viewport: { x: 0, y: 0, scale: 1 },
        
        // Block actions
        addBlock: (block) => {
          const id = nanoid()
          const newBlock: BlockNode = {
            ...block,
            id,
          }
          
          set((state) => {
            state.blocks.set(id, newBlock)
          })
          
          return id
        },
        
        updateBlock: (id, updates) => {
          set((state) => {
            const block = state.blocks.get(id)
            if (block) {
              state.blocks.set(id, { ...block, ...updates })
            }
          })
        },
        
        moveBlock: (id, x, y) => {
          set((state) => {
            const block = state.blocks.get(id)
            if (block) {
              block.position = { x, y }
            }
          })
        },
        
        deleteBlock: (id) => {
          set((state) => {
            state.blocks.delete(id)
            state.selectedBlocks.delete(id)
            
            // Remove all connections to/from this block
            const connectionsToRemove: string[] = []
            state.connections.forEach((conn, connId) => {
              if (conn.source.blockId === id || conn.target.blockId === id) {
                connectionsToRemove.push(connId)
              }
            })
            
            connectionsToRemove.forEach(connId => {
              state.connections.delete(connId)
            })
          })
        },
        
        // Connection actions
        connectBlocks: (sourceId, sourcePort, targetId, targetPort) => {
          const id = nanoid()
          const connection: Connection = {
            id,
            source: { blockId: sourceId, portId: sourcePort },
            target: { blockId: targetId, portId: targetPort },
          }
          
          set((state) => {
            // Check if connection already exists
            let exists = false
            state.connections.forEach(conn => {
              if (
                conn.source.blockId === sourceId &&
                conn.source.portId === sourcePort &&
                conn.target.blockId === targetId &&
                conn.target.portId === targetPort
              ) {
                exists = true
              }
            })
            
            if (!exists) {
              state.connections.set(id, connection)
            }
          })
        },
        
        disconnectBlocks: (connectionId) => {
          set((state) => {
            state.connections.delete(connectionId)
          })
        },
        
        // Selection actions
        selectBlock: (id, multi = false) => {
          set((state) => {
            if (!multi) {
              state.selectedBlocks.clear()
            }
            state.selectedBlocks.add(id)
          })
        },
        
        deselectBlock: (id) => {
          set((state) => {
            state.selectedBlocks.delete(id)
          })
        },
        
        deselectAll: () => {
          set((state) => {
            state.selectedBlocks.clear()
          })
        },
        
        // Viewport actions
        setViewport: (viewport) => {
          set((state) => {
            state.viewport = viewport
          })
        },
        
        // Workflow operations
        clearCanvas: () => {
          set((state) => {
            state.blocks.clear()
            state.connections.clear()
            state.selectedBlocks.clear()
            state.viewport = { x: 0, y: 0, scale: 1 }
          })
        },
        
        loadWorkflow: (blocks, connections) => {
          set((state) => {
            state.blocks.clear()
            state.connections.clear()
            state.selectedBlocks.clear()
            
            blocks.forEach(block => {
              state.blocks.set(block.id, block)
            })
            
            connections.forEach(conn => {
              state.connections.set(conn.id, conn)
            })
          })
        },
        
        exportWorkflow: () => {
          const state = get()
          return {
            blocks: Array.from(state.blocks.values()),
            connections: Array.from(state.connections.values()),
          }
        },
      })),
      {
        name: 'canvas-store',
      }
    )
  )
)