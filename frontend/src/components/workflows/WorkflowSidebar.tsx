'use client'

import { useState } from 'react'
import { X, Settings, Info } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { Button } from '@/components/ui/button'

export function WorkflowSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { selectedBlocks, blocks } = useCanvasStore()
  
  const selectedBlock = selectedBlocks.size === 1 
    ? blocks.get(Array.from(selectedBlocks)[0])
    : null
  
  if (!isOpen && selectedBlocks.size === 0) return null
  
  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {selectedBlock ? 'Block Configuration' : 'Workflow Properties'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {selectedBlock ? (
          <div className="space-y-4">
            {/* Block info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedBlock.data.color }}
                />
                <h4 className="font-medium">{selectedBlock.data.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedBlock.data.description || 'No description available'}
              </p>
            </div>
            
            {/* Block configuration */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Configuration
              </h5>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Configuration options will appear here
                </p>
              </div>
            </div>
            
            {/* Input/Output info */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Connections
              </h5>
              
              {selectedBlock.data.inputs.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Inputs:</p>
                  {selectedBlock.data.inputs.map(input => (
                    <div key={input.id} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      {input.label} ({input.dataType})
                    </div>
                  ))}
                </div>
              )}
              
              {selectedBlock.data.outputs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Outputs:</p>
                  {selectedBlock.data.outputs.map(output => (
                    <div key={output.id} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      {output.label} ({output.dataType})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="My Study Workflow"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Describe what this workflow does..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Tags</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="math, calculus, study"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}