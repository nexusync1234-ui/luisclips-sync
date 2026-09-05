import { NextRequest, NextResponse } from 'next/server';
import { getAdminCookieOptions } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Sessão terminada.' });
  response.cookies.set({
    ...getAdminCookieOptions(0),
    value: '',
  });
  return response;
}
