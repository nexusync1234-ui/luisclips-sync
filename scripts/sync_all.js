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
    }, 35000);

    proc.on('close', code => {
      clearTimeout(timer);
      try {
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start === -1 || end === -1) {
          return reject(new Error('Invalid output for @' + username));
        }
        const data = JSON.parse(stdout.slice(start, end + 1));
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function parseDateSafe(d) {
  if (!d) return new Date();
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

async function syncAll() {
  console.log('--- Iniciando sincronização automática dos clippers ---');
  const clippers = await prisma.clipper.findMany({ select: { id: true, username: true } });
  console.log('Encontrados ' + clippers.length + ' clippers na base de dados.');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const c of clippers) {
    try {
      console.log('A sincronizar @' + c.username + '...');
      const scraped = await scrapeUser(c.username);
      if (!scraped || !scraped.profile) {
        console.warn('Aviso: Perfil vazio para @' + c.username);
        continue;
      }

      const videos = scraped.videos || [];
      const septViews = videos
        .filter(v => {
          const d = parseDateSafe(v.uploadDate);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .reduce((acc, v) => acc + v.viewCount, 0);

      const allViews = videos.reduce((acc, v) => acc + v.viewCount, 0);

      const updated = await prisma.clipper.update({
        where: { id: c.id },
        data: {
          nickname: scraped.profile.nickname,
          avatar: scraped.profile.avatar || undefined,
          bio: scraped.profile.bio,
          followers: scraped.profile.followers,
          totalLikes: scraped.profile.totalLikes,
          videoCount: scraped.profile.videoCount,
          monthlyViews: septViews,
          allTimeViews: allViews,
          lastSyncedAt: new Date(scraped.syncedAt || new Date())
        }
      });

      // Upsert clips
      for (const v of videos) {
        const d = parseDateSafe(v.uploadDate);
        const isCurrentMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;

        await prisma.clip.upsert({
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
      }

      console.log('✓ @' + c.username + ': ' + septViews.toLocaleString('pt-PT') + ' views em setembro (' + videos.length + ' clips)');
    } catch (err) {
      console.error('Erro ao sincronizar @' + c.username + ':', err.message);
    }
  }

  console.log('--- Sincronização concluída com sucesso! ---');
}

module.exports = { syncAll };

if (require.main === module) {
  syncAll().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
}
