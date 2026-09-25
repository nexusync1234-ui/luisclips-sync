const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

if (!process.env.DATABASE_URL) {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) process.env.DATABASE_URL = match[1];
  }
}

let prisma = null;
try {
  if (process.env.DATABASE_URL) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
} catch (err) {
  console.warn('Aviso: Prisma não inicializado, usando armazenamento JSON:', err.message);
}

const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

function loadLocalStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Aviso ao ler db.json:', err.message);
  }
  return { clippers: [], clips: [], lastUpdated: new Date().toISOString() };
}

function saveLocalStore(store) {
  store.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function getPythonExecutable() {
  const winVenv = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const nixVenv = path.join(process.cwd(), '.venv', 'bin', 'python');
  if (fs.existsSync(winVenv)) return winVenv;
  if (fs.existsSync(nixVenv)) return nixVenv;
  return process.platform === 'win32' ? 'python' : 'python3';
}

const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_user.py');

function scrapeUser(username) {
  return new Promise((resolve, reject) => {
    const py = getPythonExecutable();
    const proc = spawn(py, [scriptPath, username], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => stdout += chunk.toString('utf-8'));
    proc.stderr.on('data', chunk => stderr += chunk.toString('utf-8'));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout scraping @' + username));
    }, 55000);

    proc.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', code => {
      clearTimeout(timer);
      try {
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start === -1 || end === -1) {
          return reject(new Error('Invalid output for @' + username));
        }
        const data = JSON.parse(stdout.slice(start, end + 1));
        if (code !== 0 || data.error) {
          return reject(new Error(data.error || stderr.trim() || 'Recolha sem sucesso'));
        }
        if (!data.videos?.length && (data.profile?.videoCount || 0) > 0) {
          return reject(new Error('Recolha sem vídeos verificáveis'));
        }
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function parseDateSafe(d) {
  const dt = new Date(d);
  if (!d || isNaN(dt.getTime())) return new Date();
  return dt;
}

async function syncAll() {
  const errors = [];
  let syncedCount = 0;
  console.log('--- Iniciando sincronização automática dos clippers ---');

  const store = loadLocalStore();
  const targetUser = process.argv[2] ? process.argv[2].replace('@', '').trim() : null;

  let neonAvailable = false;
  let dbClippers = [];
  if (prisma) {
    try {
      dbClippers = targetUser
        ? await prisma.clipper.findMany({ where: { username: targetUser }, select: { id: true, username: true } })
        : await prisma.clipper.findMany({ select: { id: true, username: true } });
      neonAvailable = true;
    } catch (dbErr) {
      console.warn('Neon PostgreSQL indisponível/pausado, sincronizando diretamente para data/db.json:', dbErr.message);
      neonAvailable = false;
    }
  }

  // Merge usernames from db.json and Neon
  const clipperMap = new Map();
  for (const c of store.clippers || []) {
    if (!targetUser || c.username === targetUser) {
      clipperMap.set(c.username.toLowerCase(), { id: c.id || `c_${c.username}`, username: c.username });
    }
  }
  for (const c of dbClippers) {
    if (!targetUser || c.username === targetUser) {
      clipperMap.set(c.username.toLowerCase(), { id: c.id, username: c.username });
    }
  }

  const clippers = Array.from(clipperMap.values());
  console.log('Encontrados ' + clippers.length + ' clippers para sincronizar.');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Index existing clips in store by id
  const clipsMap = new Map();
  for (const cl of store.clips || []) {
    clipsMap.set(cl.id, cl);
  }

  for (const c of clippers) {
    try {
      console.log('A sincronizar @' + c.username + '...');
      const scraped = await scrapeUser(c.username);
      if (!scraped || !scraped.profile) {
        throw new Error('Perfil vazio para @' + c.username);
      }

      const videos = scraped.videos || [];
      for (const v of videos) {
        const d = parseDateSafe(v.uploadDate);
        const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        clipsMap.set(v.id, {
          id: v.id,
          clipperId: c.id,
          title: v.title,
          url: v.url,
          coverUrl: v.coverUrl || '',
          viewCount: v.viewCount,
          likeCount: v.likeCount,
          commentCount: v.commentCount,
          repostCount: v.repostCount,
          duration: v.duration,
          uploadDate: d.toISOString(),
          isCurrentMonth
        });
      }

      // Compute sums from all tracked clips for this clipper
      const clipperClips = Array.from(clipsMap.values()).filter(cl => cl.clipperId === c.id);
      const monthlyViews = clipperClips
        .filter(cl => {
          const d = parseDateSafe(cl.uploadDate);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .reduce((acc, cl) => acc + (cl.viewCount || 0), 0);
      const allTimeViews = clipperClips.reduce((acc, cl) => acc + (cl.viewCount || 0), 0);

      // Update local store clipper entry
      const existingIdx = store.clippers.findIndex(item => item.username.toLowerCase() === c.username.toLowerCase());
      const existingObj = existingIdx >= 0 ? store.clippers[existingIdx] : {};
      const updatedClipperObj = {
        ...existingObj,
        id: c.id,
        username: c.username,
        nickname: scraped.profile.nickname || existingObj.nickname || c.username,
        avatar: scraped.profile.avatar || existingObj.avatar || '',
        bio: scraped.profile.bio || existingObj.bio || '',
        followers: scraped.profile.followers > 0 ? scraped.profile.followers : (existingObj.followers || 0),
        totalLikes: scraped.profile.totalLikes > 0 ? scraped.profile.totalLikes : (existingObj.totalLikes || 0),
        videoCount: scraped.profile.videoCount > 0 ? scraped.profile.videoCount : clipperClips.length,
        monthlyViews,
        allTimeViews,
        lastSyncedAt: new Date(scraped.syncedAt || new Date()).toISOString(),
        createdAt: existingObj.createdAt || new Date().toISOString()
      };

      if (existingIdx >= 0) {
        store.clippers[existingIdx] = updatedClipperObj;
      } else {
        store.clippers.push(updatedClipperObj);
      }

      // Also update Neon if available
      if (neonAvailable && prisma) {
        try {
          await prisma.clipper.upsert({
            where: { username: c.username },
            create: {
              id: c.id,
              username: c.username,
              nickname: updatedClipperObj.nickname,
              avatar: updatedClipperObj.avatar,
              bio: updatedClipperObj.bio,
              followers: updatedClipperObj.followers,
              totalLikes: updatedClipperObj.totalLikes,
              videoCount: updatedClipperObj.videoCount,
              monthlyViews,
              allTimeViews,
              lastSyncedAt: new Date(updatedClipperObj.lastSyncedAt)
            },
            update: {
              nickname: updatedClipperObj.nickname,
              avatar: updatedClipperObj.avatar,
              bio: updatedClipperObj.bio,
              followers: updatedClipperObj.followers,
              totalLikes: updatedClipperObj.totalLikes,
              videoCount: updatedClipperObj.videoCount,
              monthlyViews,
              allTimeViews,
              lastSyncedAt: new Date(updatedClipperObj.lastSyncedAt)
            }
          });

          const BATCH_SIZE = 15;
          for (let i = 0; i < videos.length; i += BATCH_SIZE) {
            const batch = videos.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(v => {
              const d = parseDateSafe(v.uploadDate);
              const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
              return prisma.clip.upsert({
                where: { id: v.id },
                create: {
                  id: v.id,
                  clipperId: c.id,
                  title: v.title,
                  url: v.url,
                  coverUrl: v.coverUrl || '',
                  viewCount: v.viewCount,
                  likeCount: v.likeCount,
                  commentCount: v.commentCount,
                  repostCount: v.repostCount,
                  duration: v.duration,
                  uploadDate: d,
                  isCurrentMonth
                },
                update: {
                  title: v.title,
                  coverUrl: v.coverUrl || '',
                  viewCount: v.viewCount,
                  likeCount: v.likeCount,
                  commentCount: v.commentCount,
                  repostCount: v.repostCount,
                  uploadDate: d,
                  isCurrentMonth
                }
              });
            }));
          }
        } catch (neonErr) {
          console.warn('Neon falhou durante escrita, continuando apenas em db.json:', neonErr.message);
          neonAvailable = false;
        }
      }

      syncedCount++;
      console.log('[OK] @' + c.username + ': ' + videos.length + ' clips atualizados (views mês: ' + monthlyViews + ')');
    } catch (err) {
      errors.push({ username: c.username, error: err.message });
      console.error('Erro ao sincronizar @' + c.username + ':', err.message);
    }
  }

  // Sort clippers by monthlyViews descending and save db.json
  store.clippers.sort((a, b) => (b.monthlyViews || 0) - (a.monthlyViews || 0));
  store.clips = Array.from(clipsMap.values());
  saveLocalStore(store);

  console.log(`Sincronização: ${syncedCount}/${clippers.length} contas atualizadas; ${errors.length} falhas.`);
  return { syncedCount, totalCount: clippers.length, errors };
}

module.exports = { syncAll };

if (require.main === module) {
  syncAll()
    .then((result) => {
      if (result.syncedCount === 0 && result.totalCount > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      if (prisma) {
        try { await prisma.$disconnect(); } catch {}
      }
    });
}
