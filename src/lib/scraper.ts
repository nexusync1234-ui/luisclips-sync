import { spawn } from 'child_process';
import path from 'path';
import { Clipper, Clip } from './types';

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

export async function fetchClipperData(username: string): Promise<ScraperOutput> {
  const cleanUsername = username.replace(/^@/, '').trim();
  const scriptPath = path.join(process.cwd(), 'scripts', 'scrape_user.py');
  
  // Prefer project .venv python if available
  const venvPython = process.platform === 'win32'
    ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
    : path.join(process.cwd(), '.venv', 'bin', 'python');

  const pythonExec = require('fs').existsSync(venvPython) ? venvPython : 'python';

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonExec, [scriptPath, cleanUsername], {
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

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Timeout ao analisar @${cleanUsername}`));
    }, 35000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && !stdout) {
        return reject(new Error(`Erro ao recolher dados (${code}): ${stderr || 'Falha desconhecida'}`));
      }

      try {
        // Find JSON in stdout (in case python printed any warning)
        const jsonStart = stdout.indexOf('{');
        const jsonEnd = stdout.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('Resposta inválida do scraper');
        }

        const jsonStr = stdout.slice(jsonStart, jsonEnd + 1);
        const parsed: ScraperOutput = JSON.parse(jsonStr);
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Erro ao interpretar dados de @${cleanUsername}: ${err.message}`));
      }
    });
  });
}
