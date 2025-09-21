'use client'

import { useEffect, useRef } from 'react'
import { Plus, Copy, Trash2, Settings } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { selectedBlocks, deleteBlock, addBlock } = useCanvasStore()
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  const handleAddBlock = () => {
    // Add a new block at the context menu position
    addBlock({
      type: 'input/text',
      position: { x, y },
      data: {
        name: 'Text Input',
        category: 'input',
        color: '#10B981',
        config: {},
        inputs: [],
        outputs: [
          {
            id: 'text',
            type: 'output',
            dataType: 'string',
            label: 'Text',
          },
        ],
      },
    })
    onClose()
  }
  
  const handleDelete = () => {
    selectedBlocks.forEach(id => deleteBlock(id))
    onClose()
  }
  
  return (
    <div
      ref={menuRef}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] z-50"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4" />
        Add Block
      </button>
      
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      
      <button
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        disabled={selectedBlocks.size === 0}
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </button>
      
      <button
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        disabled={selectedBlocks.size === 0}
      >
        <Settings className="h-4 w-4" />
        Configure
      </button>
      
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      
      <button
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
        onClick={handleDelete}
        disabled={selectedBlocks.size === 0}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  )
}