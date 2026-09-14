const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const NEW_CLIPPERS = [
  'clipsluisferreira1920',
  'clipes.do.lf',
  'clipeslfpagantes',
  'ferreiraluis_',
  'edits.luisferreir',
  'cortesdoluisgoatferreira',
  'clips_ferreira_',
  'absolutepoco'
];

if (!process.env.DATABASE_URL) {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) process.env.DATABASE_URL = match[1];
  }
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

    proc.on('close', (code) => {
      clearTimeout(timer);
      try {
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start === -1 || end === -1) {
          return reject(new Error('Invalid output for @' + username + ': ' + stderr));
        }
        const data = JSON.parse(stdout.slice(start, end + 1));
        if (data.error && !data.profile) {
          return reject(new Error(data.error));
        }
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

async function addClippers() {
  console.log('🚀 A adicionar as 8 novas contas à Base de Dados!');
  console.log(`Total: ${NEW_CLIPPERS.length} clippers\n`);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 0; i < NEW_CLIPPERS.length; i++) {
    const username = NEW_CLIPPERS[i];
    console.log(`[${i + 1}/${NEW_CLIPPERS.length}] A recolher @${username}...`);

    try {
      const scraped = await scrapeUser(username);
      const profile = scraped?.profile || {
        username,
        nickname: username,
        avatar: '',
        bio: '',
        followers: 0,
        totalLikes: 0,
        videoCount: 0
      };

      const videos = scraped?.videos || [];
      const septViews = videos
        .filter(v => {
          const d = parseDateSafe(v.uploadDate);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .reduce((acc, v) => acc + v.viewCount, 0);

      const allViews = videos.reduce((acc, v) => acc + v.viewCount, 0);

      const clipper = await prisma.clipper.upsert({
        where: { username },
        create: {
          username,
          nickname: profile.nickname || username,
          avatar: profile.avatar || '',
          bio: profile.bio || '',
          followers: profile.followers || 0,
          totalLikes: profile.totalLikes || 0,
          videoCount: profile.videoCount || videos.length,
          monthlyViews: septViews,
          allTimeViews: allViews,
          lastSyncedAt: new Date(),
        },
        update: {
          nickname: profile.nickname || username,
          ...(profile.avatar ? { avatar: profile.avatar } : {}),
          ...(profile.bio ? { bio: profile.bio } : {}),
          followers: profile.followers || 0,
          totalLikes: profile.totalLikes || 0,
          videoCount: profile.videoCount || videos.length,
          monthlyViews: septViews,
          allTimeViews: allViews,
          lastSyncedAt: new Date(),
        }
      });

      for (const v of videos) {
        await prisma.clip.upsert({
          where: { id: v.id },
          create: {
            id: v.id,
            clipperId: clipper.id,
            title: v.title,
            url: v.url,
            coverUrl: v.coverUrl || '',
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            repostCount: v.repostCount,
            duration: v.duration,
            uploadDate: parseDateSafe(v.uploadDate),
            isCurrentMonth: v.isCurrentMonth,
          },
          update: {
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            repostCount: v.repostCount,
            isCurrentMonth: v.isCurrentMonth,
          }
        });
      }

      console.log(`✅ @${username} adicionado! (${videos.length} vídeos, ${septViews.toLocaleString('pt-PT')} views em setembro)`);
    } catch (err) {
      console.error(`⚠️ Erro ao processar @${username}:`, err.message);
      try {
        await prisma.clipper.upsert({
          where: { username },
          create: {
            username,
            nickname: username,
            avatar: '',
            bio: '',
            followers: 0,
            totalLikes: 0,
            videoCount: 0,
            monthlyViews: 0,
            allTimeViews: 0,
            lastSyncedAt: new Date(),
          },
          update: {}
        });
        console.log(`ℹ️ Stub criado para @${username} na base de dados.`);
      } catch (inner) {
        console.error(`Erro ao criar stub para @${username}:`, inner.message);
      }
    }
  }

  const count = await prisma.clipper.count();
  const clipsCount = await prisma.clip.count();
  console.log(`\n🎉 Concluído! Total de clippers na base de dados: ${count} (${clipsCount} clips guardados)`);
  await prisma.$disconnect();
}

addClippers().catch(e => {
  console.error('Falha fatal:', e);
  process.exit(1);
});
