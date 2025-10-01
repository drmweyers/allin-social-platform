import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  try {
    const response = await fetch(`${API_URL}/api/inbox/stats`, {
      headers: {
        'Authorization': token ? `Bearer ${token.value}` : '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inbox stats API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox statistics' },
      { status: 500 }
    );
  }
}