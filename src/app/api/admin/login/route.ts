import { NextRequest, NextResponse } from 'next/server';
import { getExpectedToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'luisclips2026';

    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Senha de administrador incorreta.' },
        { status: 401 }
      );
    }

    const token = getExpectedToken();
    const response = NextResponse.json({ success: true, message: 'Autenticado com sucesso!' });

    // Set HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
