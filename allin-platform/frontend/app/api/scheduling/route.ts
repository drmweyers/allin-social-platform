import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Handle all scheduling-related API requests
export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const path = pathname.replace('/api/scheduling', '');

  try {
    const response = await fetch(`${API_URL}/api/scheduling${path}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Scheduling API GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch scheduling data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/scheduling', '');
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/api/scheduling${path}`, {
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
    console.error('Scheduling API POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/scheduling', '');
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/api/scheduling${path}`, {
      method: 'PUT',
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
    console.error('Scheduling API PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/scheduling', '');

  try {
    const response = await fetch(`${API_URL}/api/scheduling${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Scheduling API DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
}