'use client';

import React, { useState } from 'react';
import { Play, Eye, Heart, MessageCircle, ExternalLink, Sparkles, Film } from 'lucide-react';
import { Clip } from '@/lib/types';

interface ClipsFeedProps {
  clips: Clip[];
}

export default function ClipsFeed({ clips }: ClipsFeedProps) {
  const [monthOnly, setMonthOnly] = useState(true);

  const filteredClips = monthOnly
    ? clips.filter((c) => c.isCurrentMonth)
    : clips;

  const sortedClips = [...filteredClips].sort((a, b) => b.viewCount - a.viewCount);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toLocaleString('pt-PT');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.length === 8) {
      // YYYYMMDD
      const y = dateStr.slice(0, 4);
      const m = dateStr.slice(4, 6);
      const d = dateStr.slice(6, 8);
      return `${d}/${m}/${y}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-white" />
              Mural dos Clipes Mais Virais
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Assista e reaja aos cortes com maior repercussão no TikTok
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="bg-[#141418] p-1 rounded-xl border border-zinc-800 flex items-center self-start sm:self-auto">
            <button
              onClick={() => setMonthOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                monthOnly
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clipes Deste Mês ({clips.filter((c) => c.isCurrentMonth).length})
            </button>
            <button
              onClick={() => setMonthOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !monthOnly
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({clips.length})
            </button>
          </div>
        </div>

        {/* Clips Grid */}
        {sortedClips.length === 0 ? (
          <div className="matte-panel rounded-2xl p-10 text-center text-zinc-500 text-sm">
            Nenhum clipe encontrado para o período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedClips.slice(0, 16).map((clip, idx) => {
              const isTopClip = idx === 0;

              return (
                <div
                  key={clip.id}
                  className={`matte-panel rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 group flex flex-col ${
                    isTopClip
                      ? 'border-zinc-500 shadow-md shadow-white/5'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Thumbnail / Video Cover Container */}
                  <div className="relative aspect-[9/16] max-h-80 w-full overflow-hidden bg-black flex items-center justify-center">
                    {clip.coverUrl ? (
                      <img
                        src={clip.coverUrl}
                        alt={clip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                        <Play className="w-10 h-10 opacity-40" />
                      </div>
                    )}

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Top Clip Badge */}
                    {isTopClip && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3" />
                        Maior Clipe do Mês
                      </div>
                    )}

                    {/* View Count Badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      {formatNumber(clip.viewCount)}
                    </div>

                    {/* Play Button Overlay */}
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-black" />
                      </div>
                    </a>

                    {/* Clipper Info at bottom of cover */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {clip.clipperAvatar && (
                          <img
                            src={clip.clipperAvatar}
                            alt={clip.clipperNickname || ''}
                            className="w-6 h-6 rounded-full border border-zinc-600 object-cover"
                          />
                        )}
                        <span className="text-xs font-bold text-white drop-shadow truncate max-w-[130px]">
                          {clip.clipperNickname || `@${clip.clipperUsername}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 drop-shadow">
                        {formatDate(clip.uploadDate)}
                      </span>
                    </div>
                  </div>

                  {/* Clip Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#111113]">
                    <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                      {clip.title}
                    </p>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-zinc-400" />
                          {formatNumber(clip.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                          {clip.commentCount}
                        </span>
                      </div>

                      <a
                        href={clip.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:underline font-semibold flex items-center gap-1"
                      >
                        Assistir
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
