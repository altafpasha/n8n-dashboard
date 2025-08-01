'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/dashboard/file-upload';
import { UserWorkflowCard } from '@/components/dashboard/user-workflow-card';
import { WorkflowPreview } from '@/components/dashboard/workflow-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserWorkflow, WorkflowData } from '@/types/database';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MyWorkflowsPage() {
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowData | null>(null);

  useEffect(() => {
    fetchMyWorkflows();
  }, []);

  const fetchMyWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/user');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching user workflows:', error);
      toast.error('Failed to load your workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchMyWorkflows();
    toast.success('Workflow uploaded successfully!');
  };

  const handlePreview = async (workflow: UserWorkflow) => {
    try {
      const response = await fetch(`/api/workflows/user/preview/${workflow.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflow data');
      
      const data = await response.json();
      setPreviewWorkflow(data.workflow);
    } catch (error) {
      console.error('Error fetching workflow preview:', error);
      toast.error('Failed to load workflow preview');
    }
  };

  const handleDelete = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/user/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      setWorkflows(workflows.filter(w => w.id !== workflowId));
      toast.success('Workflow deleted successfully!');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Workflows
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your uploaded N8N workflows
          </p>
        </div>
        
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Workflow
        </Button>
      </div>

      {showUpload && (
        <div className="mb-8">
          <FileUpload
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No workflows uploaded yet</div>
          <p className="text-gray-400 mt-2">
            Upload your first N8N workflow to get started
          </p>
          <Button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <UserWorkflowCard
              key={workflow.id}
              workflow={workflow}
              onPreview={() => handlePreview(workflow)}
              onDelete={() => handleDelete(workflow.id)}
            />
          ))}
        </div>
      )}

      {previewWorkflow && (
        <WorkflowPreview
          workflow={previewWorkflow}
          isOpen={!!previewWorkflow}
          onClose={() => setPreviewWorkflow(null)}
        />
      )}
    </div>
  );
}