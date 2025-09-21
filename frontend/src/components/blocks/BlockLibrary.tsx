'use client'

import { useState } from 'react'
import { Search, ChevronRight, FileText, Brain, Database, Eye, Settings } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { BlockDefinition } from '@/types/blocks'

// Sample block definitions
const BLOCK_CATEGORIES = [
  {
    name: 'Input',
    icon: FileText,
    blocks: [
      {
        type: 'input/text',
        name: 'Text Input',
        description: 'Input plain text or paste content',
        icon: FileText,
        color: '#10B981',
        inputs: [],
        outputs: [{ id: 'text', type: 'output', dataType: 'string', label: 'Text' }],
      },
      {
        type: 'input/file',
        name: 'File Upload',
        description: 'Upload PDF, TXT, or DOC files',
        icon: FileText,
        color: '#10B981',
        inputs: [],
        outputs: [{ id: 'content', type: 'output', dataType: 'string', label: 'Content' }],
      },
    ],
  },
  {
    name: 'AI Processing',
    icon: Brain,
    blocks: [
      {
        type: 'ai/summarize',
        name: 'Summarizer',
        description: 'Generate concise summaries',
        icon: Brain,
        color: '#8B5CF6',
        inputs: [{ id: 'text', type: 'input', dataType: 'string', label: 'Text', required: true }],
        outputs: [{ id: 'summary', type: 'output', dataType: 'string', label: 'Summary' }],
      },
      {
        type: 'ai/questions',
        name: 'Question Generator',
        description: 'Create quiz questions from text',
        icon: Brain,
        color: '#8B5CF6',
        inputs: [{ id: 'text', type: 'input', dataType: 'string', label: 'Text', required: true }],
        outputs: [{ id: 'questions', type: 'output', dataType: 'array', label: 'Questions' }],
      },
      {
        type: 'ai/flashcards',
        name: 'Flashcard Creator',
        description: 'Extract key terms and definitions',
        icon: Brain,
        color: '#8B5CF6',
        inputs: [{ id: 'text', type: 'input', dataType: 'string', label: 'Text', required: true }],
        outputs: [{ id: 'flashcards', type: 'output', dataType: 'array', label: 'Flashcards' }],
      },
    ],
  },
  {
    name: 'Display',
    icon: Eye,
    blocks: [
      {
        type: 'display/text',
        name: 'Text Display',
        description: 'Show formatted text output',
        icon: Eye,
        color: '#3B82F6',
        inputs: [{ id: 'text', type: 'input', dataType: 'string', label: 'Text', required: true }],
        outputs: [],
      },
      {
        type: 'display/quiz',
        name: 'Quiz Interface',
        description: 'Interactive quiz display',
        icon: Eye,
        color: '#3B82F6',
        inputs: [{ id: 'questions', type: 'input', dataType: 'array', label: 'Questions', required: true }],
        outputs: [{ id: 'results', type: 'output', dataType: 'object', label: 'Results' }],
      },
    ],
  },
]

export function BlockLibrary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Input', 'AI Processing']))
  const { addBlock } = useCanvasStore()
  
  const handleDragStart = (e: React.DragEvent, block: any) => {
    e.dataTransfer.setData('blockType', JSON.stringify(block))
  }
  
  const handleAddBlock = (block: any) => {
    addBlock({
      type: block.type,
      position: { x: 100, y: 100 },
      data: {
        name: block.name,
        description: block.description,
        category: block.type.split('/')[0],
        color: block.color,
        config: {},
        inputs: block.inputs,
        outputs: block.outputs,
      },
    })
  }
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }
  
  const filteredCategories = BLOCK_CATEGORIES.map(category => ({
    ...category,
    blocks: category.blocks.filter(block =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.blocks.length > 0)
  
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Blocks</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategories.has(category.name)
          
          return (
            <div key={category.name} className="border-b">
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
              
              {isExpanded && (
                <div className="pb-2">
                  {category.blocks.map((block) => (
                    <div
                      key={block.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, block)}
                      onClick={() => handleAddBlock(block)}
                      className="mx-2 px-3 py-2 rounded-md hover:bg-accent cursor-move group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: block.color }}
                        />
                        <span className="text-sm">{block.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {block.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}