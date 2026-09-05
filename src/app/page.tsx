'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroCountdown from '@/components/HeroCountdown';
import Podium from '@/components/Podium';
import LeaderboardTable from '@/components/LeaderboardTable';
import ClipsFeed from '@/components/ClipsFeed';
import ClipperDetailModal from '@/components/ClipperDetailModal';
import StreamModeModal from '@/components/StreamModeModal';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';
import PresenceTracker from '@/components/PresenceTracker';
import { Clipper, Clip, DashboardStats, MaintenanceState } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [clippers, setClippers] = useState<Clipper[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isNeonConnected, setIsNeonConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedClipper, setSelectedClipper] = useState<Clipper | null>(null);
  const [isStreamModeOpen, setIsStreamModeOpen] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    endsAt: null,
  });
  const [announcement, setAnnouncement] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch(`/api/clippers?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setClippers(data.clippers || []);
        setStats(data.stats || null);
        setIsNeonConnected(Boolean(data.isNeonConnected));

        const allClips = (data.clippers || []).flatMap((c: Clipper) => c.clips || []);
        setClips(allClips);

        if (data.maintenance) {
          setMaintenance({
            enabled: Boolean(data.maintenance.enabled),
            endsAt: data.maintenance.endsAt || null,
          });
        }
        if (data.announcement) {
          setAnnouncement(data.announcement.message || '');
        }
      }
    } catch (err) {
      console.error('Error fetching clippers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaintenance = async () => {
    try {
      const res = await fetch(`/api/maintenance?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenance({
          enabled: Boolean(data.maintenance.enabled),
          endsAt: data.maintenance.endsAt || null,
        });
      }
    } catch {
      return;
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await fetch(`/api/announcement?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAnnouncement(data.announcement?.message || '');
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    loadData();
    loadMaintenance();
    loadAnnouncement();

    // Fast status check every 5s for announcements and maintenance
    const statusInterval = setInterval(() => {
      loadMaintenance();
      loadAnnouncement();
    }, 5000);

    // Auto-refresh views & leaderboard data automatically every 30s
    const dataInterval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {});
      await loadData();
    } catch (err) {
      console.error('Error refreshing clippers:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-4">
        <PresenceTracker />
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
          <Loader2 className="w-6 h-6 animate-spin text-black" />
        </div>
        <p className="text-xs font-bold text-zinc-400">A carregar estatísticas do Luisclips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* Top Navigation */}
      <PresenceTracker />
      <Navbar
        onSyncAll={handleSyncAll}
        onOpenStreamMode={() => setIsStreamModeOpen(true)}
        isSyncing={isSyncing}
        isNeonConnected={isNeonConnected}
        announcement={announcement}
      />

      <main className="flex-1 pb-16">
        {/* Hero & Countdown Banner */}
        {stats && <HeroCountdown stats={stats} />}

        {/* Podium for Top 3 */}
        <Podium clippers={clippers} onSelectClipper={setSelectedClipper} />

        {/* Main Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <LeaderboardTable
            clippers={clippers}
            onSelectClipper={setSelectedClipper}
          />
        </div>

        {/* Clips Feed */}
        <ClipsFeed clips={clips} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 bg-[#09090b] text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-zinc-400">
            Luisclips — Plataforma de Análise & Competição de Clippers do Streamer Luís Ferreira
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Dados recolhidos publicamente via TikTok • Desenvolvido para a Live Mensal de Premiação
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ClipperDetailModal
        clipper={selectedClipper}
        onClose={() => setSelectedClipper(null)}
      />

      <StreamModeModal
        isOpen={isStreamModeOpen}
        onClose={() => setIsStreamModeOpen(false)}
        clippers={clippers}
        currentMonthName={stats?.currentMonthName || 'Mês'}
      />

      {maintenance.enabled && <MaintenanceOverlay endsAt={maintenance.endsAt} />}

    </div>
  );
}
