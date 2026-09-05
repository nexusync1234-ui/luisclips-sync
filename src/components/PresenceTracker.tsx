'use client';

import { useEffect } from 'react';

function getVisitorId() {
  const key = 'luisclips_visitor_id';
  const existing = sessionStorage.getItem(key);
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
    return existing;
  }

  const created = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  sessionStorage.setItem(key, created);
  return created;
}

export default function PresenceTracker() {
  useEffect(() => {
    let visitorId = '';
    try {
      visitorId = getVisitorId();
    } catch {
      return;
    }

    const ping = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
