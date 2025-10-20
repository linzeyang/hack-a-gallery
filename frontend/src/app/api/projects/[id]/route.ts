import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/projects/[id] - Update a project
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = await projectService.update(id, body);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || 'Failed to update project' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
