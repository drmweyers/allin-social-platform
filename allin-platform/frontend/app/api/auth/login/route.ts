import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      return NextResponse.json(
        { message: 'Invalid response from server' },
        { status: 500 }
      );
    }

    // If login successful, set cookies including access token
    if (response.ok && data.success && data.data) {
      const nextResponse = NextResponse.json(data, { status: response.status });

      // Set session token from backend
      if (response.headers.get('set-cookie')) {
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          nextResponse.headers.set('set-cookie', cookies);
        }
      }

      // Also set access token as cookie for API authentication
      nextResponse.cookies.set('accessToken', data.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/'
      });

      return nextResponse;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}