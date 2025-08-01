import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { n8n_host, n8n_api_token } = await request.json();

    if (!n8n_host || !n8n_api_token) {
      return NextResponse.json(
        { error: 'N8N host and API token are required' },
        { status: 400 }
      );
    }

    // Test connection by fetching workflows list
    const testUrl = `${n8n_host.replace(/\/$/, '')}/api/v1/workflows`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': n8n_api_token,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token');
      } else if (response.status === 404) {
        throw new Error('N8N API endpoint not found. Check your host URL.');
      } else {
        throw new Error(`N8N API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Connection successful',
      workflowCount: data.data?.length || 0
    });

  } catch (error) {
    console.error('Error testing N8N connection:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to N8N host. Check your URL and network connectivity.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 400 }
    );
  }
}