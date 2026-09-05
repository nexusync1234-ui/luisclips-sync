import { NextRequest, NextResponse } from 'next/server';
import { consumeMutationAttempt, verifyAdminMutation } from '@/lib/auth';
import { getMaintenanceState, setMaintenanceState } from '@/lib/maintenance';

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      maintenance: await getMaintenanceState(),
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
    const enabled = Boolean(body.enabled);
    const hours = Number(body.hours);
    const minutes = Number(body.minutes);
    const durationMinutes = Math.round(
      (Number.isFinite(hours) ? Math.max(hours, 0) : 0) * 60 +
        (Number.isFinite(minutes) ? Math.max(minutes, 0) : 0)
    );

    const maintenance = await setMaintenanceState(enabled, enabled ? durationMinutes || 30 : undefined);

    return NextResponse.json({ success: true, maintenance });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Não foi possível atualizar a manutenção.' },
      { status: 500 }
    );
  }
}
