import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    // Forward cookies from the frontend request to the backend
    const cookies = request.headers.get('cookie');

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies }),
      },
    });

    const data = await response.json();

    // Create response with cleared cookies
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Clear authentication cookies
    nextResponse.cookies.set('sessionToken', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/' 
    });
    
    nextResponse.cookies.set('accessToken', '', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/' 
    });

    return nextResponse;
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );
  }
}