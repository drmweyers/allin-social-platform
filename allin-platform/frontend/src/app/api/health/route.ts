import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker container monitoring
 * Used by Docker HEALTHCHECK to verify the application is running correctly
 */
export async function GET() {
  try {
    // Basic health check - verify the application is responding
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 200 }
    );
  } catch (error) {
    // If there's any error, return unhealthy status
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
