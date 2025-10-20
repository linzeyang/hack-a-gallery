import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await projectService.create(body);

    if (result.success && result.data) {
      return NextResponse.json(result.data, { status: 201 });
    }

    return NextResponse.json(
      { error: result.error || 'Failed to create project' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
