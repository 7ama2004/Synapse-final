export interface BlockDefinition {
  type: string
  name: string
  description: string
  category: string
  icon?: React.ComponentType
  color?: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  config?: ConfigDefinition[]
}

export interface PortDefinition {
  id: string
  type: 'input' | 'output'
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'
  label: string
  required?: boolean
  multiple?: boolean
}

export interface ConfigDefinition {
  id: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'range'
  label: string
  description?: string
  default?: any
  options?: { value: any; label: string }[]
  min?: number
  max?: number
  step?: number
}