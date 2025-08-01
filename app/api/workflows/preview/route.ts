import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowUrl = searchParams.get('url');

    if (!workflowUrl) {
      return NextResponse.json(
        { error: 'Workflow URL is required' },
        { status: 400 }
      );
    }

    const response = await fetch(workflowUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.status}`);
    }

    const workflow = await response.json();

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow preview' },
      { status: 500 }
    );
  }
}