export interface N8NWorkflow {
  id?: string;
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, any>;
  }>;
  connections: Record<string, any>;
  active: boolean;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  meta?: Record<string, any>;
  pinData?: Record<string, any>;
  versionId?: string;
}

export interface WorkflowCard {
  name: string;
  description: string;
  downloadUrl: string;
  path: string;
  data?: N8NWorkflow;
}

export interface InstalledWorkflowsResponse {
  success: boolean;
  installedWorkflows: N8NWorkflow[];
}
