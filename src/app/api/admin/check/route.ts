import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAdmin = verifyAdmin(req);
  return NextResponse.json({ success: true, isAdmin });
}
