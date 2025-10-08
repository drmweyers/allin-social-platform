import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api-config';

const API_BASE_URL = API_URL;

export async function GET(request: NextRequest) {
  try {
    // Forward cookies from the frontend request to the backend
    const cookies = request.headers.get('cookie');

    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies }),
      },
    });

    const data = await response.json();

    // Forward the response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Session proxy error:', error);
    return NextResponse.json(
      { success: false, data: { user: null } },
      { status: 200 }
    );
  }
}