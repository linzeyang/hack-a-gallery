import { NextRequest, NextResponse } from "next/server";
import { validateSecurityConfiguration } from "@/lib/config/aws";

// Run security validation on application startup
// This middleware runs on every request, but validation is cached
let securityValidated = false;

export function middleware(_request: NextRequest) {
  // Only run security validation once during application startup
  if (!securityValidated) {
    try {
      validateSecurityConfiguration();
      securityValidated = true;
    } catch (error) {
      // Log security violation and prevent application from starting
      console.error("Security Configuration Error:", error);

      // In development, show the error to help developers fix it
      if (process.env.NODE_ENV === "development") {
        return new NextResponse(
          `Security Configuration Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          { status: 500 }
        );
      }

      // In production, return a generic error to avoid exposing details
      return new NextResponse("Application configuration error", {
        status: 500,
      });
    }
  }

  return NextResponse.next();
}

// Configure middleware to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
