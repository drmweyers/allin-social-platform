import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const body = await req.json();

  try {
    const response = await fetch(`${API_URL}/api/inbox/messages/bulk-update`, {
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
    console.error('Inbox bulk update API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update messages' },
      { status: 500 }
    );
  }
}