import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { platformId: string } }
) {
  try {
    const { platformId } = params;

    // Get cookies from request
    const cookies = request.headers.get('cookie');

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/social/disconnect/${platformId}`, {
      method: 'DELETE',
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
    console.error('Error in social disconnect proxy:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect social account' },
      { status: 500 }
    );
  }
}