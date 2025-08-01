import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workflow metadata
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Download file content from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('workflows')
      .download(workflow.storage_path);

    if (downloadError) {
      throw downloadError;
    }

    const fileContent = await fileData.text();
    const workflowData = JSON.parse(fileContent);

    return NextResponse.json({ workflow: workflowData });

  } catch (error) {
    console.error('Error fetching workflow preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow preview' },
      { status: 500 }
    );
  }
}