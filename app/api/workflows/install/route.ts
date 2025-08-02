import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, workflowData, workflowUrl } = await request.json();

    let finalWorkflowData = workflowData;

    if (!finalWorkflowData && workflowUrl) {
      try {
        const response = await fetch(workflowUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch workflow from URL: ${response.statusText}`);
        }
        finalWorkflowData = await response.json();
      } catch (fetchError) {
        console.error('Error fetching workflow from URL:', fetchError);
        return NextResponse.json(
          { error: `Failed to retrieve workflow data from URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

    if (!finalWorkflowData || !name) {
      return NextResponse.json(
        { error: 'Workflow data and name are required' },
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

    // Create workflow payload without read-only fields
    const workflowPayload = {
      name: finalWorkflowData.name || name,
      nodes: finalWorkflowData.nodes,
      connections: finalWorkflowData.connections,
      settings: finalWorkflowData.settings?.timezone ? { timezone: finalWorkflowData.settings.timezone } : {}, // Only include timezone if present to avoid "additional properties" error
      staticData: finalWorkflowData.staticData,
    };

    // Install workflow to user's N8N instance
    const n8nResponse = await fetch(`${hostUrl.replace(/\/$/, '')}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
      body: JSON.stringify(workflowPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`N8N API error: ${errorText}`);
    }

    const result = await n8nResponse.json();
    const workflowId = result.data?.id;

    // If the original workflow had tags and the workflow was created successfully,
    // try to update it with tags (this might work depending on N8N version)
    if (finalWorkflowData.tags && finalWorkflowData.tags.length > 0 && workflowId) {
      try {
        const updateResponse = await fetch(`${hostUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': apiKey,
          },
          body: JSON.stringify({
            ...workflowPayload,
            tags: finalWorkflowData.tags,
          }),
        });

        if (!updateResponse.ok) {
          console.warn('Failed to update workflow with tags, but workflow was created successfully');
        }
      } catch (tagError) {
        console.warn('Failed to add tags to workflow:', tagError);
        // Don't fail the entire operation if tag update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      workflowId: workflowId,
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
