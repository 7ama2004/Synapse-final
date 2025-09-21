'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FileText, Upload, Brain, Eye, Zap } from 'lucide-react'

interface Block {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
}

const blocks: Block[] = [
  {
    id: 'text-input',
    name: 'Text Input',
    description: 'Input plain text or paste content',
    category: 'input',
    icon: 'FileText',
    color: '#10B981'
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Upload PDF, TXT, or DOC files',
    category: 'input',
    icon: 'Upload',
    color: '#10B981'
  },
  {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Generate concise summaries using AI',
    category: 'ai',
    icon: 'Brain',
    color: '#8B5CF6'
  },
  {
    id: 'question-generator',
    name: 'Question Generator',
    description: 'Create quiz questions from text',
    category: 'ai',
    icon: 'Brain',
    color: '#8B5CF6'
  },
  {
    id: 'text-display',
    name: 'Text Display',
    description: 'Display formatted text output',
    category: 'display',
    icon: 'Eye',
    color: '#3B82F6'
  },
  {
    id: 'quiz-interface',
    name: 'Quiz Interface',
    description: 'Interactive quiz display with scoring',
    category: 'display',
    icon: 'Eye',
    color: '#3B82F6'
  }
]

const categories = [
  { id: 'all', name: 'All Blocks', icon: Zap },
  { id: 'input', name: 'Input', icon: FileText },
  { id: 'ai', name: 'AI Processing', icon: Brain },
  { id: 'display', name: 'Display', icon: Eye }
]

export function BlockLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="h-5 w-5" />
      case 'Upload': return <Upload className="h-5 w-5" />
      case 'Brain': return <Brain className="h-5 w-5" />
      case 'Eye': return <Eye className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Block Library
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredBlocks.map((block) => (
            <div
              key={block.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              style={{ borderLeftColor: block.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: block.color }}
                >
                  {getIcon(block.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {block.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {block.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}