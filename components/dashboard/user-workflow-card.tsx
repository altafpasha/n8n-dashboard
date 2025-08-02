'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserWorkflow } from '@/types/database';
import { Eye, Trash2, Calendar, Loader2, Download, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Import Badge component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserWorkflowCardProps {
  workflow: UserWorkflow;
  onPreview: () => void;
  onDelete: () => Promise<void>;
  onInstall: () => Promise<void>;
  onDownload: () => void;
  isInstalled: boolean;
}

export function UserWorkflowCard({ workflow, onPreview, onDelete, onInstall, onDownload, isInstalled }: UserWorkflowCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="group relative flex flex-col h-full backdrop-blur-sm bg-white/70 border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
            {workflow.display_name}
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 text-sm">
          {workflow.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Uploaded {workflow.created_at ? formatDate(workflow.created_at) : 'N/A'}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            My Upload
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            N8N Workflow
          </span>
          {isInstalled && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Installed
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 mt-auto"> {/* mt-auto pushes this div to the bottom */}
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
            disabled={installing || isInstalled} // Disable if installing or already installed
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            {installing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isInstalled ? (
              'Installed'
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Install
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="bg-white/50 border-white/30 hover:bg-white/70"
          >
            <Download className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 border-white/30 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="backdrop-blur-lg bg-white/90">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{workflow.display_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
