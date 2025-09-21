'use client'

import dynamic from 'next/dynamic'
import { BlockLibrary } from '@/components/blocks/BlockLibrary'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { WorkflowSidebar } from '@/components/workflows/WorkflowSidebar'

const WorkflowCanvas = dynamic(
  () =>
    import('@/components/canvas/WorkflowCanvas').then(
      (mod) => mod.WorkflowCanvas,
    ),
  { ssr: false },
)

export default function CanvasPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Block Library Sidebar */}
      <BlockLibrary />
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <CanvasToolbar />
        <WorkflowCanvas />
      </div>
      
      {/* Workflow Properties Sidebar */}
      <WorkflowSidebar />
    </div>
  )
}