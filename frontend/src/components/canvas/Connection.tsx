'use client'

import { Line, Circle } from 'react-konva'
import { Connection as ConnectionType } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'
import { useMemo } from 'react'

interface ConnectionProps {
  connection: ConnectionType
}

export function Connection({ connection }: ConnectionProps) {
  const { blocks, disconnectBlocks } = useCanvasStore()
  
  const points = useMemo(() => {
    const sourceBlock = blocks.get(connection.source.blockId)
    const targetBlock = blocks.get(connection.target.blockId)
    
    if (!sourceBlock || !targetBlock) return []
    
    const sourcePort = sourceBlock.data.outputs.find(p => p.id === connection.source.portId)
    const targetPort = targetBlock.data.inputs.find(p => p.id === connection.target.portId)
    
    if (!sourcePort || !targetPort) return []
    
    // Calculate port positions
    const sourcePortIndex = sourceBlock.data.outputs.indexOf(sourcePort)
    const targetPortIndex = targetBlock.data.inputs.indexOf(targetPort)
    
    const getPortY = (index: number, total: number, height: number) => {
      if (total === 1) return height / 2
      const portSpacing = 24
      const totalHeight = (total - 1) * portSpacing
      const startY = (height - totalHeight) / 2
      return startY + index * portSpacing
    }
    
    const sourceX = sourceBlock.position.x + (sourceBlock.size?.width || 200)
    const sourceY = sourceBlock.position.y + getPortY(
      sourcePortIndex,
      sourceBlock.data.outputs.length,
      sourceBlock.size?.height || 100
    )
    
    const targetX = targetBlock.position.x
    const targetY = targetBlock.position.y + getPortY(
      targetPortIndex,
      targetBlock.data.inputs.length,
      targetBlock.size?.height || 100
    )
    
    // Create bezier curve control points
    const distance = Math.abs(targetX - sourceX)
    const controlOffset = Math.min(distance * 0.5, 100)
    
    return [
      sourceX, sourceY,
      sourceX + controlOffset, sourceY,
      targetX - controlOffset, targetY,
      targetX, targetY
    ]
  }, [blocks, connection])
  
  if (points.length === 0) return null
  
  return (
    <>
      <Line
        points={points}
        stroke="#9CA3AF"
        strokeWidth={2}
        bezier
        onClick={() => disconnectBlocks(connection.id)}
        onMouseEnter={(e) => {
          const stage = e.target.getStage()
          if (stage) {
            stage.container().style.cursor = 'pointer'
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage()
          if (stage) {
            stage.container().style.cursor = 'default'
          }
        }}
      />
      {/* Connection dots for better visibility */}
      <Circle
        x={points[0]}
        y={points[1]}
        radius={3}
        fill="#9CA3AF"
      />
      <Circle
        x={points[6]}
        y={points[7]}
        radius={3}
        fill="#9CA3AF"
      />
    </>
  )
}