'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitHubWorkflow } from '@/types/database';
import { Eye, Download, Play, Loader2 } from 'lucide-react';

interface WorkflowCardProps {
  workflow: GitHubWorkflow;
  onPreview: () => void;
  onInstall: () => Promise<void>;
  onDownload: () => void;
}

export function WorkflowCard({ workflow, onPreview, onInstall, onDownload }: WorkflowCardProps) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

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

  return (
    <Card className="group relative backdrop-blur-sm bg-white/70 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
          {formatWorkflowName(workflow.name)}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {getWorkflowDescription(workflow.name)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            N8N Workflow
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Ready to Use
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="flex-1 bg-white/50 border-white/30 hover:bg-white/70"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            {installing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {installing ? 'Installing...' : 'Install'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="bg-white/50 border-white/30 hover:bg-white/70"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}