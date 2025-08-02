/*
  # Fixed N8N Workflow Manager Database Schema
  
  This removes the redundant is_favorite column from workflows table
  and uses the separate favourite table for managing favorites.
*/

-- First, let's clean up the workflows table by removing is_favorite column
-- (if it exists and causes conflicts)
ALTER TABLE workflows DROP COLUMN IF EXISTS is_favorite;

-- Ensure the workflows table has the correct structure
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  display_name text NOT NULL,
  description text DEFAULT '',
  workflow_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table (unchanged)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  n8n_host text,
  n8n_api_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create favourite table (unchanged)
CREATE TABLE IF NOT EXISTS favourite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, workflow_id)
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite ENABLE ROW LEVEL SECURITY;

-- Create policies for workflows (unchanged)
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
CREATE POLICY "Users can view their own workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workflows" ON workflows;
CREATE POLICY "Users can insert their own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
CREATE POLICY "Users can update their own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;
CREATE POLICY "Users can delete their own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_settings (unchanged)
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for favourite (unchanged)
DROP POLICY IF EXISTS "Users can view their own favourites" ON favourite;
CREATE POLICY "Users can view their own favourites"
  ON favourite
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favourites" ON favourite;
CREATE POLICY "Users can insert their own favourites"
  ON favourite
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favourites" ON favourite;
CREATE POLICY "Users can delete their own favourites"
  ON favourite
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for workflows (unchanged)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workflows', 'workflows', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (unchanged)
DROP POLICY IF EXISTS "Users can upload their own workflow files" ON storage.objects;
CREATE POLICY "Users can upload their own workflow files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'workflows' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own workflow files" ON storage.objects;
CREATE POLICY "Users can view their own workflow files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'workflows' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own workflow files" ON storage.objects;
CREATE POLICY "Users can delete their own workflow files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'workflows' AND auth.uid()::text = (storage.foldername(name))[1]);
