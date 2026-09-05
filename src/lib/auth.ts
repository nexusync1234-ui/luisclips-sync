import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'luisclips_admin_session';

export function getExpectedToken(): string {
  const secret = process.env.ADMIN_PASSWORD || 'luisclips2026';
  return crypto.createHash('sha256').update(`luisclips_salt_${secret}`).digest('hex');
}

export function verifyAdmin(req: NextRequest): boolean {
  // Check cookie
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = getExpectedToken();
  if (cookie && cookie === expected) {
    return true;
  }

  // Check custom header (for scripts or API testing)
  const headerKey = req.headers.get('x-admin-key');
  const secret = process.env.ADMIN_PASSWORD || 'luisclips2026';
  if (headerKey && headerKey === secret) {
    return true;
  }

  return false;
}
