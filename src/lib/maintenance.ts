import fs from 'fs';
import path from 'path';
import { MaintenanceState } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'maintenance.json');

const emptyState: MaintenanceState = {
  enabled: false,
  endsAt: null,
};

function readStore(): MaintenanceState {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ...emptyState };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as MaintenanceState;
    return {
      enabled: Boolean(parsed.enabled),
      endsAt: typeof parsed.endsAt === 'string' ? parsed.endsAt : null,
    };
  } catch {
    return { ...emptyState };
  }
}

function writeStore(state: MaintenanceState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    console.warn('Skipping maintenance file write in read-only environment');
  }
}

export function getMaintenanceState(): MaintenanceState {
  const state = readStore();
  if (!state.enabled) {
    return { enabled: false, endsAt: null };
  }

  if (state.endsAt) {
    const ends = new Date(state.endsAt).getTime();
    if (!Number.isNaN(ends) && ends <= Date.now()) {
      const closed = { enabled: false, endsAt: null };
      writeStore(closed);
      return closed;
    }
  }

  return state;
}

export function setMaintenanceState(enabled: boolean, durationMinutes?: number): MaintenanceState {
  if (!enabled) {
    const closed = { enabled: false, endsAt: null };
    writeStore(closed);
    return closed;
  }

  const minutes = Math.min(Math.max(Number(durationMinutes) || 30, 1), 60 * 24 * 14);
  const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const next = { enabled: true, endsAt };
  writeStore(next);
  return next;
}
