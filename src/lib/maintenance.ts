import fs from 'fs';
import path from 'path';
import { MaintenanceState } from './types';
import { getSetting, setSetting } from './siteSettings';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'maintenance.json');
const SETTING_KEY = 'maintenance';

const emptyState: MaintenanceState = {
  enabled: false,
  endsAt: null,
};

function parseState(raw: string | null): MaintenanceState {
  if (!raw) return { ...emptyState };
  try {
    const parsed = JSON.parse(raw) as MaintenanceState;
    return {
      enabled: Boolean(parsed.enabled),
      endsAt: typeof parsed.endsAt === 'string' ? parsed.endsAt : null,
    };
  } catch {
    return { ...emptyState };
  }
}

function readFileStore(): MaintenanceState {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { ...emptyState };
    }
    return parseState(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { ...emptyState };
  }
}

function writeFileStore(state: MaintenanceState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    console.warn('Skipping maintenance file write in read-only environment');
  }
}

function normalizeState(state: MaintenanceState): MaintenanceState {
  if (!state.enabled) {
    return { enabled: false, endsAt: null };
  }

  if (state.endsAt) {
    const ends = new Date(state.endsAt).getTime();
    if (!Number.isNaN(ends) && ends <= Date.now()) {
      return { enabled: false, endsAt: null };
    }
  }

  return state;
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const fromSetting = parseState(await getSetting(SETTING_KEY));
  const fromFile = readFileStore();
  const state =
    fromSetting.enabled || fromSetting.endsAt
      ? fromSetting
      : fromFile.enabled || fromFile.endsAt
        ? fromFile
        : fromSetting;
  return normalizeState(state);
}

export async function setMaintenanceState(
  enabled: boolean,
  durationMinutes?: number
): Promise<MaintenanceState> {
  const next = enabled
    ? {
        enabled: true,
        endsAt: new Date(
          Date.now() + Math.min(Math.max(Number(durationMinutes) || 30, 1), 60 * 24 * 14) * 60 * 1000
        ).toISOString(),
      }
    : { enabled: false, endsAt: null };

  writeFileStore(next);
  await setSetting(SETTING_KEY, JSON.stringify(next));
  return next;
}
