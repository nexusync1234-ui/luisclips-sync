import fs from 'fs';
import path from 'path';

function parseEnvFile(filePath: string) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function ensureEnvLoaded() {
  if (process.env.DATABASE_URL) return;

  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'luisclips-main', '.env'),
    path.join(process.cwd(), '..', '.env'),
  ];

  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        parseEnvFile(file);
        if (process.env.DATABASE_URL) return;
      }
    } catch {
      continue;
    }
  }
}

ensureEnvLoaded();
