'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function FileUpload({ onSuccess, onCancel }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      if (!displayName) {
        setDisplayName(file.name.replace(/\.json$/, '').replace(/[-_]/g, ' '));
      }
    }
  }, [displayName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !displayName.trim()) {
      toast.error('Please select a file and provide a display name');
      return;
    }

    setUploading(true);

    try {
      // Validate JSON file
      const fileContent = await file.text();
      const workflowData = JSON.parse(fileContent);

      if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
        throw new Error('Invalid N8N workflow file: missing nodes array');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('displayName', displayName.trim());
      formData.append('description', description.trim());

      const response = await fetch('/api/workflows/user/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload workflow');
      }

      onSuccess();
    } catch (error) {
      console.error('Error uploading workflow:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON file format');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to upload workflow');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setDisplayName('');
    setDescription('');
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upload N8N Workflow</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the JSON file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop your N8N workflow JSON file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Only .json files are accepted
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter a friendly name for your workflow"
                  className="bg-white/50 border-white/30"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does (optional)"
                  rows={3}
                  className="bg-white/50 border-white/30"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={uploading || !displayName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Workflow'}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}