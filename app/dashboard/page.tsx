'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { WorkflowCard } from '@/components/dashboard/workflow-card';
import { WorkflowPreview } from '@/components/dashboard/workflow-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { GitHubWorkflow, WorkflowData, Database } from '@/types/database';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [installedWorkflowNames, setInstalledWorkflowNames] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const [githubResponse, installedResponse] = await Promise.all([
        fetch('/api/workflows/github'),
        fetch('/api/workflows/installed'),
      ]);

      if (!githubResponse.ok) throw new Error('Failed to fetch workflows from GitHub');
      const githubData = await githubResponse.json();
      setWorkflows(githubData.workflows || []);

      if (!installedResponse.ok) throw new Error('Failed to fetch installed workflows');
      const installedData = await installedResponse.json();
      const names = new Set(installedData.installedWorkflows.map((w: { name: string }) => w.name) as string[]);
      setInstalledWorkflowNames(names);

    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const formatWorkflowName = (name: string) => {
    return name
      .replace(/\.json$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getWorkflowDescription = (name: string) => {
    const descriptions: { [key: string]: string } = {
      'slack-notification': 'Send notifications to Slack channels',
      'email-automation': 'Automate email workflows and responses',
      'data-sync': 'Synchronize data between different platforms',
      'webhook-handler': 'Handle incoming webhooks and process data',
      'file-processor': 'Process and transform files automatically',
      'api-integration': 'Integrate with various APIs and services',
      'database-backup': 'Backup and manage database operations',
      'social-media': 'Automate social media posting and monitoring',
    };

    const key = name.toLowerCase().replace(/\.json$/, '');
    return descriptions[key] || 'A powerful N8N workflow template ready to use';
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

  const filteredWorkflows = workflows.filter(workflow =>
    formatWorkflowName(workflow.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getWorkflowDescription(workflow.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No workflows found matching your search</div>
          <p className="text-gray-400 mt-2">
            Try a different search term or check your GitHub repository configuration
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onPreview={() => handlePreview(workflow)}
              onInstall={() => handleInstall(workflow)}
              onDownload={() => handleDownload(workflow)}
              isInstalled={installedWorkflowNames.has(formatWorkflowName(workflow.name))}
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
