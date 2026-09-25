import prisma from './prisma';
import { isNeonConfigured } from './db';

const memoryStore = new Map<string, string>();
const lastFetchedAt = new Map<string, number>();
const SETTINGS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache so Neon DB can sleep

let tableReady = false;

async function ensureTable() {
  if (!isNeonConfigured() || tableReady) return;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
    )
  `;
  tableReady = true;
}

export async function getSetting(key: string): Promise<string | null> {
  const now = Date.now();
  const lastTime = lastFetchedAt.get(key) || 0;
  if (memoryStore.has(key) && now - lastTime < SETTINGS_CACHE_TTL_MS) {
    return memoryStore.get(key) ?? null;
  }

  if (isNeonConfigured()) {
    try {
      await ensureTable();
      const rows = await prisma.$queryRaw<Array<{ value: string }>>`
        SELECT "value" FROM "SiteSetting" WHERE "key" = ${key} LIMIT 1
      `;
      const val = rows[0]?.value ?? '';
      memoryStore.set(key, val);
      lastFetchedAt.set(key, now);
      return val || null;
    } catch (err) {
      tableReady = false;
      lastFetchedAt.set(key, now); // Avoid retrying failed DB on every request
      console.warn('Could not read site setting from Neon:', err);
    }
  }

  return memoryStore.get(key) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  memoryStore.set(key, value);
  lastFetchedAt.set(key, Date.now());

  if (!isNeonConfigured()) return;

  try {
    await ensureTable();
    await prisma.$executeRaw`
      INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT ("key")
      DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
    `;
  } catch (err) {
    tableReady = false;
    console.warn('Could not write site setting to Neon:', err);
  }
}
