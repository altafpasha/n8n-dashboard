import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { isConnected: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('n8n_host, n8n_api_token')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings || !settings.n8n_host || !settings.n8n_api_token) {
      return NextResponse.json({ isConnected: false, message: 'N8N settings not configured' });
    }

    const { n8n_host, n8n_api_token } = settings;

    // Test connection by fetching workflows list
    const testUrl = `${n8n_host.replace(/\/$/, '')}/api/v1/workflows`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': n8n_api_token,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({ isConnected: false, message: `N8N API error: ${response.status} ${response.statusText}` });
    }

    // Optionally, parse data to confirm it's a valid response, though response.ok is usually sufficient
    await response.json(); 

    return NextResponse.json({ isConnected: true, message: 'Connection successful' });

  } catch (error) {
    console.error('Error checking N8N connection status:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { isConnected: false, message: 'Cannot connect to N8N host. Check your URL and network connectivity.' },
        { status: 200 } // Return 200 even on connection error for status check, but with isConnected: false
      );
    }

    return NextResponse.json(
      { isConnected: false, message: error instanceof Error ? error.message : 'Connection check failed' },
      { status: 200 } // Return 200 even on error for status check, but with isConnected: false
    );
  }
}
