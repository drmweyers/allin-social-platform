import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const url = new URL(req.url);
  const queryString = url.search;

  try {
    const response = await fetch(`${API_URL}/api/content/${path}${queryString}`, {
      headers: {
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Content API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Content API' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const body = await req.json();

  try {
    const response = await fetch(`${API_URL}/api/content/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Content API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to post to Content API' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const body = await req.json();

  try {
    const response = await fetch(`${API_URL}/api/content/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Content API PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update Content API' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  try {
    const response = await fetch(`${API_URL}/api/content/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Content API DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete from Content API' },
      { status: 500 }
    );
  }
}