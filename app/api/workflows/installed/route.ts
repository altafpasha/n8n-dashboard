import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Get user's N8N settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('n8n_host, n8n_api_token')
      .eq('user_id', user.id)
      .single();

    const hostUrl = settings?.n8n_host || process.env.N8N_HOST_URL;
    const apiKey = settings?.n8n_api_token || process.env.N8N_API_KEY;

    if (!hostUrl || !apiKey) {
      return NextResponse.json(
        { error: 'N8N host and API key are required. Please configure them in settings or environment variables.' },
        { status: 400 }
      );
    }

    // Fetch installed workflows from N8N instance
    const n8nResponse = await fetch(`${hostUrl.replace(/\/$/, '')}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      throw new Error(`N8N API error: ${errorText}`);
    }

    const result = await n8nResponse.json();
    const installedWorkflows = result.data || [];

    return NextResponse.json({ 
      success: true, 
      installedWorkflows: installedWorkflows
    });

  } catch (error) {
    console.error('Error fetching installed workflows:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch installed workflows' },
      { status: 500 }
    );
  }
}
