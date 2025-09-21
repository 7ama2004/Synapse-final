'use client'

import { Rect } from 'react-konva'
import { useCanvasStore } from '@/stores/canvasStore'

export function SelectionBox() {
  const { selectionBox } = useCanvasStore()

  if (!selectionBox) return null

  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3B82F6"
      strokeWidth={1}
      dash={[5, 5]}
    />
  )
}