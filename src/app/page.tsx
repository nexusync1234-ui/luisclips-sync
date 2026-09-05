'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroCountdown from '@/components/HeroCountdown';
import Podium from '@/components/Podium';
import LeaderboardTable from '@/components/LeaderboardTable';
import ClipsFeed from '@/components/ClipsFeed';
import AddClipperModal from '@/components/AddClipperModal';
import ClipperDetailModal from '@/components/ClipperDetailModal';
import StreamModeModal from '@/components/StreamModeModal';
import AdminLoginModal from '@/components/AdminLoginModal';
import { Clipper, Clip, DashboardStats } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [clippers, setClippers] = useState<Clipper[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isNeonConnected, setIsNeonConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingUsername, setSyncingUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClipper, setSelectedClipper] = useState<Clipper | null>(null);
  const [isStreamModeOpen, setIsStreamModeOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/admin/check');
      const data = await res.json();
      setIsAdmin(Boolean(data.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/clippers');
      const data = await res.json();
      if (data.success) {
        setClippers(data.clippers || []);
        setStats(data.stats || null);
        setIsNeonConnected(Boolean(data.isNeonConnected));

        // Aggregate clips
        const allClips = (data.clippers || []).flatMap((c: Clipper) => c.clips || []);
        setClips(allClips);
      }
    } catch (err) {
      console.error('Error fetching clippers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await loadData();
    } catch (err) {
      console.error('Error syncing all clippers:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncClipper = async (username: string) => {
    setSyncingUsername(username);
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      await loadData();
    } catch (err) {
      console.error(`Error syncing @${username}:`, err);
    } finally {
      setSyncingUsername(null);
    }
  };

  const handleDeleteClipper = async (username: string) => {
    if (!confirm(`Tem a certeza que deseja remover @${username} da plataforma?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clippers/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Erro ao remover clipper');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white space-y-4">
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
      <Navbar
        onAddClick={() => setIsAddModalOpen(true)}
        onSyncAll={handleSyncAll}
        onOpenStreamMode={() => setIsStreamModeOpen(true)}
        isSyncing={isSyncing}
        isNeonConnected={isNeonConnected}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogout={handleLogout}
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
            onSyncClipper={handleSyncClipper}
            onDeleteClipper={handleDeleteClipper}
            onSelectClipper={setSelectedClipper}
            syncingUsername={syncingUsername}
            isAdmin={isAdmin}
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
      <AddClipperModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={loadData}
      />

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

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          loadData();
        }}
      />
    </div>
  );
}
