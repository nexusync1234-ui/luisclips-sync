const { PrismaClient } = require('@prisma/client');
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

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não definida em variáveis de ambiente nem no ficheiro .env!");
  process.exit(1);
}

const prisma = new PrismaClient();

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
  if (!d || isNaN(dt.getTime())) throw new Error('Data de publicação inválida');
  return dt;
}

async function syncAll() {
  const errors = [];
  let syncedCount = 0;
  console.log('--- Iniciando sincronização automática dos clippers ---');
  
  const targetUser = process.argv[2] ? process.argv[2].replace('@', '').trim() : null;
  const clippers = targetUser
    ? await prisma.clipper.findMany({ where: { username: targetUser }, select: { id: true, username: true } })
    : await prisma.clipper.findMany({ select: { id: true, username: true } });

  console.log('Encontrados ' + clippers.length + ' clippers para sincronizar.');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const c of clippers) {
    try {
      console.log('A sincronizar @' + c.username + '...');
      const scraped = await scrapeUser(c.username);
      if (!scraped || !scraped.profile) {
        throw new Error('Perfil vazio para @' + c.username);
      }

      const videos = scraped.videos || [];
      const updateData = {
        lastSyncedAt: new Date(scraped.syncedAt || new Date())
      };

      if (scraped.profile.nickname) updateData.nickname = scraped.profile.nickname;
      if (scraped.profile.avatar) updateData.avatar = scraped.profile.avatar;
      if (scraped.profile.bio) updateData.bio = scraped.profile.bio;
      if (scraped.profile.followers > 0) updateData.followers = scraped.profile.followers;
      if (scraped.profile.totalLikes > 0) updateData.totalLikes = scraped.profile.totalLikes;
      if (scraped.profile.videoCount > 0) updateData.videoCount = scraped.profile.videoCount;

      const updated = await prisma.clipper.update({
        where: { id: c.id },
        data: updateData
      });

      // Upsert clips in parallel batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async v => {
          const d = parseDateSafe(v.uploadDate);
          const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;

          return prisma.clip.upsert({
            where: { id: v.id },
            create: {
              id: v.id,
              clipperId: updated.id,
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

      // Sum all tracked clips, including older clips outside the scraper's latest page.
      const month = await prisma.clip.aggregate({
        where: {
          clipperId: c.id,
          uploadDate: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        },
        _sum: { viewCount: true }
      });
      const total = await prisma.clip.aggregate({
        where: { clipperId: c.id },
        _sum: { viewCount: true }
      });

      await prisma.clipper.update({
        where: { id: c.id },
        data: {
          monthlyViews: month._sum.viewCount || 0,
          allTimeViews: total._sum.viewCount || 0
        }
      });

      syncedCount++;
      console.log('[OK] @' + c.username + ': ' + videos.length + ' clips atualizados (views mês: ' + (month._sum.viewCount || 0) + ')');
    } catch (err) {
      errors.push({ username: c.username, error: err.message });
      console.error('Erro ao sincronizar @' + c.username + ':', err.message);
    }
  }

  console.log(`Sincronização: ${syncedCount}/${clippers.length} contas atualizadas; ${errors.length} falhas.`);
  return { syncedCount, errors };
}

module.exports = { syncAll };

if (require.main === module) {
  syncAll().then(result => {
    if (result.errors.length) process.exitCode = 1;
    return prisma.$disconnect();
  }).catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
}
