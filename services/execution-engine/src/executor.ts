import axios from 'axios'
import { VM } from 'vm2'
import { logger } from './utils/logger'

interface WorkflowExecution {
  workflowId: string
  userId: string
  definition: any
  inputs: Record<string, any>
}

interface BlockExecution {
  blockId: string
  type: string
  config: any
  inputs: Record<string, any>
}

export class WorkflowExecutor {
  private blockExecutors: Map<string, Function>
  
  constructor() {
    this.blockExecutors = new Map()
    this.registerBuiltInExecutors()
  }
  
  private registerBuiltInExecutors() {
    // Input blocks
    this.blockExecutors.set('input/text', async (block: BlockExecution) => {
      return { text: block.config.text || '' }
    })
    
    // AI blocks
    this.blockExecutors.set('ai/summarize', async (block: BlockExecution) => {
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:3004'}/summarize`,
        {
          text: block.inputs.text,
          style: block.config.style || 'brief',
          max_length: block.config.maxLength,
          model: block.config.model || 'gpt-4',
        }
      )
      return { summary: response.data.summary }
    })
    
    this.blockExecutors.set('ai/questions', async (block: BlockExecution) => {
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:3004'}/generate-questions`,
        {
          text: block.inputs.text,
          question_type: block.config.questionType || 'multiple-choice',
          difficulty: block.config.difficulty || 'medium',
          count: block.config.count || 5,
          model: block.config.model || 'gpt-4',
        }
      )
      return { questions: response.data.questions }
    })
    
    this.blockExecutors.set('ai/flashcards', async (block: BlockExecution) => {
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:3004'}/generate-flashcards`,
        {
          text: block.inputs.text,
          max_cards: block.config.maxCards || 20,
          include_definitions: block.config.includeDefinitions !== false,
          model: block.config.model || 'gpt-4',
        }
      )
      return { flashcards: response.data.flashcards }
    })
    
    // Display blocks (just pass through for now)
    this.blockExecutors.set('display/text', async (block: BlockExecution) => {
      return { displayed: true, content: block.inputs.text }
    })
    
    this.blockExecutors.set('display/quiz', async (block: BlockExecution) => {
      return { displayed: true, questions: block.inputs.questions }
    })
  }
  
  async execute(execution: WorkflowExecution): Promise<any> {
    const { definition, inputs } = execution
    const { canvas } = definition
    
    // Build execution plan
    const executionPlan = this.buildExecutionPlan(canvas)
    
    // Execute blocks in order
    const blockOutputs = new Map<string, any>()
    
    // Set initial inputs
    Object.entries(inputs).forEach(([key, value]) => {
      blockOutputs.set(`input.${key}`, value)
    })
    
    for (const stage of executionPlan.stages) {
      // Execute blocks in parallel within each stage
      await Promise.all(
        stage.map(async (blockId) => {
          const block = canvas.blocks.find((b: any) => b.id === blockId)
          if (!block) {
            logger.error(`Block ${blockId} not found`)
            return
          }
          
          // Gather inputs from connections
          const blockInputs = this.gatherBlockInputs(
            blockId,
            canvas.connections,
            blockOutputs
          )
          
          // Execute block
          try {
            const executor = this.blockExecutors.get(block.type)
            if (!executor) {
              logger.error(`No executor for block type: ${block.type}`)
              return
            }
            
            const result = await executor({
              blockId,
              type: block.type,
              config: block.config,
              inputs: blockInputs,
            })
            
            blockOutputs.set(blockId, result)
            logger.info(`Block ${blockId} executed successfully`)
          } catch (error) {
            logger.error(`Block ${blockId} execution failed:`, error)
            throw error
          }
        })
      )
    }
    
    // Return final outputs
    const finalOutputs: any = {}
    blockOutputs.forEach((value, key) => {
      if (!key.startsWith('input.')) {
        finalOutputs[key] = value
      }
    })
    
    return finalOutputs
  }
  
  private buildExecutionPlan(canvas: any): { stages: string[][] } {
    const blocks = canvas.blocks
    const connections = canvas.connections
    
    // Build dependency graph
    const dependencies = new Map<string, Set<string>>()
    const allBlocks = new Set<string>()
    
    blocks.forEach((block: any) => {
      allBlocks.add(block.id)
      dependencies.set(block.id, new Set())
    })
    
    connections.forEach((conn: any) => {
      const deps = dependencies.get(conn.target.blockId)
      if (deps) {
        deps.add(conn.source.blockId)
      }
    })
    
    // Topological sort to create stages
    const stages: string[][] = []
    const visited = new Set<string>()
    
    while (visited.size < allBlocks.size) {
      const stage: string[] = []
      
      allBlocks.forEach((blockId) => {
        if (!visited.has(blockId)) {
          const deps = dependencies.get(blockId) || new Set()
          const allDepsVisited = Array.from(deps).every(dep => visited.has(dep))
          
          if (allDepsVisited) {
            stage.push(blockId)
          }
        }
      })
      
      if (stage.length === 0) {
        logger.error('Circular dependency detected in workflow')
        break
      }
      
      stage.forEach(blockId => visited.add(blockId))
      stages.push(stage)
    }
    
    return { stages }
  }
  
  private gatherBlockInputs(
    blockId: string,
    connections: any[],
    outputs: Map<string, any>
  ): Record<string, any> {
    const inputs: Record<string, any> = {}
    
    connections
      .filter((conn: any) => conn.target.blockId === blockId)
      .forEach((conn: any) => {
        const sourceOutput = outputs.get(conn.source.blockId)
        if (sourceOutput) {
          const outputValue = sourceOutput[conn.source.port] || sourceOutput
          inputs[conn.target.port] = outputValue
        }
      })
    
    return inputs
  }
}