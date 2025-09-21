// User types
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  roles: Role[]
  createdAt: Date
  updatedAt: Date
}

export enum Role {
  USER = 'user',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// Workflow types
export interface Workflow {
  id: string
  name: string
  description?: string
  authorId: string
  author?: User
  thumbnailUrl?: string
  isPublic: boolean
  tags: string[]
  version: number
  forkCount: number
  starCount: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowDefinition {
  workflowId: string
  canvas: {
    blocks: CanvasBlock[]
    connections: CanvasConnection[]
    viewport: CanvasViewport
  }
  executionPlan?: ExecutionPlan
  metadata: {
    version: number
    lastModified: Date
    checksum: string
  }
}

// Canvas types
export interface CanvasBlock {
  id: string
  blockId: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
  config: Record<string, any>
}

export interface CanvasConnection {
  id: string
  source: { blockId: string; port: string }
  target: { blockId: string; port: string }
  type: 'data' | 'control'
}

export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

// Block types
export interface Block {
  id: string
  name: string
  description?: string
  category: string
  type: 'system' | 'community' | 'private'
  authorId?: string
  author?: User
  version: string
  configSchema: Record<string, any>
  inputs: BlockPort[]
  outputs: BlockPort[]
  icon?: string
  color?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BlockPort {
  id: string
  type: 'input' | 'output'
  dataType: DataType
  label: string
  description?: string
  required?: boolean
  multiple?: boolean
  default?: any
}

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  FILE = 'file',
  ANY = 'any',
}

// Execution types
export interface ExecutionPlan {
  stages: string[][] // Array of parallel execution stages
  dependencies: Record<string, string[]>
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  userId: string
  startTime: Date
  endTime?: Date
  status: ExecutionStatus
  error?: string
  blocks: BlockExecution[]
}

export interface BlockExecution {
  blockId: string
  startTime: Date
  endTime?: Date
  status: ExecutionStatus
  inputs: Record<string, any>
  outputs?: Record<string, any>
  error?: string
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// API types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// WebSocket events
export interface WebSocketEvent {
  type: string
  payload: any
  timestamp: Date
}

export interface ExecutionUpdateEvent extends WebSocketEvent {
  type: 'execution.update'
  payload: {
    executionId: string
    blockId?: string
    status: ExecutionStatus
    progress?: number
    output?: any
  }
}