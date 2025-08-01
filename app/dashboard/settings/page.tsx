'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/providers/auth-provider';
import { Settings, Save, Eye, EyeOff, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettings {
  n8n_host: string;
  n8n_api_token: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    n8n_host: '',
    n8n_api_token: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.n8n_host || !settings.n8n_api_token) {
      toast.error('Please provide both N8N host and API token');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Connection successful!');
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const formatHostUrl = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your N8N instance and manage your account
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* N8N Configuration */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle>N8N Configuration</CardTitle>
            <CardDescription>
              Configure your N8N instance to enable workflow installation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="n8n_host">N8N Host URL</Label>
                <Input
                  id="n8n_host"
                  type="url"
                  placeholder="https://your-n8n-instance.com"
                  value={settings.n8n_host}
                  onChange={(e) => setSettings({
                    ...settings,
                    n8n_host: formatHostUrl(e.target.value)
                  })}
                  className="bg-white/50 border-white/30"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The URL of your N8N instance (including https://)
                </p>
              </div>

              <div>
                <Label htmlFor="n8n_api_token">N8N API Token</Label>
                <div className="relative">
                  <Input
                    id="n8n_api_token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Enter your N8N API token"
                    value={settings.n8n_api_token}
                    onChange={(e) => setSettings({
                      ...settings,
                      n8n_api_token: e.target.value
                    })}
                    className="bg-white/50 border-white/30 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Your N8N API token for authentication
                </p>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !settings.n8n_host || !settings.n8n_api_token}
                  className="bg-white/50 border-white/30 hover:bg-white/70"
                >
                  {testing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to configure your N8N instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Find your N8N Host URL</h4>
                <p>This is the URL where your N8N instance is running. For example:</p>
                <ul className="list-disc list-inside mt-1 ml-4">
                  <li>https://n8n.yourdomain.com</li>
                  <li>https://your-n8n-instance.herokuapp.com</li>
                  <li>http://localhost:5678 (for local development)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Get your API Token</h4>
                <p>In your N8N instance:</p>
                <ul className="list-disc list-inside mt-1 ml-4">
                  <li>Go to Settings → API</li>
                  <li>Create a new API key</li>
                  <li>Copy the generated token</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Test the Connection</h4>
                <p>
                  After entering your credentials, use the "Test Connection" button to verify 
                  everything is working correctly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}