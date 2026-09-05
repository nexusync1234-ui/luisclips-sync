'use client';

import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, Crown, Trophy, ExternalLink, Copy, Check, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { Clipper } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'podium' | 'table'>('all');

  // Manage body scroll & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Prevent background page from scrolling
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copyObsLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/stream`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const sorted = [...clippers].sort((a, b) => b.monthlyViews - a.monthlyViews);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  return (
    <div className="fixed inset-0 z-[100] bg-[#070709] text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. FIXED TOPBAR (Always visible, never scrolls away) */}
      <header className="flex-shrink-0 h-16 px-4 sm:px-6 bg-[#0c0c10] border-b border-zinc-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-700 bg-black flex-shrink-0">
            <img src="/logo.jpg" alt="Luís Clips" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                OVERLAY OBS • EM DIRETO
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
              Batalha de Clippers — Mês de {currentMonthName}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Layout Tab Selector */}
          <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Transmissão (16:9)
            </button>
            <button
              onClick={() => setActiveTab('podium')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'podium' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Só Pódio
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'table' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Só Tabela
            </button>
          </div>

          <button
            onClick={copyObsLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors"
            title="Copiar link para o OBS Browser Source"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copiado!' : 'Link OBS'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
            title={isFullscreen ? 'Sair do Ecrã Completo' : 'Ecrã Completo'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
            title="Fechar (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BROADCAST CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 sm:p-6 flex flex-col">
        {/* Banner Quote (Compact) */}
        <div className="mb-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-white">
                Live de Premiação & Contratação no Fim do Mês
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-400 italic">
                &ldquo;A conta com mais views PAGO EM LIVE. E se for realmente boa CONTRATO EM LIVE!&rdquo; — Luís Ferreira
              </p>
            </div>
          </div>
          <div className="text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/50 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-white" />
            Classificação em Direto
          </div>
        </div>

        {/* Dual Layout for 16:9 Streams */}
        <div className={`flex-1 grid gap-4 sm:gap-6 min-h-0 ${
          activeTab === 'podium' 
            ? 'grid-cols-1 max-w-4xl mx-auto w-full' 
            : activeTab === 'table' 
            ? 'grid-cols-1 max-w-4xl mx-auto w-full' 
            : 'grid-cols-1 lg:grid-cols-12'
        }`}>
          
          {/* LEFT: PODIUM TOP 3 (Takes 7 cols on desktop or full in podium tab) */}
          {(activeTab === 'all' || activeTab === 'podium') && (
            <div className={`${activeTab === 'all' ? 'lg:col-span-7' : 'w-full'} flex flex-col justify-center min-h-0`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
                {/* 2nd Place */}
                {second && (
                  <div className="order-2 sm:order-1 bg-[#101014] rounded-2xl p-4 border border-zinc-800/90 text-center flex flex-col items-center">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      #2 Segundo
                    </span>
                    <img
                      src={second.avatar}
                      alt={second.nickname}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-zinc-700 object-cover mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(second.nickname)}&background=18181b&color=fafafa`;
                      }}
                    />
                    <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-full">
                      {second.nickname}
                    </h3>
                    <span className="text-[11px] text-zinc-500 truncate max-w-full">@{second.username}</span>
                    <div className="mt-3 text-xl sm:text-2xl font-black text-white">
                      {formatNumber(second.monthlyViews)}{' '}
                      <span className="text-[10px] text-zinc-500 font-normal">views</span>
                    </div>
                    <div className="mt-1.5 text-xs text-zinc-300 font-semibold flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-white" />
                      <span>~{formatNumber(getClipperAvgViews(second))} / tt</span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Winner / Highlighted) */}
                {first && (
                  <div className="order-1 sm:order-2 bg-[#16161c] rounded-2xl p-5 border-2 border-white text-center flex flex-col items-center glow-matte-white relative">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center mb-1.5 shadow-md">
                      <Crown className="w-5 h-5 fill-black" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest mb-1">
                      Líder da Live
                    </span>
                    <img
                      src={first.avatar}
                      alt={first.nickname}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white object-cover shadow-xl mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(first.nickname)}&background=ffffff&color=000000`;
                      }}
                    />
                    <h3 className="font-black text-base sm:text-lg text-white truncate max-w-full">
                      {first.nickname}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400 truncate max-w-full">@{first.username}</span>
                    <div className="mt-3 text-2xl sm:text-3xl font-black text-white">
                      {formatNumber(first.monthlyViews)}{' '}
                      <span className="text-xs text-zinc-400 font-normal">views</span>
                    </div>
                    <div className="mt-1.5 text-xs text-white font-black flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded-lg">
                      <Flame className="w-3.5 h-3.5 text-white" />
                      <span>~{formatNumber(getClipperAvgViews(first))} / TikTok</span>
                    </div>
                    <a
                      href={`https://www.tiktok.com/@${first.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-black text-[11px] font-black transition-transform hover:scale-105"
                    >
                      Abrir TikTok
                      <ExternalLink className="w-3 h-3 text-black" />
                    </a>
                  </div>
                )}

                {/* 3rd Place */}
                {third && (
                  <div className="order-3 bg-[#101014] rounded-2xl p-4 border border-zinc-800/90 text-center flex flex-col items-center">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      #3 Terceiro
                    </span>
                    <img
                      src={third.avatar}
                      alt={third.nickname}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-zinc-700 object-cover mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(third.nickname)}&background=18181b&color=fafafa`;
                      }}
                    />
                    <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-full">
                      {third.nickname}
                    </h3>
                    <span className="text-[11px] text-zinc-500 truncate max-w-full">@{third.username}</span>
                    <div className="mt-3 text-xl sm:text-2xl font-black text-white">
                      {formatNumber(third.monthlyViews)}{' '}
                      <span className="text-[10px] text-zinc-500 font-normal">views</span>
                    </div>
                    <div className="mt-1.5 text-xs text-zinc-300 font-semibold flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-white" />
                      <span>~{formatNumber(getClipperAvgViews(third))} / tt</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: LEADERBOARD LIST WITH INDEPENDENT SMOOTH SCROLL (5 cols on desktop or full in table tab) */}
          {(activeTab === 'all' || activeTab === 'table') && (
            <div className={`${activeTab === 'all' ? 'lg:col-span-5' : 'w-full'} flex flex-col bg-[#0f0f13] border border-zinc-800 rounded-2xl overflow-hidden min-h-0`}>
              <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 flex-shrink-0">
                <span>Classificação Geral</span>
                <span className="text-[10px] font-semibold text-zinc-500">{sorted.length} Clippers</span>
              </div>

              {/* Scrollable list container with custom sleek scrollbar */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1">
                {sorted.map((clipper, idx) => (
                  <div
                    key={clipper.id}
                    className="p-3 flex items-center justify-between hover:bg-zinc-900/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
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
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clipper.nickname)}&background=18181b&color=fafafa`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {clipper.nickname}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">@{clipper.username}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-sm sm:text-base font-black text-white">
                        {formatNumber(clipper.monthlyViews)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-semibold flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3 text-white" />
                        <span>~{formatNumber(getClipperAvgViews(clipper))}/tt</span>
                        <span className="text-zinc-600">•</span>
                        <span>{formatNumber(clipper.totalLikes)} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

