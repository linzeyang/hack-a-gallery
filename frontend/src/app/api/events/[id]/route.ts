import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/events/[id] - Get a specific event
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await eventService.getById(id);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || "Event not found" },
      { status: result.error?.includes("not found") ? 404 : 400 }
    );
  } catch (error) {
    console.error("Error retrieving event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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
      { error: result.error || "Failed to update event" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id] - Hide an event (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await eventService.hide(id);

    if (result.success) {
      return NextResponse.json({ message: "Event hidden successfully" });
    }

    return NextResponse.json(
      { error: result.error || "Failed to hide event" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error hiding event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
