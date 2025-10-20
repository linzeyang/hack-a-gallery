import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/events/[id] - Update an event
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = await eventService.update(id, body);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || 'Failed to update event' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
