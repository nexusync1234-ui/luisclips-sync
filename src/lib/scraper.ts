import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ScraperOutput {
  profile: {
    username: string;
    nickname: string;
    avatar: string;
    bio: string;
    followers: number;
    totalLikes: number;
    videoCount: number;
    secUid: string;
  };
  videos: Array<{
    id: string;
    title: string;
    url: string;
    coverUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    duration: number;
    uploadDate: string;
    isCurrentMonth: boolean;
  }>;
  monthlyViews: number;
  allTimeViews: number;
  syncedAt: string;
}

/**
 * Native TikTok SSR Scraper (Zero Python, Zero External Dependencies)
 * Runs in under 1 second on Vercel Serverless Functions!
 */
export async function fetchTikTokNative(username: string): Promise<ScraperOutput> {
  const cleanUsername = username.replace(/^@/, '').trim();
  const url = `https://www.tiktok.com/@${cleanUsername}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`TikTok respondeu com status ${res.status}`);
    }

    const html = await res.text();

    // 1. Try __UNIVERSAL_DATA_FOR_REHYDRATION__
    const rehydrationMatch = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
    );

    if (rehydrationMatch) {
      try {
        const data = JSON.parse(rehydrationMatch[1]);
        const userDetail = data.__DEFAULT_SCOPE__?.['webapp.user-detail'];

        if (userDetail && userDetail.userInfo) {
          const u = userDetail.userInfo.user || {};
          const st = userDetail.userInfo.stats || {};

          const followers = Number(st.followerCount || 0);
          const totalLikes = Number(st.heartCount || st.heart || 0);
          const videoCount = Number(st.videoCount || 0);
          const now = new Date();

          return {
            profile: {
              username: u.uniqueId || cleanUsername,
              nickname: u.nickname || cleanUsername,
              avatar: u.avatarLarger || u.avatarMedium || u.avatarThumb || '',
              bio: u.signature || '',
              followers,
              totalLikes,
              videoCount,
              secUid: u.secUid || '',
            },
            videos: [],
            monthlyViews: 0,
            allTimeViews: 0,
            syncedAt: now.toISOString(),
          };
        }
      } catch (jsonErr: any) {
        console.warn('Erro ao decodificar JSON rehydration:', jsonErr);
      }
    }

    // 2. Fallback: SIGI_STATE
    const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (sigiMatch) {
      try {
        const data = JSON.parse(sigiMatch[1]);
        const userModule =
          data.UserModule?.users?.[cleanUsername] || Object.values(data.UserModule?.users || {})[0];
        const statsModule =
          data.UserModule?.stats?.[cleanUsername] || Object.values(data.UserModule?.stats || {})[0];

        if (userModule) {
          const followers = Number(statsModule?.followerCount || 0);
          const totalLikes = Number(statsModule?.heartCount || statsModule?.heart || 0);
          const videoCount = Number(statsModule?.videoCount || 0);
          const now = new Date();

          return {
            profile: {
              username: (userModule as any).uniqueId || cleanUsername,
              nickname: (userModule as any).nickname || cleanUsername,
              avatar: (userModule as any).avatarLarger || (userModule as any).avatarMedium || '',
              bio: (userModule as any).signature || '',
              followers,
              totalLikes,
              videoCount,
              secUid: (userModule as any).secUid || '',
            },
            videos: [],
            monthlyViews: 0,
            allTimeViews: 0,
            syncedAt: now.toISOString(),
          };
        }
      } catch (sigiErr: any) {
        console.warn('Erro ao decodificar SIGI_STATE:', sigiErr);
      }
    }

    throw new Error(`Não foi possível encontrar os dados públicos do perfil @${cleanUsername}`);
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(err.message || `Erro ao recolher dados de @${cleanUsername}`);
  }
}

/**
 * Runs local python scraper if .venv exists, otherwise executes fast native fetch
 */
export async function fetchClipperData(username: string): Promise<ScraperOutput> {
  const cleanUsername = username.replace(/^@/, '').trim();

  // Check if local Python .venv is available
  const venvPython =
    process.platform === 'win32'
      ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
      : path.join(process.cwd(), '.venv', 'bin', 'python');

  const hasLocalVenv = fs.existsSync(venvPython);

  if (hasLocalVenv) {
    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_user.py');

    try {
      const pythonOutput = await new Promise<ScraperOutput>((resolve, reject) => {
        const proc = spawn(venvPython, [scriptPath, cleanUsername], {
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => {
          stdout += chunk.toString('utf-8');
        });
        proc.stderr.on('data', (chunk) => {
          stderr += chunk.toString('utf-8');
        });

        const timer = setTimeout(() => {
          proc.kill();
          reject(new Error('Local python scraper timeout'));
        }, 12000);

        proc.on('close', (code) => {
          clearTimeout(timer);
          if (code !== 0 && !stdout) {
            return reject(new Error(`Python process exited with code ${code}`));
          }
          try {
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
              return reject(new Error('Invalid JSON from python scraper'));
            }
            const parsed = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
            resolve(parsed);
          } catch (e: any) {
            reject(e);
          }
        });
      });

      return pythonOutput;
    } catch (err: any) {
      console.warn(`[Scraper] Python local falhou ou expirou, a usar scraper nativo: ${err.message}`);
    }
  }

  // Blazing-fast native fallback for Vercel Serverless
  return fetchTikTokNative(cleanUsername);
}

