import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceState } from '@/lib/maintenance';
import { getAnnouncement } from '@/lib/announcement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  req.nextUrl.searchParams.get('t');

  return NextResponse.json(
    {
      success: true,
      maintenance: await getMaintenanceState(),
      announcement: await getAnnouncement(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    }
  );
}
