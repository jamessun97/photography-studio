import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function cloudConfigured() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY));
}
// Route handlers only: session refresh cookies must be written to the response.
export async function cloudClient() {
  if (!cloudConfigured()) throw new Error('CLOUD_NOT_CONFIGURED');
  const jar = await cookies();
  return createServerClient((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!, (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)!, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    cookies: { getAll: () => jar.getAll(), setAll: values => values.forEach(({ name, value, options }) => jar.set(name, value, options)) },
  });
}
export function sameOrigin(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.STUDY_APP_URL ? new URL(process.env.STUDY_APP_URL).origin : `${url.protocol}//${request.headers.get('host') || url.host}`;
  return request.headers.get('origin') === expected;
}
export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
export async function smallBody(request: Request, limit: number) {
  if (!request.body) throw new Error('INVALID_BODY');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(buffer));
}
