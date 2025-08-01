export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          display_name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          display_name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          storage_path?: string;
          display_name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          n8n_host: string | null;
          n8n_api_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          n8n_host?: string | null;
          n8n_api_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          n8n_host?: string | null;
          n8n_api_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export interface GitHubWorkflow {
  name: string;
  download_url: string;
  path: string;
  sha: string;
}

export interface WorkflowData {
  id?: string;
  name: string;
  nodes: any[];
  connections: any;
  active: boolean;
  settings?: any;
  staticData?: any;
  tags?: any[];
  meta?: any;
  pinData?: any;
  versionId?: string;
}

export interface UserWorkflow {
  id: string;
  file_name: string;
  display_name: string;
  description: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}