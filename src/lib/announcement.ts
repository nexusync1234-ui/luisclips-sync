import fs from 'fs';
import path from 'path';
import { SiteAnnouncement } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'announcement.json');

const emptyState: SiteAnnouncement = {
  message: '',
  updatedAt: null,
};

function readStore(): SiteAnnouncement {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ...emptyState };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as SiteAnnouncement;
    return {
      message: typeof parsed.message === 'string' ? parsed.message : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return { ...emptyState };
  }
}

function writeStore(state: SiteAnnouncement) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    console.warn('Skipping announcement file write in read-only environment');
  }
}

export function sanitizeAnnouncement(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function getAnnouncement(): SiteAnnouncement {
  const state = readStore();
  return {
    message: sanitizeAnnouncement(state.message),
    updatedAt: state.updatedAt,
  };
}

export function setAnnouncement(message: unknown): SiteAnnouncement {
  const cleaned = sanitizeAnnouncement(message);
  const next = {
    message: cleaned,
    updatedAt: cleaned ? new Date().toISOString() : null,
  };
  writeStore(next);
  return next;
}
