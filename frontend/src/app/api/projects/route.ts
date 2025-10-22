import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

/**
 * GET /api/projects - Get all projects or projects by event
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const result = eventId
      ? await projectService.getByEvent(eventId)
      : await projectService.getAll();

    if (result.success) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || "Failed to retrieve projects" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error retrieving projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      { error: result.error || "Failed to create project" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
