import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('n8n_host, n8n_api_token')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings || !settings.n8n_host || !settings.n8n_api_token) {
      return NextResponse.json({ 
        totalWorkflows: 0, 
        activeWorkflows: 0, 
        message: 'N8N settings not configured' 
      });
    }

    const { n8n_host, n8n_api_token } = settings;

    const workflowsUrl = `${n8n_host.replace(/\/$/, '')}/api/v1/workflows`;
    
    const response = await fetch(workflowsUrl, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': n8n_api_token,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`N8N API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        totalWorkflows: 0, 
        activeWorkflows: 0, 
        message: `Failed to fetch N8N workflows: ${response.statusText}` 
      });
    }

    const data = await response.json();
    const n8nWorkflows = data.data || [];

    const totalWorkflows = n8nWorkflows.length;
    const activeWorkflows = n8nWorkflows.filter((wf: any) => wf.active).length;

    return NextResponse.json({ 
      totalWorkflows, 
      activeWorkflows, 
      message: 'N8N stats fetched successfully' 
    });

  } catch (error) {
    console.error('Error fetching N8N stats:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { totalWorkflows: 0, activeWorkflows: 0, message: 'Cannot connect to N8N host.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { totalWorkflows: 0, activeWorkflows: 0, message: error instanceof Error ? error.message : 'Failed to fetch N8N stats' },
      { status: 200 }
    );
  }
}
