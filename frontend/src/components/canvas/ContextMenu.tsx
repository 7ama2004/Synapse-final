'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { addBlock } = useCanvasStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleAddBlock = (type: string) => {
    addBlock({
      type,
      position: { x, y },
      data: {
        name: type,
        description: `A ${type} block`,
        category: 'input',
        config: {},
        inputs: [],
        outputs: []
      }
    })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
    >
      <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
        Add Block
      </div>
      <button
        onClick={() => handleAddBlock('Text Input')}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Text Input
      </button>
      <button
        onClick={() => handleAddBlock('File Upload')}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        File Upload
      </button>
      <button
        onClick={() => handleAddBlock('Summarizer')}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Summarizer
      </button>
      <button
        onClick={() => handleAddBlock('Question Generator')}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Question Generator
      </button>
    </div>
  )
}