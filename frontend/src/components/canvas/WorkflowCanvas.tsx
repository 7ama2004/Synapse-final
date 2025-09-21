'use client'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { useCanvasStore } from '@/stores/canvasStore'
import { BlockNode } from './BlockNode'
import { Connection } from './Connection'
import { SelectionBox } from './SelectionBox'
import { ContextMenu } from './ContextMenu'

export function WorkflowCanvas() {
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  const {
    blocks,
    connections,
    selectedBlocks,
    viewport,
    addBlock,
    selectBlock,
    deselectAll,
    moveBlock,
    deleteBlock,
    setViewport,
  } = useCanvasStore()

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('canvas-container')
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedBlocks.forEach(id => deleteBlock(id))
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        // Select all blocks
        blocks.forEach(block => selectBlock(block.id, false))
      } else if (e.key === 'Escape') {
        deselectAll()
        setContextMenu(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBlocks, blocks, deleteBlock, selectBlock, deselectAll])

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty space
    if (e.target === e.target.getStage()) {
      deselectAll()
      setContextMenu(null)
    }
  }

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    if (stage) {
      const pointerPosition = stage.getPointerPosition()
      if (pointerPosition) {
        setContextMenu({ x: pointerPosition.x, y: pointerPosition.y })
      }
    }
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    if (!stage) return

    const oldScale = viewport.scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1
    const clampedScale = Math.max(0.1, Math.min(5, newScale))

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }

    setViewport({ ...newPos, scale: clampedScale })
    stage.position(newPos)
    stage.scale({ x: clampedScale, y: clampedScale })
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage()
    if (stage) {
      setViewport({
        x: stage.x(),
        y: stage.y(),
        scale: viewport.scale,
      })
    }
  }

  return (
    <div id="canvas-container" className="flex-1 relative canvas-container">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Layer>
          {/* Render connections first (behind blocks) */}
          {Array.from(connections.values()).map(connection => (
            <Connection key={connection.id} connection={connection} />
          ))}
          
          {/* Render blocks */}
          {Array.from(blocks.values()).map(block => (
            <BlockNode key={block.id} block={block} />
          ))}
          
          {/* Selection box */}
          <SelectionBox />
        </Layer>
      </Stage>
      
      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}