import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * GET /api/events - Get all events
 */
export async function GET() {
  try {
    const result = await eventService.getAll();

    if (result.success) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || "Failed to retrieve events" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error retrieving events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events - Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await eventService.create(body);

    if (result.success && result.data) {
      return NextResponse.json(result.data, { status: 201 });
    }

    return NextResponse.json(
      { error: result.error || "Failed to create event" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
