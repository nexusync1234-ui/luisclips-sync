'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';
import { MaintenanceState } from '@/lib/types';

interface SiteAlertsProps {
  maintenance: MaintenanceState;
  announcement: string;
}

export default function SiteAlerts({
  maintenance: initialMaintenance,
  announcement: initialAnnouncement,
}: SiteAlertsProps) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);

  useEffect(() => {
    setMaintenance(initialMaintenance);
    setAnnouncement(initialAnnouncement);
  }, [initialMaintenance, initialAnnouncement]);

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
        if (data.announcement) {
          setAnnouncement(data.announcement.message || '');
        }
      } catch {
        return;
      }
    };

    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {announcement ? (
        <div className="sticky top-0 z-[90] bg-white text-black">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-bold">
            <Megaphone className="w-4 h-4 flex-shrink-0" />
            <p className="truncate">{announcement}</p>
          </div>
        </div>
      ) : null}
      {maintenance.enabled ? <MaintenanceOverlay endsAt={maintenance.endsAt} /> : null}
    </>
  );
}
