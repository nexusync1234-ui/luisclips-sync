'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, Trophy, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { Clipper, DashboardStats } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

function StreamContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('view') as 'all' | 'podium' | 'table') || 'all';
  const isTransparent = searchParams.get('bg') === 'transparent' || searchParams.get('transparent') === '1';

  const [activeTab, setActiveTab] = useState<'all' | 'podium' | 'table'>(initialView);
  const [clippers, setClippers] = useState<Clipper[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoScroll] = useState(true);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/clippers?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setClippers(data.clippers || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching stream data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s live sync
    return () => clearInterval(interval);
  }, []);

  // Update tab if searchParam changes
  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'all' || v === 'podium' || v === 'table') {
      setActiveTab(v);
    }
  }, [searchParams]);

  const sorted = [...clippers].sort((a, b) => b.monthlyViews - a.monthlyViews);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  // Smooth auto-scroll for broadcast leaderboard
  useEffect(() => {
    if (!autoScroll || activeTab === 'podium') return;
    const el = tableContainerRef.current;
    if (!el) return;

    let isPaused = false;
    let animId: number;

    const scrollLoop = () => {
      if (!isPaused && el) {
        el.scrollTop += 0.5; // Smooth slow scroll
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
          isPaused = true;
          setTimeout(() => {
            if (el) {
              el.scrollTo({ top: 0, behavior: 'smooth' });
            }
            setTimeout(() => {
              isPaused = false;
            }, 2500);
          }, 3500);
        }
      }
      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoScroll, activeTab, sorted.length]);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden select-none p-3 sm:p-5 font-sans ${
        isTransparent ? 'bg-transparent' : 'bg-[#060608]'
      } text-white`}
    >
      {/* 1. BROADCAST TOP BAR (Sleek, TV-production style) */}
      <header className="flex-shrink-0 h-14 sm:h-16 px-4 bg-[#0c0c11]/95 border border-zinc-800/80 rounded-2xl flex items-center justify-between shadow-2xl mb-3 backdrop-blur-md">
        {/* Left: Brand + Live pulse + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0 shadow-md">
            <img src="/logo.jpg" alt="Luís Ferreira" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-red-400">
                BATALHA DE CLIPPERS • EM DIRETO
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate flex items-center gap-2">
              Ranking Oficial — Mês de {stats?.currentMonthName || 'Setembro'}
            </h1>
          </div>
        </div>

        {/* Center: Luís Ferreira Quote Ribbon */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 max-w-lg truncate">
          <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate italic font-medium">
            &ldquo;A conta com mais views PAGO EM LIVE! E se for boa CONTRATO EM LIVE!&rdquo;
          </span>
          <span className="text-zinc-500 text-[10px] flex-shrink-0 font-bold">— Luís Ferreira</span>
        </div>

        {/* Right: Layout Switcher & Auto-Sync Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 text-xs font-semibold shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                activeTab === 'all'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Geral (16:9)
            </button>
            <button
              onClick={() => setActiveTab('podium')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                activeTab === 'podium'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Só Pódio
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                activeTab === 'table'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Só Tabela
            </button>
          </div>

          {/* Auto-Sync Badge */}
          <div
            className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-xl text-zinc-300 text-xs cursor-pointer hover:border-zinc-700 transition-colors"
            onClick={fetchData}
            title="Atualização automática a cada 30 segundos. Clique para forçar sync."
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-white' : 'text-emerald-400'}`} />
            <span className="hidden md:inline text-[11px] font-semibold">Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* 2. BROADCAST STAGE (Split 16:9 Grid) */}
      <main className="flex-1 min-h-0 flex flex-col">
        {/* VIEW: ALL (Split Screen: Left Podium 58% + Right Leaderboard 42%) */}
        {activeTab === 'all' && (
          <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-4 min-h-0">
            {/* LEFT: PODIUM TOP 3 (7 cols) */}
            <section className="col-span-12 md:col-span-7 flex flex-col justify-center min-h-0 bg-[#0a0a0e]/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                    Pódio de Liderança
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500">Top 3 em Direto</span>
              </div>

              {/* 3 Columns for 2nd, 1st, 3rd */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end flex-1 max-h-[460px]">
                {/* 2nd Place */}
                {second && (
                  <div className="h-[85%] bg-gradient-to-b from-[#121217] to-[#0c0c10] rounded-2xl p-3 sm:p-4 border border-zinc-700/80 text-center flex flex-col items-center justify-between shadow-lg">
                    <div className="w-full flex flex-col items-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2">
                        #2 Segundo
                      </span>
                      <div className="relative mb-2">
                        <img
                          src={second.avatar}
                          alt={second.nickname}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-zinc-500 object-cover shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(second.nickname)}&background=27272a&color=f4f4f5`;
                          }}
                        />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-full">
                        {second.nickname}
                      </h3>
                      <p className="text-[10px] text-zinc-500 truncate max-w-full">@{second.username}</p>
                    </div>

                    <div className="w-full mt-2 pt-2 border-t border-zinc-800/80">
                      <div className="text-base sm:text-xl font-black text-white">
                        {formatNumber(second.monthlyViews)}{' '}
                        <span className="text-[10px] text-zinc-500 font-normal">views</span>
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-300 font-semibold flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-zinc-400" />
                        <span>~{formatNumber(getClipperAvgViews(second))} / tt</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place (The Winner / Centerpiece) */}
                {first && (
                  <div className="h-full bg-gradient-to-b from-[#1c1c24] via-[#15151d] to-[#0e0e13] rounded-2xl p-3 sm:p-5 border-2 border-white text-center flex flex-col items-center justify-between shadow-2xl relative">
                    <div className="w-full flex flex-col items-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-black flex items-center justify-center mb-1 shadow-lg">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2 shadow-sm">
                        Líder da Live
                      </span>
                      <div className="relative mb-2">
                        <img
                          src={first.avatar}
                          alt={first.nickname}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white object-cover shadow-2xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(first.nickname)}&background=ffffff&color=000000`;
                          }}
                        />
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-white truncate max-w-full">
                        {first.nickname}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium truncate max-w-full">@{first.username}</p>
                    </div>

                    <div className="w-full mt-2 pt-2 border-t border-zinc-700/80">
                      <div className="text-xl sm:text-3xl font-black text-white tracking-tight">
                        {formatNumber(first.monthlyViews)}{' '}
                        <span className="text-xs text-zinc-400 font-normal">views</span>
                      </div>
                      <div className="mt-1 text-[11px] font-bold text-zinc-200 flex items-center justify-center gap-1 bg-zinc-900/90 py-0.5 px-2 rounded-lg border border-zinc-700/70">
                        <Flame className="w-3.5 h-3.5 text-white" />
                        <span>~{formatNumber(getClipperAvgViews(first))} / TikTok</span>
                      </div>
                      <div className="mt-2 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-black bg-white px-2 py-0.5 rounded-full inline-block">
                        Candidato a Contratação
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {third && (
                  <div className="h-[78%] bg-gradient-to-b from-[#121217] to-[#0c0c10] rounded-2xl p-3 sm:p-4 border border-zinc-800 text-center flex flex-col items-center justify-between shadow-lg">
                    <div className="w-full flex flex-col items-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/70 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2">
                        #3 Terceiro
                      </span>
                      <div className="relative mb-2">
                        <img
                          src={third.avatar}
                          alt={third.nickname}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-zinc-600 object-cover shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(third.nickname)}&background=27272a&color=f4f4f5`;
                          }}
                        />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-full">
                        {third.nickname}
                      </h3>
                      <p className="text-[10px] text-zinc-500 truncate max-w-full">@{third.username}</p>
                    </div>

                    <div className="w-full mt-2 pt-2 border-t border-zinc-800/80">
                      <div className="text-base sm:text-xl font-black text-white">
                        {formatNumber(third.monthlyViews)}{' '}
                        <span className="text-[10px] text-zinc-500 font-normal">views</span>
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-300 font-semibold flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-zinc-400" />
                        <span>~{formatNumber(getClipperAvgViews(third))} / tt</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT: LEADERBOARD TABLE (5 cols with Auto-Scroll) */}
            <section className="col-span-12 md:col-span-5 flex flex-col bg-[#0c0c11]/90 border border-zinc-800/80 rounded-2xl overflow-hidden min-h-0 shadow-2xl backdrop-blur-md">
              <div className="p-3 sm:p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Ranking Geral
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-bold">
                    {sorted.length} clippers
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-Scroll</span>
                </div>
              </div>

              {/* Scrollable Container with Smooth Auto-Scroll */}
              <div
                ref={tableContainerRef}
                className="flex-1 overflow-y-auto divide-y divide-zinc-800/50 p-1.5 scrollbar-thin scrollbar-thumb-zinc-800"
              >
                {sorted.map((clipper, idx) => (
                  <div
                    key={clipper.id}
                    className={`p-2 sm:p-2.5 flex items-center justify-between rounded-xl transition-colors ${
                      idx === 0
                        ? 'bg-zinc-800/60 border border-white/20'
                        : idx === 1
                        ? 'bg-zinc-900/40'
                        : idx === 2
                        ? 'bg-zinc-900/20'
                        : 'hover:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
                          idx === 0
                            ? 'bg-white text-black shadow'
                            : idx === 1
                            ? 'bg-zinc-700 text-zinc-100'
                            : idx === 2
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={clipper.avatar}
                        alt={clipper.nickname}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clipper.nickname)}&background=18181b&color=fafafa`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {clipper.nickname}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">@{clipper.username}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs sm:text-sm font-black text-white">
                        {formatNumber(clipper.monthlyViews)}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-semibold flex items-center justify-end gap-1">
                        <Flame className="w-2.5 h-2.5 text-white" />
                        <span>~{formatNumber(getClipperAvgViews(clipper))}/tt</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: PODIUM ONLY (Huge, centered, celebration mode) */}
        {activeTab === 'podium' && (
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full p-4 sm:p-6">
            <div className="text-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                CERIMÓNIA DE PREMIAÇÃO • SETEMBRO
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
                Os 3 Maiores Clippers do Mês
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 items-end max-h-[520px]">
              {/* 2nd Place */}
              {second && (
                <div className="h-[85%] bg-gradient-to-b from-[#141419] to-[#0c0c10] rounded-3xl p-5 border border-zinc-700 text-center flex flex-col items-center justify-between shadow-2xl">
                  <div className="w-full flex flex-col items-center">
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-600 text-xs font-black uppercase tracking-widest mb-3">
                      #2 Segundo Lugar
                    </span>
                    <img
                      src={second.avatar}
                      alt={second.nickname}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-zinc-400 object-cover shadow-xl mb-3"
                    />
                    <h3 className="font-black text-base sm:text-lg text-white truncate max-w-full">
                      {second.nickname}
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold">@{second.username}</p>
                  </div>
                  <div className="w-full pt-4 border-t border-zinc-800">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {formatNumber(second.monthlyViews)}{' '}
                      <span className="text-xs text-zinc-500 font-normal">views</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-bold mt-1">~{formatNumber(getClipperAvgViews(second))} por vídeo</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {first && (
                <div className="h-full bg-gradient-to-b from-[#22222d] via-[#161620] to-[#0f0f16] rounded-3xl p-6 sm:p-8 border-2 border-white text-center flex flex-col items-center justify-between shadow-2xl relative">
                  <div className="w-full flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mb-2 shadow-xl">
                      <Crown className="w-6 h-6 fill-black" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest mb-3 shadow">
                      GRANDE VENCEDOR
                    </span>
                    <img
                      src={first.avatar}
                      alt={first.nickname}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-2xl mb-3"
                    />
                    <h3 className="font-black text-xl sm:text-2xl text-white truncate max-w-full">
                      {first.nickname}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-bold">@{first.username}</p>
                  </div>
                  <div className="w-full pt-4 border-t border-zinc-700">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {formatNumber(first.monthlyViews)}{' '}
                      <span className="text-sm text-zinc-400 font-normal">views</span>
                    </div>
                    <p className="text-sm text-white font-bold mt-1">~{formatNumber(getClipperAvgViews(first))} por vídeo</p>
                    <div className="mt-3 text-xs uppercase font-black tracking-wider text-black bg-white px-3 py-1 rounded-full inline-block shadow">
                      Contratado em Live
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {third && (
                <div className="h-[78%] bg-gradient-to-b from-[#141419] to-[#0c0c10] rounded-3xl p-5 border border-zinc-800 text-center flex flex-col items-center justify-between shadow-2xl">
                  <div className="w-full flex flex-col items-center">
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-black uppercase tracking-widest mb-3">
                      #3 Terceiro Lugar
                    </span>
                    <img
                      src={third.avatar}
                      alt={third.nickname}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-zinc-600 object-cover shadow-xl mb-3"
                    />
                    <h3 className="font-black text-base sm:text-lg text-white truncate max-w-full">
                      {third.nickname}
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold">@{third.username}</p>
                  </div>
                  <div className="w-full pt-4 border-t border-zinc-800">
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {formatNumber(third.monthlyViews)}{' '}
                      <span className="text-xs text-zinc-500 font-normal">views</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-bold mt-1">~{formatNumber(getClipperAvgViews(third))} por vídeo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: TABLE ONLY (Full expanded 2-column or 3-column leaderboard) */}
        {activeTab === 'table' && (
          <div className="flex-1 bg-[#0c0c11]/95 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col shadow-2xl min-h-0">
            <div className="p-3 sm:p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  CLASSIFICAÇÃO GERAL
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Todos os {sorted.length} Contas de Clippers
                </h3>
              </div>
              <div className="text-xs text-zinc-400 font-bold">
                Auto-Sync 30s • Atualizado em Direto
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {sorted.map((clipper, idx) => (
                <div
                  key={clipper.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    idx === 0
                      ? 'bg-white/10 border-white text-white'
                      : idx === 1
                      ? 'bg-zinc-800/60 border-zinc-600 text-zinc-100'
                      : idx === 2
                      ? 'bg-zinc-800/30 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-900/40 border-zinc-800/70 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
                        idx === 0
                          ? 'bg-white text-black'
                          : idx === 1
                          ? 'bg-zinc-600 text-white'
                          : idx === 2
                          ? 'bg-zinc-700 text-zinc-300'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <img
                      src={clipper.avatar}
                      alt={clipper.nickname}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white truncate">
                        {clipper.nickname}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">@{clipper.username}</div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-base font-black text-white">
                      {formatNumber(clipper.monthlyViews)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-semibold">
                      ~{formatNumber(getClipperAvgViews(clipper))}/tt
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StreamPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#070709] flex items-center justify-center text-white">A carregar overlay OBS...</div>}>
      <StreamContent />
    </Suspense>
  );
}

