import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const response = await fetch(`${API_URL}/api/scheduling/posts?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json();
    
    // Transform the response to match frontend expectations
    return NextResponse.json({
      posts: data.data || []
    }, { status: response.status });
  } catch (error) {
    console.error('Schedule posts API error:', error);
    return NextResponse.json(
      { posts: [], success: false, message: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/api/scheduling/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Schedule post API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}