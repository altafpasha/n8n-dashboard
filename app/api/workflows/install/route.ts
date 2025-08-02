import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowUrl, name } = await request.json();

    if (!workflowUrl || !name) {
      return NextResponse.json(
        { error: 'Workflow URL and name are required' },
        { status: 400 }
      );
    }

    // Get user's N8N settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('n8n_host, n8n_api_token')
      .eq('user_id', user.id)
      .single();

    // Use environment variables as fallback if not provided
    const hostUrl = settings?.n8n_host || process.env.N8N_HOST_URL;
    const apiKey = settings?.n8n_api_token || process.env.N8N_API_KEY;

    if (!hostUrl || !apiKey) {
      return NextResponse.json(
        { error: 'N8N host and API key are required. Please configure them in settings or environment variables.' },
        { status: 400 }
      );
    }

    // Fetch the workflow data
    const workflowResponse = await fetch(workflowUrl);

    if (!workflowResponse.ok) {
      throw new Error(`Failed to fetch workflow: ${workflowResponse.status}`);
    }

    const workflowData = await workflowResponse.json();

    // Install workflow to user's N8N instance
    const n8nResponse = await fetch(`${hostUrl.replace(/\/$/, '')}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
      body: JSON.stringify({
        name: workflowData.name || name,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        active: false, // Don't activate by default
        settings: workflowData.settings,
        staticData: workflowData.staticData,
        tags: workflowData.tags,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`N8N API error: ${errorText}`);
    }

    const result = await n8nResponse.json();

    return NextResponse.json({ 
      success: true, 
      workflowId: result.data?.id,
      message: 'Workflow installed successfully'
    });

  } catch (error) {
    console.error('Error installing workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to install workflow' },
      { status: 500 }
    );
  }
}