const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataFile = path.join(__dirname, '..', 'data', 'db.json');
  if (!fs.existsSync(dataFile)) {
    console.log('Nenhum dado local encontrado para sincronizar.');
    return;
  }

  const raw = fs.readFileSync(dataFile, 'utf-8');
  const store = JSON.parse(raw);

  console.log(`🐘 A sincronizar ${store.clippers.length} clippers e ${store.clips.length} clipes com o Neon PostgreSQL...`);

  for (const c of store.clippers) {
    await prisma.clipper.upsert({
      where: { username: c.username },
      create: {
        id: c.id,
        username: c.username,
        nickname: c.nickname,
        avatar: c.avatar,
        bio: c.bio,
        secUid: c.secUid,
        followers: c.followers,
        totalLikes: c.totalLikes,
        videoCount: c.videoCount,
        monthlyViews: c.monthlyViews,
        allTimeViews: c.allTimeViews,
        lastSyncedAt: new Date(c.lastSyncedAt),
      },
      update: {
        nickname: c.nickname,
        avatar: c.avatar,
        bio: c.bio,
        secUid: c.secUid,
        followers: c.followers,
        totalLikes: c.totalLikes,
        videoCount: c.videoCount,
        monthlyViews: c.monthlyViews,
        allTimeViews: c.allTimeViews,
        lastSyncedAt: new Date(c.lastSyncedAt),
      },
    });

    const userClips = store.clips.filter((cl) => cl.clipperUsername === c.username || cl.clipperId === c.id);
    for (const clip of userClips) {
      let uploadDate = new Date();
      if (clip.uploadDate && clip.uploadDate.length === 8) {
        const y = parseInt(clip.uploadDate.slice(0, 4), 10);
        const m = parseInt(clip.uploadDate.slice(4, 6), 10) - 1;
        const d = parseInt(clip.uploadDate.slice(6, 8), 10);
        uploadDate = new Date(Date.UTC(y, m, d));
      } else if (clip.uploadDate) {
        uploadDate = new Date(clip.uploadDate);
      }

      await prisma.clip.upsert({
        where: { id: clip.id },
        create: {
          id: clip.id,
          clipperId: c.id,
          title: clip.title,
          url: clip.url,
          coverUrl: clip.coverUrl,
          viewCount: clip.viewCount,
          likeCount: clip.likeCount,
          commentCount: clip.commentCount,
          repostCount: clip.repostCount,
          duration: clip.duration,
          uploadDate,
          isCurrentMonth: Boolean(clip.isCurrentMonth),
        },
        update: {
          title: clip.title,
          coverUrl: clip.coverUrl,
          viewCount: clip.viewCount,
          likeCount: clip.likeCount,
          commentCount: clip.commentCount,
          repostCount: clip.repostCount,
          isCurrentMonth: Boolean(clip.isCurrentMonth),
        },
      });
    }
  }

  const clippersCount = await prisma.clipper.count();
  const clipsCount = await prisma.clip.count();

  console.log(`✅ Sucesso! O teu Neon PostgreSQL tem agora ${clippersCount} clippers e ${clipsCount} clipes gravados na nuvem!`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Erro na sincronização:', err);
  prisma.$disconnect();
  process.exit(1);
});
