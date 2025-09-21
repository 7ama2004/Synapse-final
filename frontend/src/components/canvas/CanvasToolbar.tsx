'use client'

import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Save, Play, Square } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'

export function CanvasToolbar() {
  const { viewport, setViewport, clearCanvas, exportWorkflow } = useCanvasStore()

  const handleZoomIn = () => {
    const newScale = Math.min(5, viewport.scale * 1.2)
    setViewport({ ...viewport, scale: newScale })
  }

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, viewport.scale / 1.2)
    setViewport({ ...viewport, scale: newScale })
  }

  const handleReset = () => {
    setViewport({ x: 0, y: 0, scale: 1 })
  }

  const handleSave = () => {
    const workflow = exportWorkflow()
    console.log('Exporting workflow:', workflow)
    // TODO: Implement actual save functionality
  }

  const handleRun = () => {
    console.log('Running workflow...')
    // TODO: Implement workflow execution
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      clearCanvas()
    }
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
      
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button size="sm" onClick={handleRun}>
          <Play className="h-4 w-4" />
          Run
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClear}>
          <Square className="h-4 w-4" />
          Clear
        </Button>
      </div>
      
      <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
        Zoom: {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  )
}