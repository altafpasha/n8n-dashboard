'use client';

import { useState, useEffect } from 'react';
import { WorkflowCard } from '@/components/dashboard/workflow-card';
import { WorkflowPreview } from '@/components/dashboard/workflow-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GitHubWorkflow, WorkflowData } from '@/types/database';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowData | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/github');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows from GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (workflow: GitHubWorkflow) => {
    try {
      const response = await fetch(`/api/workflows/preview?url=${encodeURIComponent(workflow.download_url)}`);
      if (!response.ok) throw new Error('Failed to fetch workflow data');
      
      const data = await response.json();
      setPreviewWorkflow(data.workflow);
    } catch (error) {
      console.error('Error fetching workflow preview:', error);
      toast.error('Failed to load workflow preview');
    }
  };

  const handleInstall = async (workflow: GitHubWorkflow) => {
    try {
      const response = await fetch('/api/workflows/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowUrl: workflow.download_url,
          name: workflow.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to install workflow');
      }

      toast.success(`Workflow "${workflow.name}" installed successfully!`);
    } catch (error) {
      console.error('Error installing workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to install workflow');
    }
  };

  const handleDownload = async (workflow: GitHubWorkflow) => {
    try {
      const response = await fetch(workflow.download_url);
      if (!response.ok) throw new Error('Failed to download workflow');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = workflow.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Workflow "${workflow.name}" downloaded successfully!`);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Workflow Templates
        </h1>
        <p className="text-gray-600 mt-2">
          Browse and install pre-built N8N workflows from the community
        </p>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No workflows found</div>
          <p className="text-gray-400 mt-2">
            Check your GitHub repository configuration
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.sha}
              workflow={workflow}
              onPreview={() => handlePreview(workflow)}
              onInstall={() => handleInstall(workflow)}
              onDownload={() => handleDownload(workflow)}
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