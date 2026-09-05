const ONLINE_MS = 45_000;
const visitors = new Map<string, number>();

export function isValidVisitorId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export function touchVisitor(id: string) {
  visitors.set(id, Date.now());
}

export function getOnlineCount() {
  const now = Date.now();
  let count = 0;
  for (const [id, lastSeen] of visitors) {
    if (now - lastSeen <= ONLINE_MS) {
      count += 1;
    } else {
      visitors.delete(id);
    }
  }
  return count;
}
