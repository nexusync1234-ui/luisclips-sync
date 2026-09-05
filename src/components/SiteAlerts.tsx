'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';
import { MaintenanceState } from '@/lib/types';

export default function SiteAlerts() {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    endsAt: null,
  });
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/site-status?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!data.success) return;
        if (data.maintenance) {
          setMaintenance({
            enabled: Boolean(data.maintenance.enabled),
            endsAt: data.maintenance.endsAt || null,
          });
        }
        if (typeof data.announcement?.message === 'string') {
          setAnnouncement(data.announcement.message);
        }
      } catch {
        return;
      }
    };

    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/stream')) {
    return null;
  }

  return (
    <>
      {announcement ? (
        <div className="w-full bg-[#0d0d12] border-b border-zinc-800/80 text-zinc-200 transition-all">
          <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider shadow-sm flex-shrink-0">
              <Megaphone className="w-3 h-3" />
              Aviso
            </span>
            <p className="truncate text-zinc-200">{announcement}</p>
          </div>
        </div>
      ) : null}
      {maintenance.enabled ? <MaintenanceOverlay endsAt={maintenance.endsAt} /> : null}
    </>
  );
}
