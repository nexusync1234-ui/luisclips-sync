import { NextRequest, NextResponse } from 'next/server';
import { isSameOrigin, verifyAdmin } from '@/lib/auth';
import { getOnlineCount, isValidVisitorId, touchVisitor } from '@/lib/presence';

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    online: getOnlineCount(),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ success: false, error: 'Pedido rejeitado.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (!isValidVisitorId(body.visitorId)) {
    return NextResponse.json({ success: false, error: 'Visitante inválido.' }, { status: 400 });
  }

  touchVisitor(body.visitorId);
  return NextResponse.json({ success: true });
}
