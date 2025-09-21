'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Folder, Star } from 'lucide-react'

export function WorkflowSidebar() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Workflows', count: 12 },
    { id: 'my', name: 'My Workflows', count: 5 },
    { id: 'starred', name: 'Starred', count: 3 },
    { id: 'shared', name: 'Shared', count: 4 }
  ]

  const workflows = [
    {
      id: '1',
      name: 'Study Notes Generator',
      description: 'Generate study notes from lecture content',
      author: 'John Doe',
      stars: 15,
      isStarred: true,
      lastModified: '2 hours ago'
    },
    {
      id: '2',
      name: 'Quiz Creator',
      description: 'Create quizzes from study materials',
      author: 'Jane Smith',
      stars: 8,
      isStarred: false,
      lastModified: '1 day ago'
    },
    {
      id: '3',
      name: 'Flashcard Maker',
      description: 'Generate flashcards for memorization',
      author: 'Mike Johnson',
      stars: 23,
      isStarred: true,
      lastModified: '3 days ago'
    }
  ]

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workflows
          </h2>
          <Button size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {category.name}
              </div>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {workflow.name}
                </h3>
                <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                  <Star className={`h-4 w-4 ${workflow.isStarred ? 'fill-current text-yellow-500' : ''}`} />
                </button>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {workflow.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>by {workflow.author}</span>
                <div className="flex items-center gap-2">
                  <span>{workflow.stars} stars</span>
                  <span>•</span>
                  <span>{workflow.lastModified}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}