export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface Port {
  id: string
  type: 'input' | 'output'
  dataType: string
  label: string
  required?: boolean
  connected?: boolean
}

export interface BlockNode {
  id: string
  type: string
  position: Position
  size?: Size
  data: {
    name: string
    description?: string
    category: string
    icon?: string
    color?: string
    config: Record<string, any>
    inputs: Port[]
    outputs: Port[]
  }
  selected?: boolean
}

export interface Connection {
  id: string
  source: {
    blockId: string
    portId: string
  }
  target: {
    blockId: string
    portId: string
  }
}

export interface CanvasContextMenu {
  x: number
  y: number
  items: ContextMenuItem[]
}

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  action: () => void
  divider?: boolean
  disabled?: boolean
}