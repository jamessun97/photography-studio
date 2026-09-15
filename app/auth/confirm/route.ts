import { cloudClient } from '@/lib/cloud';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get('code');
  if (code) {
    try {
      const client = await cloudClient(); const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL('/?account=password', url.origin));
    } catch { /* Never include provider errors or authorization codes in redirects. */ }
  }
  return NextResponse.redirect(new URL('/?account=expired', url.origin));
}
