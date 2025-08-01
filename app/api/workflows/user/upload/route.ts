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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const displayName = formData.get('displayName') as string;
    const description = formData.get('description') as string || '';

    if (!file || !displayName) {
      return NextResponse.json(
        { error: 'File and display name are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Only JSON files are allowed' },
        { status: 400 }
      );
    }

    // Create unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('workflows')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Save workflow metadata to database
    const { data: workflowData, error: dbError } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
        display_name: displayName,
        description: description,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('workflows').remove([filePath]);
      throw dbError;
    }

    return NextResponse.json({ 
      success: true,
      workflow: workflowData
    });

  } catch (error) {
    console.error('Error uploading workflow:', error);
    return NextResponse.json(
      { error: 'Failed to upload workflow' },
      { status: 500 }
    );
  }
}