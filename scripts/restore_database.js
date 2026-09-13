const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ALL_CLIPPERS = [
  'reelsdoluisferreiraaa',
  'clipesdoluisferreira4',
  'luis.ferreira_clipes',
  'luis.ferrreira.clips',
  'editsdosenhorferr',
  'luisferreiracl1ps',
  'clipsdoluisferreiraa',
  'clipsdoluis',
  'clipesptluisferreira',
  'clipsdoferreirinha',
  'mod_ao_tugatulicreme',
  'luis.crespo.fan.c',
  'clipesdoluisferreiraa1',
  'luissferreiraclipes',
  'luis_ferreiragoat',
  'luisferreira_clips',
  'ihavenoenemies.cl',
  'eldictadorferreirinha',
  'luisferreririnha.clips',
  'clipes.geniais',
  'editspagantes',
  'clipsdoferreira',
  'clipsdotop1deport',
  'clippes.luisferrreira',
  'maisdoluisferreira'
];

if (!process.env.DATABASE_URL) {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) process.env.DATABASE_URL = match[1];
  }
}

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não definida em .env!");
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
    }, 45000);

    proc.on('close', () => {
      clearTimeout(timer);
      try {
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start === -1 || end === -1) {
          return reject(new Error('Invalid output for @' + username + ': ' + stderr));
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

async function restoreAll() {
  console.log('🚀 Iniciando recuperação e restauração completa da Base de Dados!');
  console.log(`Total de clippers para restaurar: ${ALL_CLIPPERS.length}`);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 0; i < ALL_CLIPPERS.length; i++) {
    const username = ALL_CLIPPERS[i];
    console.log(`\n[${i + 1}/${ALL_CLIPPERS.length}] A processar @${username}...`);

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

      // Upsert clipper
      const clipper = await prisma.clipper.upsert({
        where: { username },
        create: {
          username,
          nickname: profile.nickname || username,
          avatar: profile.avatar || '',
          bio: profile.bio || '',
          followers: profile.followers || 0,
          totalLikes: profile.totalLikes || 0,
          videoCount: profile.videoCount || 0,
          monthlyViews: septViews,
          allTimeViews: allViews,
          lastSyncedAt: new Date(),
        },
        update: {
          nickname: profile.nickname || username,
          ...(profile.avatar ? { avatar: profile.avatar } : {}),
          ...(profile.bio ? { bio: profile.bio } : {}),
          ...(profile.followers > 0 ? { followers: profile.followers } : {}),
          ...(profile.totalLikes > 0 ? { totalLikes: profile.totalLikes } : {}),
          ...(profile.videoCount > 0 ? { videoCount: profile.videoCount } : {}),
          ...(videos.length > 0 ? { monthlyViews: septViews, allTimeViews: allViews } : {}),
          lastSyncedAt: new Date(),
        }
      });

      // Insert clips
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
            title: v.title,
            coverUrl: v.coverUrl || '',
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            repostCount: v.repostCount,
            uploadDate: parseDateSafe(v.uploadDate),
            isCurrentMonth: v.isCurrentMonth,
          }
        });
      }

      console.log(`✅ @${username} restaurado com sucesso! (${videos.length} vídeos, ${septViews.toLocaleString()} views neste mês)`);
    } catch (err) {
      console.error(`⚠️ Erro ao processar @${username}:`, err.message);
      // Create stub clipper if scrape fails
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
        console.log(`ℹ️ Clipper @${username} adicionado à base de dados para sincronização futura.`);
      } catch (inner) {
        console.error(`Erro ao criar stub para @${username}:`, inner.message);
      }
    }
  }

  console.log('\n🎉 Restauração concluída com sucesso!');
  await prisma.$disconnect();
}

restoreAll().catch(e => {
  console.error('Falha fatal na restauração:', e);
  process.exit(1);
});
