import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const githubRepoUrl = process.env.GITHUB_REPO_URL;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubRepoUrl) {
      return NextResponse.json(
        { error: 'GitHub repository URL not configured' },
        { status: 500 }
      );
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'N8N-Workflow-Manager',
    };

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const response = await fetch(githubRepoUrl, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for JSON files only
    const workflows = Array.isArray(data) 
      ? data.filter((file: any) => 
          file.name.endsWith('.json') && 
          file.type === 'file' &&
          file.download_url
        )
      : [];

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching GitHub workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows from GitHub' },
      { status: 500 }
    );
  }
}