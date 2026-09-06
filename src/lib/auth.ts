import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'luisclips_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const MUTATION_WINDOW_MS = 60 * 1000;
const MUTATION_MAX = 40;

type RateBucket = { count: number; resetAt: number };

const loginAttempts = new Map<string, RateBucket>();
const mutationAttempts = new Map<string, RateBucket>();

export function getAdminCookieOptions(maxAge: number) {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

function getAdminSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (typeof password === 'string' && password.length > 0) {
    return password;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'luisclips2026';
  }
  return null;
}

export function safeEqual(a: string, b: string): boolean {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

export function createAdminSession(): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`luisclips.session.${issuedAt}`)
    .digest('hex');
  return `${issuedAt}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const secret = getAdminSecret();
  if (!secret || !token) return false;

  const sep = token.indexOf('.');
  if (sep <= 0) return false;

  const issuedAt = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  if (!/^\d+$/.test(issuedAt) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const age = Date.now() - Number(issuedAt);
  if (age < 0 || age > ADMIN_SESSION_MAX_AGE * 1000) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`luisclips.session.${issuedAt}`)
    .digest('hex');
  return safeEqual(signature, expected);
}

function normalizeHost(value: string) {
  return value.split(',')[0].trim().replace(/:\d+$/, '').toLowerCase();
}

export function isSameOrigin(req: NextRequest): boolean {
  const allowed = [
    req.headers.get('x-forwarded-host'),
    req.headers.get('host'),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeHost);

  if (allowed.length === 0) return false;

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  let requestHost = '';

  try {
    if (origin) {
      requestHost = normalizeHost(new URL(origin).host);
    } else if (referer) {
      requestHost = normalizeHost(new URL(referer).host);
    }
  } catch {
    return false;
  }

  if (!requestHost) return false;
  return allowed.includes(requestHost);
}

export function verifyAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(cookie && verifySessionToken(cookie));
}

export function verifyAdminMutation(req: NextRequest): boolean {
  return verifyAdmin(req);
}

function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

function pruneStore(store: Map<string, RateBucket>) {
  if (store.size < 2000) return;
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) {
      store.delete(key);
    }
  }
  if (store.size > 2000) {
    store.clear();
  }
}

function consumeLimit(
  store: Map<string, RateBucket>,
  key: string,
  max: number,
  windowMs: number
): boolean {
  pruneStore(store);
  const now = Date.now();
  const current = store.get(key);
  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function canAttemptLogin(req: NextRequest): boolean {
  const key = getClientKey(req);
  const current = loginAttempts.get(key);
  if (!current) return true;
  if (Date.now() > current.resetAt) return true;
  return current.count < LOGIN_MAX_ATTEMPTS;
}

export function recordFailedLogin(req: NextRequest): void {
  consumeLimit(loginAttempts, getClientKey(req), LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
}

export function resetLoginAttempts(req: NextRequest): void {
  loginAttempts.delete(getClientKey(req));
}

export function consumeMutationAttempt(req: NextRequest): boolean {
  return consumeLimit(
    mutationAttempts,
    `mut:${getClientKey(req)}`,
    MUTATION_MAX,
    MUTATION_WINDOW_MS
  );
}

export function verifyAdminPassword(password: unknown): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) {
    return false;
  }
  return safeEqual(password, secret);
}
