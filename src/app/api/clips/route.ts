import { NextRequest, NextResponse } from 'next/server';
import { getStoredClippers } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { clips } = await getStoredClippers();
    const { searchParams } = new URL(req.url);
    
    const monthOnly = searchParams.get('month') === 'true';
    const clipper = searchParams.get('clipper');
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;

    let filtered = [...clips];

    if (monthOnly) {
      filtered = filtered.filter((c) => c.isCurrentMonth);
    }

    if (clipper) {
      filtered = filtered.filter(
        (c) => c.clipperUsername?.toLowerCase() === clipper.toLowerCase()
      );
    }

    filtered.sort((a, b) => b.viewCount - a.viewCount);

    return NextResponse.json({
      success: true,
      clips: filtered.slice(0, limit),
      totalCount: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
