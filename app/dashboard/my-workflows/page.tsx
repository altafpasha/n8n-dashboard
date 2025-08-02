'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/dashboard/file-upload';
import { UserWorkflowCard } from '@/components/dashboard/user-workflow-card';
import { WorkflowPreview } from '@/components/dashboard/workflow-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserWorkflow, WorkflowData, Database } from '@/types/database';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function MyWorkflowsPage() {
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [installedWorkflowNames, setInstalledWorkflowNames] = useState<Set<string>>(new Set());

  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const fetchMyWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const [userWorkflowsResponse, installedResponse] = await Promise.all([
        supabase.from('workflows').select('*').eq('user_id', session.user.id),
        fetch('/api/workflows/installed'),
      ]);

      if (userWorkflowsResponse.error) throw new Error(userWorkflowsResponse.error.message);
      setWorkflows(userWorkflowsResponse.data || []);
      
      if (!installedResponse.ok) throw new Error('Failed to fetch installed workflows');
      const installedData = await installedResponse.json();
      const names = new Set(installedData.installedWorkflows.map((w: { name: string }) => w.name) as string[]);
      setInstalledWorkflowNames(names);

    } catch (error) {
      console.error('Error fetching user workflows:', error);
      toast.error('Failed to load your workflows');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchMyWorkflows();
  }, [fetchMyWorkflows]);

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );


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

      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      toast.success('Workflow deleted successfully!');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };


  const handleInstall = async (workflow: UserWorkflow) => {
    try {
      const previewResponse = await fetch(`/api/workflows/user/preview/${workflow.id}`);
      if (!previewResponse.ok) throw new Error('Failed to fetch workflow data for installation');
      const workflowData = await previewResponse.json();

      const installResponse = await fetch('/api/workflows/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowUrl: workflow.workflow_url, // Assuming workflow_url is the source for installation
          name: workflow.display_name,
          workflowData: workflowData.workflow, // Pass the actual workflow data
        }),
      });

      if (!installResponse.ok) {
        const errorData = await installResponse.json();
        throw new Error(errorData.error || 'Failed to install workflow');
      }

      toast.success('Workflow installed successfully to your N8N instance!');
    } catch (error) {
      console.error('Error installing workflow:', error);
      toast.error(`Failed to install workflow: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    }
  };

  const handleDownload = async (workflow: UserWorkflow) => {
    try {
      const response = await fetch(`/api/workflows/user/preview/${workflow.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflow data for download');
      
      const data = await response.json();
      const workflowJson = JSON.stringify(data.workflow, null, 2);
      
      const blob = new Blob([workflowJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.display_name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Workflow downloaded successfully!');
    } catch (error) {
      console.error('Error downloading workflow:', error);
      toast.error('Failed to download workflow');
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

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search your workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No workflows found matching your search</div>
          <p className="text-gray-400 mt-2">
            Try a different search term or upload a new workflow
          </p>
          {!showUpload && (
            <Button
              onClick={() => setShowUpload(true)}
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <UserWorkflowCard
              key={workflow.id}
              workflow={workflow}
              onPreview={() => handlePreview(workflow)}
              onDelete={() => handleDelete(workflow.id)}
              onInstall={() => handleInstall(workflow)}
              onDownload={() => handleDownload(workflow)}
              isInstalled={installedWorkflowNames.has(workflow.display_name)}
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
