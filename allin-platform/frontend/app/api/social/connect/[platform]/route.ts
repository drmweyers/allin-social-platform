import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;

    // Get cookies from request
    const cookies = request.headers.get('cookie');

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/social/connect/${platform}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in social connect proxy:', error);
    return NextResponse.json(
      { error: 'Failed to connect social account' },
      { status: 500 }
    );
  }
}