import { NextRequest, NextResponse } from 'next/server';
import { getStoredClippers, deleteClipper } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { clippers } = await getStoredClippers();
    const clipper = clippers.find(
      (c) => c.username.toLowerCase() === username.toLowerCase()
    );

    if (!clipper) {
      return NextResponse.json({ success: false, error: 'Clipper não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, clipper });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Check Admin Authentication
    if (!verifyAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Apenas o administrador pode remover contas.' },
        { status: 401 }
      );
    }

    const { username } = await params;
    const success = await deleteClipper(username);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Clipper não encontrado para remover' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `@${username} removido com sucesso` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
