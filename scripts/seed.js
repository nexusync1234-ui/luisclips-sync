const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const initialUsernames = [
  'clipesptluisferreira',
  'clipsdoferreirinha',
  'clipsdoluisferreiraa',
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function runPythonScraper(username) {
  const scriptPath = path.join(__dirname, 'scrape_user.py');
  const venvPython = process.platform === 'win32'
    ? path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', '.venv', 'bin', 'python');

  const pythonExec = fs.existsSync(venvPython) ? venvPython : 'python';

  return new Promise((resolve) => {
    console.log(`📡 Recolhendo dados reais de @${username}...`);
    const proc = spawn(pythonExec, [scriptPath, username], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString('utf-8')));
    proc.stderr.on('data', (d) => (stderr += d.toString('utf-8')));

    proc.on('close', (code) => {
      try {
        const jsonStart = stdout.indexOf('{');
        const jsonEnd = stdout.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const data = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
          console.log(`✅ @${username} processado com sucesso! (${data.videos.length} vídeos, ${data.monthlyViews} views no mês)`);
          return resolve(data);
        }
      } catch (err) {
        console.error(`❌ Erro ao processar @${username}:`, err.message);
      }
      resolve(null);
    });
  });
}

async function seed() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const clippers = [];
  const allClips = [];

  for (const u of initialUsernames) {
    const res = await runPythonScraper(u);
    if (res && res.profile) {
      const clipperId = `c_${u}`;
      const clips = (res.videos || []).map((v) => ({
        ...v,
        clipperId,
        clipperUsername: u,
        clipperNickname: res.profile.nickname,
        clipperAvatar: res.profile.avatar,
      }));

      clippers.push({
        id: clipperId,
        username: u,
        nickname: res.profile.nickname,
        avatar: res.profile.avatar,
        bio: res.profile.bio,
        secUid: res.profile.secUid,
        followers: res.profile.followers,
        totalLikes: res.profile.totalLikes,
        videoCount: res.profile.videoCount,
        monthlyViews: res.monthlyViews,
        allTimeViews: res.allTimeViews,
        lastSyncedAt: res.syncedAt,
        createdAt: new Date().toISOString(),
        clips,
      });

      allClips.push(...clips);
    }
  }

  // Sort clippers by monthlyViews descending
  clippers.sort((a, b) => b.monthlyViews - a.monthlyViews);

  const dbContent = {
    clippers,
    clips: allClips,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(dbContent, null, 2), 'utf-8');
  console.log(`🎉 Seed concluído com sucesso em ${DATA_FILE}! Total clippers: ${clippers.length}, Total clips: ${allClips.length}`);
}

seed();
