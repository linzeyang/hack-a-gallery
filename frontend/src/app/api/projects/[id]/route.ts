import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id] - Get a specific project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await projectService.getById(id);

    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }

    return NextResponse.json(
      { error: result.error || "Project not found" },
      { status: result.error?.includes("not found") ? 404 : 400 }
    );
  } catch (error) {
    console.error("Error retrieving project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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
      { error: result.error || "Failed to update project" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id] - Hide a project (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await projectService.hide(id);

    if (result.success) {
      return NextResponse.json({ message: "Project hidden successfully" });
    }

    return NextResponse.json(
      { error: result.error || "Failed to hide project" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error hiding project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
