import fs from 'fs';
import path from 'path';
import { SiteAnnouncement } from './types';
import { getSetting, setSetting } from './siteSettings';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'announcement.json');
const SETTING_KEY = 'announcement';

const emptyState: SiteAnnouncement = {
  message: '',
  updatedAt: null,
};

export function sanitizeAnnouncement(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function parseState(raw: string | null): SiteAnnouncement {
  if (!raw) return { ...emptyState };
  try {
    const parsed = JSON.parse(raw) as SiteAnnouncement;
    return {
      message: sanitizeAnnouncement(parsed.message),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return { ...emptyState };
  }
}

function readFileStore(): SiteAnnouncement {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ...emptyState };
    }
    return parseState(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { ...emptyState };
  }
}

function writeFileStore(state: SiteAnnouncement) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    console.warn('Skipping announcement file write in read-only environment');
  }
}

export async function getAnnouncement(): Promise<SiteAnnouncement> {
  const fromDb = parseState(await getSetting(SETTING_KEY));
  if (fromDb.message || fromDb.updatedAt) {
    return fromDb;
  }
  return readFileStore();
}

export async function setAnnouncement(message: unknown): Promise<SiteAnnouncement> {
  const cleaned = sanitizeAnnouncement(message);
  const next = {
    message: cleaned,
    updatedAt: cleaned ? new Date().toISOString() : null,
  };
  writeFileStore(next);
  await setSetting(SETTING_KEY, JSON.stringify(next));
  return next;
}
