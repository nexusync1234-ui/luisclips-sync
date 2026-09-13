'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, Megaphone, Plus, RefreshCw, Users, Wrench } from 'lucide-react';
import LeaderboardTable from '@/components/LeaderboardTable';
import AddClipperModal from '@/components/AddClipperModal';
import ClipperDetailModal from '@/components/ClipperDetailModal';
import { Clipper, MaintenanceState, SiteAnnouncement } from '@/lib/types';

export default function AdminDashboard() {
  const [clippers, setClippers] = useState<Clipper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingUsername, setSyncingUsername] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClipper, setSelectedClipper] = useState<Clipper | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    enabled: false,
    endsAt: null,
  });
  const [maintenanceHours, setMaintenanceHours] = useState(0);
  const [maintenanceMinutes, setMaintenanceMinutes] = useState(30);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState<SiteAnnouncement>({
    message: '',
    updatedAt: null,
  });
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clippers');
      const data = await res.json();
      if (data.success) {
        setClippers(data.clippers || []);
      }
    } catch (err) {
      console.error('Error fetching clippers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.announcement) {
        setAnnouncement({
          message: data.announcement.message || '',
          updatedAt: data.announcement.updatedAt || null,
        });
        setAnnouncementDraft(data.announcement.message || '');
      }
    } catch {
      setAnnouncement({ message: '', updatedAt: null });
    }
  };

  const loadOnlineCount = async () => {
    try {
      const res = await fetch('/api/presence', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.success) {
        setOnlineCount(Number(data.online) || 0);
      }
    } catch {
      setOnlineCount(0);
    }
  };

  const loadMaintenance = async () => {
    try {
      const res = await fetch('/api/maintenance', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenance({
          enabled: Boolean(data.maintenance.enabled),
          endsAt: data.maintenance.endsAt || null,
        });
      }
    } catch {
      setMaintenance({ enabled: false, endsAt: null });
    }
  };

  useEffect(() => {
    loadData();
    loadAnnouncement();
    loadOnlineCount();
    loadMaintenance();

    const interval = setInterval(() => {
      loadData();
      loadOnlineCount();
      loadMaintenance();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleAuthFailure = (status: number) => {
    if (status === 401 || status === 403) {
      window.location.reload();
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.reload();
    } catch (err) {
      console.error('Error logging out:', err);
      window.location.reload();
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res.status)) return;
      const result = await res.json();
      if (!res.ok || !result.success) alert(result.error || 'Falha ao sincronizar views.');
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
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res.status)) return;
      const result = await res.json();
      if (!res.ok || !result.success) alert(result.error || 'Falha ao sincronizar views.');
      await loadData();
    } catch (err) {
      console.error(`Error syncing @${username}:`, err);
    } finally {
      setSyncingUsername(null);
    }
  };

  const handleSaveAnnouncement = async (message: string) => {
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res.status)) return;
      const data = await res.json();
      if (data.success && data.announcement) {
        setAnnouncement({
          message: data.announcement.message || '',
          updatedAt: data.announcement.updatedAt || null,
        });
        setAnnouncementDraft(data.announcement.message || '');
      } else {
        alert(data.error || 'Erro ao atualizar a mensagem');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleSaveMaintenance = async (enabled: boolean) => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          hours: maintenanceHours,
          minutes: maintenanceMinutes,
        }),
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res.status)) return;
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenance({
          enabled: Boolean(data.maintenance.enabled),
          endsAt: data.maintenance.endsAt || null,
        });
      } else {
        alert(data.error || 'Erro ao atualizar a manutenção');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleDeleteClipper = async (username: string) => {
    if (!confirm(`Tem a certeza que deseja remover @${username}?`)) return;

    try {
      const res = await fetch(`/api/clippers/${username}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (handleAuthFailure(res.status)) return;
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

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0 group-hover:border-zinc-400 transition-colors shadow-sm">
              <img
                src="/logo.jpg"
                alt="Luís Clips"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                  LUÍS CLIPS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-black">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Gestão de contas e ranking
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white hover:bg-zinc-200 text-black shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Adicionar</span>
            </button>
            <button
              onClick={handleLogout}
              title="Terminar sessão de Admin"
              className="p-2 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <div className="matte-panel rounded-2xl border border-zinc-800 p-5 bg-[#0d0d10]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Manutenção da página principal</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ativa um popup no site com cronómetro enquanto os developers trabalham.
                  </p>
                  <p className="text-[11px] font-semibold mt-2">
                    <span className={maintenance.enabled ? 'text-amber-300' : 'text-zinc-500'}>
                      {maintenance.enabled ? 'Manutenção ativa' : 'Site no ar'}
                    </span>
                    {maintenance.enabled && maintenance.endsAt ? (
                      <span className="text-zinc-500">
                        {' '}
                        · termina às {new Date(maintenance.endsAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Horas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={336}
                    value={maintenanceHours}
                    onChange={(e) => setMaintenanceHours(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 bg-[#141418] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={maintenanceMinutes}
                    onChange={(e) => setMaintenanceMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-20 bg-[#141418] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                {maintenance.enabled ? (
                  <button
                    onClick={() => handleSaveMaintenance(false)}
                    disabled={isSavingMaintenance}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
                  >
                    {isSavingMaintenance ? 'A atualizar...' : 'Desativar'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveMaintenance(true)}
                    disabled={isSavingMaintenance || (maintenanceHours === 0 && maintenanceMinutes === 0)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {isSavingMaintenance ? 'A ativar...' : 'Ativar manutenção'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="matte-panel rounded-2xl border border-zinc-800 p-5 bg-[#0d0d10]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Pessoas no site</h3>
                  <p className="text-xs text-zinc-400 mt-1">Visitantes ativos na página principal agora.</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white leading-none">{onlineCount}</span>
                <span className="text-xs font-semibold text-zinc-500 mb-1">online</span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Atualiza automaticamente
              </p>
            </div>

            <div className="lg:col-span-2 matte-panel rounded-2xl border border-zinc-800 p-5 bg-[#0d0d10]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Mensagem no menu principal</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    A mensagem aparece no topo do site para todos os visitantes.
                  </p>
                </div>
              </div>
              <textarea
                value={announcementDraft}
                maxLength={180}
                rows={3}
                onChange={(e) => setAnnouncementDraft(e.target.value)}
                placeholder="Escreve a mensagem para o site..."
                className="w-full bg-[#141418] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-zinc-500">
                  {announcement.message ? `No ar: ${announcement.message}` : 'Nenhuma mensagem no menu.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveAnnouncement('')}
                    disabled={isSavingAnnouncement || !announcement.message}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50"
                  >
                    Remover
                  </button>
                  <button
                    onClick={() => handleSaveAnnouncement(announcementDraft)}
                    disabled={isSavingAnnouncement || !announcementDraft.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {isSavingAnnouncement ? 'A enviar...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoading && clippers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white space-y-4">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <p className="text-xs font-bold text-zinc-400">A carregar contas...</p>
            </div>
          ) : (
            <LeaderboardTable
              clippers={clippers}
              onSyncClipper={handleSyncClipper}
              onDeleteClipper={handleDeleteClipper}
              onSelectClipper={setSelectedClipper}
              syncingUsername={syncingUsername}
              isAdmin
            />
          )}
        </div>
      </main>

      <AddClipperModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={loadData}
      />

      <ClipperDetailModal
        clipper={selectedClipper}
        onClose={() => setSelectedClipper(null)}
      />
    </div>
  );
}
