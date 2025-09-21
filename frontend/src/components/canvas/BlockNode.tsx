'use client'

import { useRef, useEffect } from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import Konva from 'konva'
import { BlockNode as BlockNodeType } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

interface BlockNodeProps {
  block: BlockNodeType
}

export function BlockNode({ block }: BlockNodeProps) {
  const groupRef = useRef<Konva.Group>(null)
  const { selectBlock, deselectBlock, moveBlock, selectedBlocks } = useCanvasStore()
  
  const isSelected = selectedBlocks.has(block.id)
  const width = block.size?.width || 200
  const height = block.size?.height || 100
  
  // Port configuration
  const portRadius = 6
  const portSpacing = 24
  
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    const multiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey
    selectBlock(block.id, multiSelect)
  }
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    moveBlock(block.id, node.x(), node.y())
  }
  
  // Calculate port positions
  const inputPorts = block.data.inputs || []
  const outputPorts = block.data.outputs || []
  
  const getPortY = (index: number, total: number) => {
    if (total === 1) return height / 2
    const totalHeight = (total - 1) * portSpacing
    const startY = (height - totalHeight) / 2
    return startY + index * portSpacing
  }
  
  return (
    <Group
      ref={groupRef}
      x={block.position.x}
      y={block.position.y}
      draggable
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => {
        const stage = groupRef.current?.getStage()
        if (stage) {
          stage.container().style.cursor = 'move'
        }
      }}
      onMouseLeave={() => {
        const stage = groupRef.current?.getStage()
        if (stage) {
          stage.container().style.cursor = 'default'
        }
      }}
    >
      {/* Main block rectangle */}
      <Rect
        width={width}
        height={height}
        fill={block.data.color || '#4F46E5'}
        cornerRadius={8}
        stroke={isSelected ? '#3730A3' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowBlur={isSelected ? 10 : 5}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffsetY={2}
      />
      
      {/* Block name */}
      <Text
        text={block.data.name}
        fontSize={14}
        fontFamily="Inter, sans-serif"
        fill="white"
        width={width}
        padding={12}
        align="center"
        verticalAlign="middle"
      />
      
      {/* Input ports */}
      {inputPorts.map((port, index) => (
        <Group key={port.id}>
          <Circle
            x={0}
            y={getPortY(index, inputPorts.length)}
            radius={portRadius}
            fill="#E5E7EB"
            stroke="#9CA3AF"
            strokeWidth={1}
            shadowBlur={2}
            shadowColor="rgba(0, 0, 0, 0.1)"
          />
          <Text
            x={portRadius + 4}
            y={getPortY(index, inputPorts.length) - 6}
            text={port.label}
            fontSize={10}
            fill="#6B7280"
          />
        </Group>
      ))}
      
      {/* Output ports */}
      {outputPorts.map((port, index) => (
        <Group key={port.id}>
          <Circle
            x={width}
            y={getPortY(index, outputPorts.length)}
            radius={portRadius}
            fill="#E5E7EB"
            stroke="#9CA3AF"
            strokeWidth={1}
            shadowBlur={2}
            shadowColor="rgba(0, 0, 0, 0.1)"
          />
          <Text
            x={width - 40}
            y={getPortY(index, outputPorts.length) - 6}
            text={port.label}
            fontSize={10}
            fill="#6B7280"
            align="right"
          />
        </Group>
      ))}
    </Group>
  )
}