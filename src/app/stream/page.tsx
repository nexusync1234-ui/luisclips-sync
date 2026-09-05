'use client';

import React, { useEffect, useState } from 'react';
import { Crown, Trophy, ExternalLink, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { Clipper, DashboardStats } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

export default function StreamPage() {
  const [clippers, setClippers] = useState<Clipper[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/clippers');
      const data = await res.json();
      if (data.success) {
        setClippers(data.clippers || []);
        setStats(data.stats || null);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Error fetching stream data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 45 seconds for OBS live stream
    const interval = setInterval(fetchData, 45000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...clippers].sort((a, b) => b.monthlyViews - a.monthlyViews);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  return (
    <div className="h-screen w-screen bg-[#070709] text-white flex flex-col overflow-hidden select-none p-4 sm:p-6">
      {/* OBS Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0">
            <img src="/logo.jpg" alt="Luís Clips" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                OVERLAY OBS • BATALHA DE CLIPPERS
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              Ranking Oficial — Mês de {stats?.currentMonthName || 'Mês'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-white' : 'text-zinc-500'}`} />
            <span className="text-[11px]">Auto-Sync (45s)</span>
          </div>
        </div>
      </div>

      {/* Quote Ribbon */}
      <div className="flex-shrink-0 mb-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-2.5 px-4 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-white" />
          <span className="font-semibold text-zinc-300">
            &ldquo;A conta com mais views PAGO EM LIVE. E se for realmente boa CONTRATO EM LIVE!&rdquo;
          </span>
          <span className="text-zinc-500 text-[11px]">— Luís Ferreira</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded">
          <Sparkles className="w-3 h-3 text-white" /> Top Clipes PT
        </div>
      </div>

      {/* 16:9 Split Grid (Podium Left + Table Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* PODIUM (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center min-h-0">
          <div className="grid grid-cols-3 gap-3 items-end">
            {/* 2nd Place */}
            {second && (
              <div className="order-1 bg-[#101014] rounded-2xl p-4 border border-zinc-800 text-center flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  #2 Segundo
                </span>
                <img
                  src={second.avatar}
                  alt={second.nickname}
                  className="w-16 h-16 rounded-full border border-zinc-700 object-cover mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(second.nickname)}&background=18181b&color=fafafa`;
                  }}
                />
                <h3 className="font-bold text-sm text-white truncate max-w-full">
                  {second.nickname}
                </h3>
                <span className="text-[11px] text-zinc-500 truncate max-w-full">@{second.username}</span>
                <div className="mt-2 text-xl font-black text-white">
                  {formatNumber(second.monthlyViews)}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal">views</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-300 font-semibold flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-white" />
                  <span>~{formatNumber(getClipperAvgViews(second))} / tt</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {first && (
              <div className="order-2 bg-[#15151b] rounded-2xl p-5 border-2 border-white text-center flex flex-col items-center glow-matte-white sm:-translate-y-2 relative">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center mb-1 shadow-md">
                  <Crown className="w-5 h-5 fill-black" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                  Vencedor da Live
                </span>
                <img
                  src={first.avatar}
                  alt={first.nickname}
                  className="w-20 h-20 rounded-full border-2 border-white object-cover shadow-xl mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(first.nickname)}&background=ffffff&color=000000`;
                  }}
                />
                <h3 className="font-black text-base text-white truncate max-w-full">
                  {first.nickname}
                </h3>
                <span className="text-xs text-zinc-400 truncate max-w-full">@{first.username}</span>
                <div className="mt-2 text-2xl font-black text-white">
                  {formatNumber(first.monthlyViews)}{' '}
                  <span className="text-xs text-zinc-400 font-normal">views</span>
                </div>
                <div className="mt-1 text-xs text-white font-black flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-700/80 px-2 py-0.5 rounded-lg">
                  <Flame className="w-3.5 h-3.5 text-white" />
                  <span>~{formatNumber(getClipperAvgViews(first))} / TikTok</span>
                </div>
                <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-black bg-white px-2 py-0.5 rounded-full">
                  Candidato a Contratação
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="order-3 bg-[#101014] rounded-2xl p-4 border border-zinc-800 text-center flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                  #3 Terceiro
                </span>
                <img
                  src={third.avatar}
                  alt={third.nickname}
                  className="w-16 h-16 rounded-full border border-zinc-700 object-cover mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(third.nickname)}&background=18181b&color=fafafa`;
                  }}
                />
                <h3 className="font-bold text-sm text-white truncate max-w-full">
                  {third.nickname}
                </h3>
                <span className="text-[11px] text-zinc-500 truncate max-w-full">@{third.username}</span>
                <div className="mt-2 text-xl font-black text-white">
                  {formatNumber(third.monthlyViews)}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal">views</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-300 font-semibold flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-white" />
                  <span>~{formatNumber(getClipperAvgViews(third))} / tt</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABLE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#0e0e12] border border-zinc-800 rounded-2xl overflow-hidden min-h-0">
          <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 flex-shrink-0">
            <span>Ranking Completo</span>
            <span className="text-[10px] text-zinc-500 font-normal">{sorted.length} contas</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1">
            {sorted.map((clipper, idx) => (
              <div
                key={clipper.id}
                className="p-2.5 flex items-center justify-between hover:bg-zinc-900/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center flex-shrink-0 ${
                      idx === 0
                        ? 'bg-white text-black'
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
                  <div className="text-sm font-black text-white">
                    {formatNumber(clipper.monthlyViews)}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-semibold flex items-center justify-end gap-1">
                    <Flame className="w-2.5 h-2.5 text-white" />
                    <span>~{formatNumber(getClipperAvgViews(clipper))}/tt</span>
                    <span className="text-zinc-600">•</span>
                    <span>{formatNumber(clipper.totalLikes)} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
