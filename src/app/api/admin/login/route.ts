import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_MAX_AGE,
  canAttemptLogin,
  createAdminSession,
  getAdminCookieOptions,
  isSameOrigin,
  recordFailedLogin,
  resetLoginAttempts,
  verifyAdminPassword,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Pedido rejeitado.' },
        { status: 403 }
      );
    }

    if (!canAttemptLogin(req)) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas tentativas. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      recordFailedLogin(req);
      return NextResponse.json(
        { success: false, error: 'Senha de administrador incorreta.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const password = body && typeof body === 'object' ? (body as { password?: unknown }).password : null;

    if (!verifyAdminPassword(password)) {
      recordFailedLogin(req);
      return NextResponse.json(
        { success: false, error: 'Senha de administrador incorreta.' },
        { status: 401 }
      );
    }

    const token = createAdminSession();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Senha de administrador incorreta.' },
        { status: 401 }
      );
    }

    resetLoginAttempts(req);

    const response = NextResponse.json({ success: true, message: 'Autenticado com sucesso!' });
    response.cookies.set({
      ...getAdminCookieOptions(ADMIN_SESSION_MAX_AGE),
      value: token,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Não foi possível autenticar.' },
      { status: 500 }
    );
  }
}
