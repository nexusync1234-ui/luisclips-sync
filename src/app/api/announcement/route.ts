import { NextRequest, NextResponse } from 'next/server';
import { consumeMutationAttempt, verifyAdminMutation } from '@/lib/auth';
import { getAnnouncement, setAnnouncement } from '@/lib/announcement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      announcement: await getAnnouncement(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!consumeMutationAttempt(req)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados pedidos. Tente novamente dentro de um minuto.' },
        { status: 429 }
      );
    }

    if (!verifyAdminMutation(req)) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const announcement = await setAnnouncement(body.message);

    return NextResponse.json({ success: true, announcement });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Não foi possível atualizar a mensagem.' },
      { status: 500 }
    );
  }
}
