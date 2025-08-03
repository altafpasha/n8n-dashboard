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
    
    // Filter for JSON files only and fetch their content
    const fetchedWorkflows = Array.isArray(data) 
      ? data.filter((file: any) => 
          file.name.endsWith('.json') && 
          file.type === 'file' &&
          file.download_url
        )
      : [];

    const workflowsWithContent = await Promise.all(
      fetchedWorkflows.map(async (workflowFile: any) => {
        try {
          const contentResponse = await fetch(workflowFile.download_url);
          if (!contentResponse.ok) {
            console.warn(`Failed to fetch content for ${workflowFile.name}: ${contentResponse.statusText}`);
            return { ...workflowFile, workflow_data: null }; // Return with null content on failure
          }
          const workflowData = await contentResponse.json();
          return { ...workflowFile, workflow_data: workflowData };
        } catch (contentError) {
          console.error(`Error fetching content for ${workflowFile.name}:`, contentError);
          return { ...workflowFile, workflow_data: null }; // Return with null content on error
        }
      })
    );

    return NextResponse.json({ workflows: workflowsWithContent });
  } catch (error) {
    console.error('Error fetching GitHub workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows from GitHub' },
      { status: 500 }
    );
  }
}
