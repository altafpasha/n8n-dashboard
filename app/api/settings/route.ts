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

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('n8n_host, n8n_api_token')
      .eq('user_id', user.id)
      .single();

    // If no settings found, return empty settings
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ settings: { n8n_host: '', n8n_api_token: '' } });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

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

    // Upsert user settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        n8n_host: n8n_host.trim(),
        n8n_api_token: n8n_api_token.trim(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}