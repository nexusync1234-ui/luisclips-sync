'use client';

import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, Crown, Trophy, ExternalLink } from 'lucide-react';
import { Clipper } from '@/lib/types';

interface StreamModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clippers: Clipper[];
  currentMonthName: string;
}

export default function StreamModeModal({
  isOpen,
  onClose,
  clippers,
  currentMonthName,
}: StreamModeModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const sorted = [...clippers].sort((a, b) => b.monthlyViews - a.monthlyViews);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toLocaleString('pt-PT');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a] text-white flex flex-col p-6 sm:p-8 overflow-y-auto animate-in fade-in duration-200">
      {/* Stream Controls Topbar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0">
            <img src="/logo.jpg" alt="Luís Clips" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                MODO STREAM / OVERLAY OBS
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Batalha de Clippers — Mês de {currentMonthName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
            title="Ecrã Completo"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
            title="Sair do Modo Stream"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stream Main Banner */}
      <div className="text-center max-w-4xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
          <Trophy className="w-3.5 h-3.5 text-white" />
          Live de Premiação & Contratação
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Quem leva o prémio da live?
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 italic">
          &ldquo;A conta com mais views PAGO EM LIVE. E se for realmente boa CONTRATO EM LIVE!&rdquo;
        </p>
      </div>

      {/* Podium Stream View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full items-end mb-10">
        {/* 2nd Place */}
        {second && (
          <div className="order-2 md:order-1 matte-panel rounded-2xl p-6 border border-zinc-800 text-center flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              2º Lugar
            </span>
            <img
              src={second.avatar}
              alt={second.nickname}
              className="w-20 h-20 rounded-full border border-zinc-700 object-cover mb-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(second.nickname)}&background=18181b&color=fafafa`;
              }}
            />
            <h3 className="font-bold text-lg text-white truncate max-w-full">
              {second.nickname}
            </h3>
            <span className="text-xs text-zinc-500">@{second.username}</span>
            <div className="mt-4 text-2xl font-black text-white">
              {formatNumber(second.monthlyViews)} <span className="text-xs text-zinc-500 font-normal">views</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="order-1 md:order-2 matte-panel rounded-3xl p-8 border-2 border-white text-center flex flex-col items-center bg-[#131317] glow-matte-white md:-translate-y-4">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mb-3 shadow-md">
              <Crown className="w-6 h-6 fill-black" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-wider mb-1">
              Vencedor do Mês
            </span>
            <img
              src={first.avatar}
              alt={first.nickname}
              className="w-28 h-28 rounded-full border-2 border-white object-cover shadow-xl mb-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(first.nickname)}&background=ffffff&color=000000`;
              }}
            />
            <h3 className="font-black text-2xl text-white truncate max-w-full">
              {first.nickname}
            </h3>
            <span className="text-sm font-semibold text-zinc-400">@{first.username}</span>
            <div className="mt-4 text-4xl font-black text-white">
              {formatNumber(first.monthlyViews)} <span className="text-sm text-zinc-400 font-normal">views</span>
            </div>
            <a
              href={`https://www.tiktok.com/@${first.username}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-black transition-transform hover:scale-105 shadow-sm"
            >
              Abrir TikTok do Vencedor
              <ExternalLink className="w-3.5 h-3.5 text-black" />
            </a>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="order-3 matte-panel rounded-2xl p-6 border border-zinc-800 text-center flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              3º Lugar
            </span>
            <img
              src={third.avatar}
              alt={third.nickname}
              className="w-20 h-20 rounded-full border border-zinc-700 object-cover mb-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(third.nickname)}&background=18181b&color=fafafa`;
              }}
            />
            <h3 className="font-bold text-lg text-white truncate max-w-full">
              {third.nickname}
            </h3>
            <span className="text-xs text-zinc-500">@{third.username}</span>
            <div className="mt-4 text-2xl font-black text-white">
              {formatNumber(third.monthlyViews)} <span className="text-xs text-zinc-500 font-normal">views</span>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table in Stream View */}
      <div className="max-w-5xl mx-auto w-full matte-panel rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Classificação Geral
        </div>
        <div className="divide-y divide-zinc-800/60">
          {sorted.map((clipper, idx) => (
            <div
              key={clipper.id}
              className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${
                    idx === 0
                      ? 'bg-white text-black'
                      : idx === 1
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  #{idx + 1}
                </span>
                <img
                  src={clipper.avatar}
                  alt={clipper.nickname}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <div className="font-bold text-white text-base">{clipper.nickname}</div>
                  <div className="text-xs text-zinc-500">@{clipper.username}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {formatNumber(clipper.monthlyViews)} views
                </div>
                <div className="text-xs text-zinc-500">
                  {formatNumber(clipper.totalLikes)} likes • {clipper.videoCount} vídeos
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
