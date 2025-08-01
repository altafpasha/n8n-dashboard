'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowData } from '@/types/database';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface WorkflowPreviewProps {
  workflow: WorkflowData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowPreview({ workflow, isOpen, onClose }: WorkflowPreviewProps) {
  if (!workflow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] backdrop-blur-lg bg-white/90">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Workflow Preview: {workflow.name}
          </DialogTitle>
          <DialogDescription>
            View the JSON structure of this N8N workflow
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border">
          <div className="relative">
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '0.375rem',
                fontSize: '14px',
              }}
              showLineNumbers
            >
              {JSON.stringify(workflow, null, 2)}
            </SyntaxHighlighter>
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <span className="font-medium">Nodes:</span> {workflow.nodes?.length || 0}
          </div>
          <div>
            <span className="font-medium">Active:</span> {workflow.active ? 'Yes' : 'No'}
          </div>
          {workflow.tags && workflow.tags.length > 0 && (
            <div>
              <span className="font-medium">Tags:</span> {workflow.tags.map(tag => tag.name).join(', ')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}