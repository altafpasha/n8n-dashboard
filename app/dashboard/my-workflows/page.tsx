'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/dashboard/file-upload';
import { UserWorkflowCard } from '@/components/dashboard/user-workflow-card';
import { WorkflowPreview } from '@/components/dashboard/workflow-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserWorkflow, WorkflowData, Database } from '@/types/database';
import { Plus, Activity, Upload, Filter, X, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

// Enhanced workflow interface with better typing
interface EnhancedUserWorkflow extends Omit<UserWorkflow, 'description'> {
  trigger_type: string;
  node_count: number;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  description: string | null; // Ensure compatibility with UserWorkflow's description
  last_updated?: string;
  author?: string;
  rating?: number;
  downloads?: number;
}

// Filter state interface
interface FilterState {
  search: string;
  triggerTypes: string[];
  categories: string[];
  complexities: string[];
  tags: string[];
  nodeCountRange: [number, number];
  activeOnly: boolean;
  sortBy: 'name' | 'date' | 'popularity' | 'complexity' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export default function MyWorkflowsPage() {
  const [workflows, setWorkflows] = useState<EnhancedUserWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowData | null>(null);
  const [activeN8nWorkflows, setActiveN8nWorkflows] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    triggerTypes: [],
    categories: [],
    complexities: [],
    tags: [],
    nodeCountRange: [0, 100],
    activeOnly: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  // Enhanced workflow analysis function
  const analyzeWorkflow = (workflowData: WorkflowData, fileName: string): Partial<EnhancedUserWorkflow> => {
    const nodes = workflowData.nodes || [];
    const nodeCount = nodes.length;
    
    // Determine trigger type from first node
    const triggerNode = nodes.find(node => 
      node.type?.toLowerCase().includes('trigger') || 
      node.type?.toLowerCase().includes('webhook') ||
      node.type?.toLowerCase().includes('schedule') ||
      node.type?.toLowerCase().includes('manual')
    );
    
    let triggerType = 'Manual';
    if (triggerNode) {
      const type = triggerNode.type.toLowerCase();
      if (type.includes('webhook')) triggerType = 'Webhook';
      else if (type.includes('schedule') || type.includes('cron')) triggerType = 'Scheduled';
      else if (type.includes('manual')) triggerType = 'Manual';
      else if (type.includes('email')) triggerType = 'Email';
      else if (type.includes('http')) triggerType = 'HTTP Request';
      else triggerType = 'Other';
    }

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (nodeCount > 15) complexity = 'high';
    else if (nodeCount > 5) complexity = 'medium';

    // Determine category based on node types and filename
    const nodeTypes = nodes.map(node => node.type?.toLowerCase() || '');
    const fileName_lower = fileName.toLowerCase();
    
    let category = 'General';
    let tags: string[] = [];

    // Category and tag detection logic
    if (nodeTypes.some(type => type.includes('slack')) || fileName_lower.includes('slack')) {
      category = 'Communication';
      tags.push('slack', 'messaging', 'notification');
    } else if (nodeTypes.some(type => type.includes('email')) || fileName_lower.includes('email')) {
      category = 'Communication';
      tags.push('email', 'notification', 'messaging');
    } else if (nodeTypes.some(type => type.includes('database') || type.includes('postgres') || type.includes('mysql'))) {
      category = 'Data Management';
      tags.push('database', 'storage', 'data');
    } else if (nodeTypes.some(type => type.includes('api') || type.includes('http'))) {
      category = 'Integration';
      tags.push('api', 'integration', 'http');
    } else if (nodeTypes.some(type => type.includes('file') || type.includes('csv') || type.includes('excel'))) {
      category = 'File Processing';
      tags.push('files', 'processing', 'data');
    } else if (nodeTypes.some(type => type.includes('social') || type.includes('twitter') || type.includes('facebook'))) {
      category = 'Social Media';
      tags.push('social', 'automation', 'marketing');
    } else if (nodeTypes.some(type => type.includes('webhook'))) {
      category = 'Webhooks';
      tags.push('webhook', 'trigger', 'integration');
    } else if (nodeTypes.some(type => type.includes('transform') || type.includes('code'))) {
      category = 'Data Processing';
      tags.push('transform', 'code', 'processing');
    }

    // Add workflow-specific tags based on filename
    if (fileName_lower.includes('backup')) tags.push('backup', 'maintenance');
    if (fileName_lower.includes('sync')) tags.push('sync', 'integration');
    if (fileName_lower.includes('monitor')) tags.push('monitoring', 'alerts');
    if (fileName_lower.includes('report')) tags.push('reporting', 'analytics');

    // Add complexity and trigger tags
    tags.push(complexity, triggerType.toLowerCase().replace(' ', '-'));

    // Add node count category tags
    if (nodeCount <= 3) tags.push('simple');
    else if (nodeCount <= 10) tags.push('moderate');
    else tags.push('advanced');

    // Remove duplicates and sort
    tags = [...new Set(tags)].sort();

    // Generate description
    const description = generateWorkflowDescription(fileName, category, triggerType, nodeCount);

    return {
      trigger_type: triggerType,
      node_count: nodeCount,
      category,
      complexity,
      tags,
      description,
      last_updated: new Date().toISOString(),
      rating: Math.floor(Math.random() * 5) + 1, // Mock rating
      downloads: Math.floor(Math.random() * 1000) + 10 // Mock downloads
    };
  };

  const generateWorkflowDescription = (fileName: string, category: string, triggerType: string, nodeCount: number): string => {
    const descriptions: { [key: string]: string } = {
      'slack': 'Send notifications and manage Slack communications automatically',
      'email': 'Automate email workflows, responses, and notifications',
      'database': 'Manage database operations and data synchronization',
      'webhook': 'Handle incoming webhooks and process data efficiently',
      'file': 'Process and transform files automatically with smart handling',
      'api': 'Integrate with various APIs and external services seamlessly',
      'social': 'Automate social media posting, monitoring, and engagement',
      'backup': 'Backup and manage data operations with reliability',
      'sync': 'Synchronize data between different platforms and services',
      'monitor': 'Monitor systems and send alerts when issues occur',
      'report': 'Generate automated reports and analytics',
      'transform': 'Transform and process data with custom logic'
    };

    const key = Object.keys(descriptions).find(k => fileName.toLowerCase().includes(k));
    if (key) return descriptions[key];

    return `${category} workflow with ${triggerType.toLowerCase()} trigger featuring ${nodeCount} optimized nodes`;
  };

  const formatWorkflowName = (name: string) => {
    return name
      .replace(/\.json$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const fetchMyWorkflowsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const userWorkflowsResponse = await supabase.from('workflows').select('*').eq('user_id', session.user.id);

      if (userWorkflowsResponse.error) throw new Error(userWorkflowsResponse.error.message);
      
      const fetchedWorkflows = userWorkflowsResponse.data || [];

      // Fetch full workflow data for each user workflow to get node_count, trigger_type, category
      const workflowsWithDetails = await Promise.all(fetchedWorkflows.map(async (workflow) => {
        try {
          const response = await fetch(`/api/workflows/user/preview/${workflow.id}`);
          if (!response.ok) throw new Error(`Failed to fetch workflow data for ${workflow.display_name}`);
          const workflowData: WorkflowData = await response.json();

          const analysis = analyzeWorkflow(workflowData, workflow.display_name);
          return {
            ...workflow,
            ...analysis,
          } as EnhancedUserWorkflow;
        } catch (error) {
          console.error(`Error processing workflow ${workflow.display_name}:`, error);
          return {
            ...workflow,
            trigger_type: 'Error',
            node_count: 0,
            category: 'Error',
            complexity: 'low' as const,
            tags: ['error'],
            description: 'Workflow details could not be loaded'
          };
        }
      }));

      setWorkflows(workflowsWithDetails);

      // Update node count range based on actual data
      const maxNodeCount = Math.max(...workflowsWithDetails.map(w => w.node_count), 100);
      setFilters(prev => ({
        ...prev,
        nodeCountRange: [0, maxNodeCount]
      }));
      
    } catch (error) {
      console.error('Error fetching user workflows:', error);
      toast.error('Failed to load your workflows');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchMyWorkflowsData();
    const interval = setInterval(fetchMyWorkflowsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchMyWorkflowsData]);

  // Enhanced filtering logic with better performance
  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows.filter(workflow => {
      // Search filter - search across multiple fields
      const searchTerm = filters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        formatWorkflowName(workflow.display_name).toLowerCase().includes(searchTerm) ||
        (workflow.description || '').toLowerCase().includes(searchTerm) ||
        workflow.category.toLowerCase().includes(searchTerm) ||
        workflow.trigger_type.toLowerCase().includes(searchTerm) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm));

      // Trigger type filter
      const matchesTrigger = filters.triggerTypes.length === 0 || 
        filters.triggerTypes.includes(workflow.trigger_type);

      // Category filter
      const matchesCategory = filters.categories.length === 0 || 
        filters.categories.includes(workflow.category);

      // Complexity filter
      const matchesComplexity = filters.complexities.length === 0 || 
        filters.complexities.includes(workflow.complexity);

      // Tags filter - match any selected tag
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.some(tag => workflow.tags.includes(tag));

      // Node count range filter
      const matchesNodeCount = workflow.node_count >= filters.nodeCountRange[0] && 
        workflow.node_count <= filters.nodeCountRange[1];

      // Active only filter (placeholder - would need actual n8n integration)
      const matchesActiveOnly = !filters.activeOnly;

      return matchesSearch && matchesTrigger && matchesCategory && 
             matchesComplexity && matchesTags && matchesNodeCount && 
             matchesActiveOnly;
    });

    // Enhanced sorting logic
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = formatWorkflowName(a.display_name).localeCompare(formatWorkflowName(b.display_name));
          break;
        case 'date':
          comparison = new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime();
          break;
        case 'popularity':
          comparison = (b.downloads || 0) - (a.downloads || 0);
          break;
        case 'complexity':
          const complexityOrder = { low: 1, medium: 2, high: 3 };
          comparison = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [workflows, filters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const triggerTypes = [...new Set(workflows.map(w => w.trigger_type))].filter(Boolean).sort();
    const categories = [...new Set(workflows.map(w => w.category))].filter(Boolean).sort();
    const allTags = [...new Set(workflows.flatMap(w => w.tags))].filter(Boolean).sort();
    const maxNodeCount = Math.max(...workflows.map(w => w.node_count), 100);

    return { triggerTypes, categories, allTags, maxNodeCount };
  }, [workflows]);

  // Filter update functions
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (filterKey: 'triggerTypes' | 'categories' | 'complexities' | 'tags', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter(item => item !== value)
        : [...prev[filterKey], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      triggerTypes: [],
      categories: [],
      complexities: [],
      tags: [],
      nodeCountRange: [0, filterOptions.maxNodeCount],
      activeOnly: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const activeFilterCount = useMemo(() => {
    return filters.triggerTypes.length + 
           filters.categories.length + 
           filters.complexities.length + 
           filters.tags.length +
           (filters.activeOnly ? 1 : 0) +
           (filters.search ? 1 : 0) +
           (filters.nodeCountRange[0] > 0 || filters.nodeCountRange[1] < filterOptions.maxNodeCount ? 1 : 0);
  }, [filters, filterOptions.maxNodeCount]);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchMyWorkflowsData();
    toast.success('Workflow uploaded successfully!');
  };

  const handlePreview = async (workflow: EnhancedUserWorkflow) => {
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


  const handleInstall = async (workflow: EnhancedUserWorkflow) => {
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

  const handleDownload = async (workflow: EnhancedUserWorkflow) => {
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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Uploaded Workflows
            </CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              Workflows you have uploaded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active N8N Workflows
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeN8nWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Workflows currently active on your n8n instance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAndSortedWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Matching your filters</p>
          </CardContent>
        </Card>
      </div>

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

      {/* Search and Basic Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search workflows, categories, or tags..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="popularity">Sort by Popularity</SelectItem>
                <SelectItem value="complexity">Sort by Complexity</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Advanced Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Trigger Types */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Trigger Types</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {filterOptions.triggerTypes.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`trigger-${type}`}
                              checked={filters.triggerTypes.includes(type)}
                              onCheckedChange={() => toggleArrayFilter('triggerTypes', type)}
                            />
                            <Label htmlFor={`trigger-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Categories</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {filterOptions.categories.map(category => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={() => toggleArrayFilter('categories', category)}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Complexity */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Complexity</Label>
                      <div className="space-y-2">
                        {['low', 'medium', 'high'].map(complexity => (
                          <div key={complexity} className="flex items-center space-x-2">
                            <Checkbox
                              id={`complexity-${complexity}`}
                              checked={filters.complexities.includes(complexity)}
                              onCheckedChange={() => toggleArrayFilter('complexities', complexity)}
                            />
                            <Label htmlFor={`complexity-${complexity}`} className="text-sm capitalize cursor-pointer">
                              {complexity} {complexity === 'low' && '(≤5 nodes)'}
                              {complexity === 'medium' && '(6-15 nodes)'}
                              {complexity === 'high' && '(16+ nodes)'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="activeOnly"
                            checked={filters.activeOnly}
                            onCheckedChange={(checked) => updateFilter('activeOnly', !!checked)}
                          />
                          <Label htmlFor="activeOnly" className="text-sm cursor-pointer">
                            Active only
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node Count Range */}
                  <div className="mt-6 pt-6 border-t">
                    <Label className="text-sm font-semibold mb-3 block">
                      Node Count Range: {filters.nodeCountRange[0]} - {filters.nodeCountRange[1]} nodes
                    </Label>
                    <Slider
                      value={filters.nodeCountRange}
                      onValueChange={(value) => updateFilter('nodeCountRange', value as [number, number])}
                      max={filterOptions.maxNodeCount}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Popular Tags */}
                  <div className="mt-6 pt-6 border-t">
                    <Label className="text-sm font-semibold mb-3 block">Popular Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.allTags.slice(0, 20).map(tag => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleArrayFilter('tags', tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <div className="mt-6 pt-6 border-t flex justify-end">
                      <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.search}"
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => updateFilter('search', '')} />
              </Badge>
            )}
            {filters.triggerTypes.map(type => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                Trigger: {type}
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => toggleArrayFilter('triggerTypes', type)} />
              </Badge>
            ))}
            {filters.categories.map(category => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                Category: {category}
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => toggleArrayFilter('categories', category)} />
              </Badge>
            ))}
            {filters.complexities.map(complexity => (
              <Badge key={complexity} variant="secondary" className="flex items-center gap-1">
                Complexity: {complexity}
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => toggleArrayFilter('complexities', complexity)} />
              </Badge>
            ))}
            {filters.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                Tag: {tag}
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => toggleArrayFilter('tags', tag)} />
              </Badge>
            ))}
            {filters.activeOnly && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Active Only
                <X className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" onClick={() => updateFilter('activeOnly', false)} />
              </Badge>
            )}
            {(filters.nodeCountRange[0] > 0 || filters.nodeCountRange[1] < filterOptions.maxNodeCount) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Nodes: {filters.nodeCountRange[0]}-{filters.nodeCountRange[1]}
                <X 
                  className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                  onClick={() => updateFilter('nodeCountRange', [0, filterOptions.maxNodeCount])} 
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedWorkflows.length} of {workflows.length} workflows
        </div>
        {filteredAndSortedWorkflows.length > 0 && (
          <div className="text-sm text-gray-600">
            Sorted by {filters.sortBy} ({filters.sortOrder === 'asc' ? 'ascending' : 'descending'})
          </div>
        )}
      </div>

      {/* Workflows Grid or Empty State */}
      {filteredAndSortedWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            {workflows.length === 0 ? 'No workflows available' : 'No workflows match your filters'}
          </div>
          <p className="text-gray-400 mb-4">
            {workflows.length === 0 
              ? 'Try uploading some workflows'
              : 'Try adjusting your search criteria or clearing some filters'
            }
          </p>
          {activeFilterCount > 0 && (
            <Button 
              variant="outline" 
              onClick={clearAllFilters} 
              className="flex items-center gap-2 mx-auto"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Quick Filter Shortcuts */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Filters:</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('categories', ['Communication'])}
                className="text-xs"
              >
                Communication
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('triggerTypes', ['Webhook'])}
                className="text-xs"
              >
                Webhooks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('complexities', ['low'])}
                className="text-xs"
              >
                Simple Workflows
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('tags', ['api', 'integration'])}
                className="text-xs"
              >
                API Integration
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('activeOnly', true)}
                className="text-xs"
              >
                Active Workflows
              </Button>
            </div>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedWorkflows.map((workflow) => (
              <UserWorkflowCard
                key={workflow.id}
                workflow={workflow}
                onPreview={() => handlePreview(workflow)}
                onDelete={() => handleDelete(workflow.id)}
                onInstall={() => handleInstall(workflow)}
                onDownload={() => handleDownload(workflow)}
              />
            ))}
          </div>

          {/* Load More Button (if pagination is needed in the future) */}
          {filteredAndSortedWorkflows.length >= 20 && (
            <div className="mt-8 text-center">
              <Button variant="outline" className="px-8">
                Load More Workflows
              </Button>
            </div>
          )}
        </>
      )}

      {/* Workflow Preview Modal */}
      {previewWorkflow && (
        <WorkflowPreview
          workflow={previewWorkflow}
          isOpen={!!previewWorkflow}
          onClose={() => setPreviewWorkflow(null)}
        />
      )}

      {/* Footer Stats */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{workflows.length}</div>
            <div className="text-sm text-gray-600">Total Workflows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{filterOptions.categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{filterOptions.triggerTypes.length}</div>
            <div className="text-sm text-gray-600">Trigger Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeN8nWorkflows}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
