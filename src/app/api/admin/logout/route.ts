import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Sessão terminada.' });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
