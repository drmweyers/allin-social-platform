import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Forward to backend OAuth callback
    const backendUrl = new URL(`${API_URL}/api/social/callback/${platform}`);
    if (code) backendUrl.searchParams.append('code', code);
    if (state) backendUrl.searchParams.append('state', state);
    if (error) backendUrl.searchParams.append('error', error);

    // The backend will handle the OAuth flow and redirect appropriately
    return NextResponse.redirect(backendUrl.toString());
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect('/dashboard/accounts?error=callback_failed');
  }
}