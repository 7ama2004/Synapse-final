'use client'

import { useState, useEffect } from 'react'
import { Rect } from 'react-konva'
import Konva from 'konva'

export function SelectionBox() {
  const [selection, setSelection] = useState<{
    x: number
    y: number
    width: number
    height: number
    visible: boolean
  }>({ x: 0, y: 0, width: 0, height: 0, visible: false })
  
  useEffect(() => {
    let startX = 0
    let startY = 0
    let isSelecting = false
    
    const handleMouseDown = (e: MouseEvent) => {
      // Only start selection on left click with no modifiers
      if (e.button !== 0 || e.target !== e.currentTarget) return
      
      isSelecting = true
      startX = e.clientX
      startY = e.clientY
      
      setSelection({
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        visible: true,
      })
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting) return
      
      const currentX = e.clientX
      const currentY = e.clientY
      
      setSelection({
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY),
        visible: true,
      })
    }
    
    const handleMouseUp = () => {
      if (!isSelecting) return
      
      isSelecting = false
      setSelection(prev => ({ ...prev, visible: false }))
      
      // TODO: Select blocks within selection rectangle
    }
    
    // Attach listeners to canvas container
    const container = document.getElementById('canvas-container')
    if (container) {
      container.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])
  
  if (!selection.visible) return null
  
  return (
    <Rect
      x={selection.x}
      y={selection.y}
      width={selection.width}
      height={selection.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3B82F6"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  )
}