import fs from 'fs';
import path from 'path';
import { ensureEnvLoaded } from './env';
import prisma from './prisma';
import { Clipper, Clip } from './types';

ensureEnvLoaded();

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseStore {
  clippers: Clipper[];
  clips: Clip[];
  lastUpdated: string;
}

function parseDateSafe(raw?: string | Date | null): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date() : raw;
  if (typeof raw === 'string' && /^\d{8}$/.test(raw)) {
    const y = parseInt(raw.slice(0, 4), 10);
    const m = parseInt(raw.slice(4, 6), 10) - 1;
    const d = parseInt(raw.slice(6, 8), 10);
    return new Date(Date.UTC(y, m, d));
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

function ensureDataDir(): DatabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initial: DatabaseStore = {
        clippers: [],
        clips: [],
        lastUpdated: new Date().toISOString(),
      };
      return initial;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      clippers: [],
      clips: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

function saveLocalStore(store: DatabaseStore) {
  try {
    ensureDataDir();
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Silently ignore on read-only environments (Vercel Lambda / Serverless)
    console.warn('Skipping local file write in read-only environment');
  }
}

export function isNeonConfigured(): boolean {
  return true;
}

let cachedResult: { clippers: Clipper[]; clips: Clip[] } | null = null;
let lastCacheAt = 0;
const DB_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes RAM cache

export function invalidateDbCache() {
  cachedResult = null;
  lastCacheAt = 0;
}

export async function getStoredClippers(forceRefresh = false): Promise<{ clippers: Clipper[]; clips: Clip[] }> {
  const nowMs = Date.now();
  if (!forceRefresh && cachedResult && nowMs - lastCacheAt < DB_CACHE_TTL_MS) {
    return cachedResult;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Primary: Read directly from GitHub Cloud JSON (updated automatically by GitHub Actions)
  try {
    let store: DatabaseStore | null = null;
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/nexusync1234-ui/luisclips-sync/main/data/db.json?t=${Math.floor(Date.now() / 60000)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const remote = await res.json();
        if (remote && Array.isArray(remote.clippers) && remote.clippers.length > 5) {
          store = remote;
        }
      }
    } catch {
      // Fall back to local bundled data/db.json
    }

    if (!store) {
      store = ensureDataDir();
    }

    const clipsByClipper = new Map<string, Clip[]>();
    for (const cl of store.clips || []) {
      const list = clipsByClipper.get(cl.clipperId) || [];
      list.push(cl);
      clipsByClipper.set(cl.clipperId, list);
    }

    const enrichedClippers: Clipper[] = (store.clippers || []).map((c) => {
      const rawClips = c.clips && c.clips.length > 0 ? c.clips : (clipsByClipper.get(c.id) || []);
      const mappedClips = rawClips.map((clip) => {
        const d = parseDateSafe(clip.uploadDate);
        const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        return {
          ...clip,
          clipperId: c.id,
          clipperUsername: c.username,
          clipperNickname: c.nickname,
          clipperAvatar: c.avatar || '',
          isCurrentMonth,
        };
      });

      const septViewsSum = mappedClips
        .filter((cl) => cl.isCurrentMonth)
        .reduce((acc, cl) => acc + cl.viewCount, 0);
      const totalClipsViewsSum = mappedClips.reduce((acc, cl) => acc + cl.viewCount, 0);

      return {
        ...c,
        monthlyViews: mappedClips.length > 0 ? septViewsSum : c.monthlyViews,
        allTimeViews: mappedClips.length > 0 ? Math.max(totalClipsViewsSum, c.allTimeViews) : c.allTimeViews,
        clips: mappedClips,
      };
    });

    const allClips = enrichedClippers.flatMap((c) => c.clips || []);
    cachedResult = { clippers: enrichedClippers, clips: allClips };
    lastCacheAt = nowMs;
    return cachedResult;
  } catch {
    return { clippers: [], clips: [] };
  }
}

export async function saveClipperData(
  clipperData: Omit<Clipper, 'id' | 'createdAt'> & { id?: string },
  clips: Clip[]
): Promise<Clipper> {
  invalidateDbCache();
  const clipperId = clipperData.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // If clips are provided, calculate monthlyViews STRICTLY as the sum of September 2026 clips!
  let exactMonthlyViews = clipperData.monthlyViews;
  let exactAllTimeViews = clipperData.allTimeViews;

  if (clips.length > 0) {
    exactMonthlyViews = clips
      .filter((cl) => {
        const d = parseDateSafe(cl.uploadDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, cl) => acc + cl.viewCount, 0);

    exactAllTimeViews = clips.reduce((acc, cl) => acc + cl.viewCount, 0);
  }

  const preparedClips = clips.map((cl) => {
    const d = parseDateSafe(cl.uploadDate);
    const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    return {
      ...cl,
      clipperId,
      clipperUsername: clipperData.username,
      clipperNickname: clipperData.nickname,
      clipperAvatar: clipperData.avatar,
      isCurrentMonth,
    };
  });

  const fullClipper: Clipper = {
    ...clipperData,
    id: clipperId,
    createdAt,
    monthlyViews: exactMonthlyViews,
    allTimeViews: exactAllTimeViews,
    clips: preparedClips,
  };

  // 1. Primary: Save directly to Neon PostgreSQL cloud database
  if (isNeonConfigured()) {
    try {
      const upserted = await prisma.clipper.upsert({
        where: { username: clipperData.username },
        create: {
          id: clipperId,
          username: clipperData.username,
          nickname: clipperData.nickname,
          avatar: clipperData.avatar,
          bio: clipperData.bio,
          followers: clipperData.followers,
          totalLikes: clipperData.totalLikes,
          videoCount: clipperData.videoCount,
          monthlyViews: exactMonthlyViews,
          allTimeViews: exactAllTimeViews,
          lastSyncedAt: new Date(clipperData.lastSyncedAt),
        },
        update: {
          nickname: clipperData.nickname,
          avatar: clipperData.avatar,
          bio: clipperData.bio,
          followers: clipperData.followers,
          totalLikes: clipperData.totalLikes,
          videoCount: clipperData.videoCount,
          ...(clips.length > 0
            ? {
                monthlyViews: exactMonthlyViews,
                allTimeViews: exactAllTimeViews,
              }
            : {}),
          lastSyncedAt: new Date(clipperData.lastSyncedAt),
        },
      });

      // Upsert clips
      for (const clip of clips) {
        await prisma.clip.upsert({
          where: { id: clip.id },
          create: {
            id: clip.id,
            clipperId: upserted.id,
            title: clip.title,
            url: clip.url,
            coverUrl: clip.coverUrl,
            viewCount: clip.viewCount,
            likeCount: clip.likeCount,
            commentCount: clip.commentCount,
            repostCount: clip.repostCount,
            duration: clip.duration,
            uploadDate: parseDateSafe(clip.uploadDate),
            isCurrentMonth: clip.isCurrentMonth,
          },
          update: {
            title: clip.title,
            coverUrl: clip.coverUrl,
            viewCount: clip.viewCount,
            likeCount: clip.likeCount,
            commentCount: clip.commentCount,
            repostCount: clip.repostCount,
            uploadDate: parseDateSafe(clip.uploadDate),
            isCurrentMonth: clip.isCurrentMonth,
          },
        });
      }

      return fullClipper;
    } catch (err: any) {
      console.error('Neon sync error:', err);
    }
  }

  // 2. Fallback: Save to local JSON store (guarded against EROFS on Vercel)
  try {
    const store = ensureDataDir();
    const existingIdx = store.clippers.findIndex(
      (c) => c.username.toLowerCase() === clipperData.username.toLowerCase()
    );

    if (existingIdx >= 0) {
      store.clippers[existingIdx] = fullClipper;
    } else {
      store.clippers.push(fullClipper);
    }

    store.clips = store.clips.filter((c) => c.clipperId !== clipperId).concat(preparedClips);
    saveLocalStore(store);
  } catch (fsErr) {
    console.warn('Local FS storage skipped:', fsErr);
  }

  return fullClipper;
}

export async function deleteClipper(username: string): Promise<boolean> {
  invalidateDbCache();
  // 1. Primary: Delete from Neon PostgreSQL
  if (isNeonConfigured()) {
    try {
      await prisma.clipper.delete({
        where: { username },
      });
      return true;
    } catch (err) {
      console.warn('Error deleting from Neon:', err);
    }
  }

  // 2. Fallback: Delete from local store (guarded against EROFS)
  try {
    const store = ensureDataDir();
    const target = store.clippers.find(
      (c) => c.username.toLowerCase() === username.toLowerCase()
    );

    if (target) {
      store.clippers = store.clippers.filter(
        (c) => c.username.toLowerCase() !== username.toLowerCase()
      );
      store.clips = store.clips.filter((c) => c.clipperId !== target.id);
      saveLocalStore(store);
      return true;
    }
  } catch (fsErr) {
    console.warn('Local FS delete skipped:', fsErr);
  }

  return false;
}
