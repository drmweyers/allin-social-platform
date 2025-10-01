import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const { id } = params;

  try {
    const response = await fetch(`${API_URL}/api/inbox/messages/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inbox message API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const { id } = params;
  const body = await req.json();

  try {
    const response = await fetch(`${API_URL}/api/inbox/messages/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inbox message API PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}