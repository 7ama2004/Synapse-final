'use client'

import { Button } from '@/components/ui/button'
import { useCanvasStore } from '@/stores/canvasStore'
import {
  Save,
  Download,
  Upload,
  Play,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'

export function CanvasToolbar() {
  const { viewport, setViewport, exportWorkflow } = useCanvasStore()
  
  const handleZoomIn = () => {
    setViewport({
      ...viewport,
      scale: Math.min(viewport.scale * 1.2, 5),
    })
  }
  
  const handleZoomOut = () => {
    setViewport({
      ...viewport,
      scale: Math.max(viewport.scale / 1.2, 0.1),
    })
  }
  
  const handleZoomReset = () => {
    setViewport({ x: 0, y: 0, scale: 1 })
  }
  
  const handleSave = () => {
    const workflow = exportWorkflow()
    console.log('Saving workflow:', workflow)
    // TODO: Implement save to backend
  }
  
  const handleExport = () => {
    const workflow = exportWorkflow()
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleRun = () => {
    console.log('Running workflow...')
    // TODO: Implement workflow execution
  }
  
  return (
    <div className="h-14 border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-2" />
        
        <Button variant="ghost" size="icon" disabled>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button onClick={handleRun} className="gap-2">
          <Play className="h-4 w-4" />
          Run Workflow
        </Button>
        
        <div className="w-px h-8 bg-border mx-2" />
        
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[60px] text-center">
          {Math.round(viewport.scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}