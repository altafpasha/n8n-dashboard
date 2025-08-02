import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { workflowId, isFavorite } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let data, error;

  if (isFavorite) {
    // Add to favorites
    ({ data, error } = await supabase
      .from('favourite')
      .insert({ user_id: session.user.id, workflow_id: workflowId }));
  } else {
    // Remove from favorites
    ({ data, error } = await supabase
      .from('favourite')
      .delete()
      .eq('user_id', session.user.id)
      .eq('workflow_id', workflowId));
  }

  if (error) {
    console.error('Error updating favorite status:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
