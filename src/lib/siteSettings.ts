import prisma from './prisma';
import { isNeonConfigured } from './db';

const memoryStore = new Map<string, string>();

export async function getSetting(key: string): Promise<string | null> {
  if (isNeonConfigured()) {
    try {
      const row = await prisma.siteSetting.findUnique({ where: { key } });
      if (row) {
        memoryStore.set(key, row.value);
        return row.value;
      }
    } catch (err) {
      console.warn('Could not read site setting from Neon:', err);
    }
  }

  return memoryStore.get(key) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  memoryStore.set(key, value);

  if (isNeonConfigured()) {
    try {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
      return;
    } catch (err) {
      console.warn('Could not write site setting to Neon:', err);
    }
  }
}
