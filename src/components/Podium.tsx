'use client';

import React from 'react';
import { Crown, ExternalLink, Eye, Heart, Users, Flame } from 'lucide-react';
import { Clipper } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

interface PodiumProps {
  clippers: Clipper[];
  onSelectClipper?: (clipper: Clipper) => void;
}

export default function Podium({ clippers, onSelectClipper }: PodiumProps) {
  if (!clippers || clippers.length === 0) return null;

  const first = clippers[0];
  const second = clippers.length > 1 ? clippers[1] : null;
  const third = clippers.length > 2 ? clippers[2] : null;

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-white" />
              Pódio dos Top 3 do Mês
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Posições em tempo real para a premiação e contratação em live
            </p>
          </div>
        </div>

        {/* Podium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-4xl mx-auto pt-4">
          {/* 2nd Place */}
          {second ? (
            <div className="order-2 md:order-1 matte-panel rounded-2xl p-5 border border-zinc-800 relative flex flex-col items-center text-center transition-all hover:border-zinc-700">
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-black flex items-center justify-center border border-zinc-700 text-xs">
                #2
              </div>

              {/* Avatar */}
              <div className="relative mt-2 mb-3">
                <img
                  src={second.avatar || '/placeholder-avatar.png'}
                  alt={second.nickname}
                  className="w-20 h-20 rounded-full object-cover border border-zinc-700 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${second.nickname}&background=18181b&color=fafafa`;
                  }}
                />
              </div>

              <h3 className="font-bold text-base text-white truncate max-w-full">
                {second.nickname}
              </h3>
              <a
                href={`https://www.tiktok.com/@${second.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mt-0.5"
              >
                @{second.username}
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>

              {/* Stats */}
              <div className="mt-4 w-full bg-zinc-900/90 rounded-xl p-3 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-400" /> Views no Mês:
                  </span>
                  <span className="font-bold text-white">{formatNumber(second.monthlyViews)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-zinc-400" /> Likes:
                  </span>
                  <span className="font-semibold text-zinc-300">{formatNumber(second.totalLikes)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> Seguidores:
                  </span>
                  <span className="font-semibold text-zinc-300">{formatNumber(second.followers)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800/80">
                  <span className="text-zinc-300 flex items-center gap-1 font-medium">
                    <Flame className="w-3.5 h-3.5 text-white" /> Média / TikTok:
                  </span>
                  <span className="font-bold text-white">~{formatNumber(getClipperAvgViews(second))}</span>
                </div>
              </div>

              <div className="mt-4 w-full py-1.5 rounded-lg bg-zinc-800/70 text-zinc-300 text-xs font-semibold">
                2º Lugar na Corrida
              </div>
            </div>
          ) : (
            <div className="order-2 md:order-1 matte-card rounded-2xl p-6 text-center text-zinc-500 text-sm">
              A aguardar clippers
            </div>
          )}

          {/* 1st Place (Center / White Crown) - Highlighted */}
          {first && (
            <div className="order-1 md:order-2 matte-panel rounded-2xl p-6 border-2 border-white/80 relative flex flex-col items-center text-center glow-matte-white md:-translate-y-3 bg-[#131316]">
              {/* Crown Icon Above Avatar */}
              <div className="absolute -top-5 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-white text-black shadow-md flex items-center justify-center border border-zinc-300">
                  <Crown className="w-5 h-5 fill-black" />
                </div>
              </div>

              {/* Tag Destaque */}
              <div className="mt-2 mb-2 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider">
                Líder do Mês • Vencedor da Live
              </div>

              {/* Avatar */}
              <div className="relative my-2">
                <img
                  src={first.avatar || '/placeholder-avatar.png'}
                  alt={first.nickname}
                  className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${first.nickname}&background=ffffff&color=000000`;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-white text-black rounded-full font-black text-xs border border-zinc-300">
                  #1
                </span>
              </div>

              <h3 className="font-black text-lg text-white truncate max-w-full">
                {first.nickname}
              </h3>
              <a
                href={`https://www.tiktok.com/@${first.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-semibold mt-0.5"
              >
                @{first.username}
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>

              {/* Stats Highlight */}
              <div className="mt-4 w-full bg-zinc-900 rounded-xl p-3.5 border border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1 font-medium">
                    <Eye className="w-4 h-4 text-white" /> Views no Mês:
                  </span>
                  <span className="font-black text-lg text-white">
                    {formatNumber(first.monthlyViews)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-zinc-400" /> Likes:
                  </span>
                  <span className="font-bold text-zinc-200">{formatNumber(first.totalLikes)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> Seguidores:
                  </span>
                  <span className="font-bold text-zinc-200">{formatNumber(first.followers)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-white flex items-center gap-1.5 font-bold">
                    <Flame className="w-4 h-4 text-white" /> Média / TikTok:
                  </span>
                  <span className="font-black text-base text-white">
                    ~{formatNumber(getClipperAvgViews(first))}
                  </span>
                </div>
              </div>

              <div className="mt-4 w-full py-2 rounded-lg bg-white text-black text-xs font-black shadow-sm">
                Candidato a Contratação
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third ? (
            <div className="order-3 matte-panel rounded-2xl p-5 border border-zinc-800 relative flex flex-col items-center text-center transition-all hover:border-zinc-700">
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-black flex items-center justify-center border border-zinc-700 text-xs">
                #3
              </div>

              {/* Avatar */}
              <div className="relative mt-2 mb-3">
                <img
                  src={third.avatar || '/placeholder-avatar.png'}
                  alt={third.nickname}
                  className="w-20 h-20 rounded-full object-cover border border-zinc-700 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${third.nickname}&background=18181b&color=fafafa`;
                  }}
                />
              </div>

              <h3 className="font-bold text-base text-white truncate max-w-full">
                {third.nickname}
              </h3>
              <a
                href={`https://www.tiktok.com/@${third.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mt-0.5"
              >
                @{third.username}
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>

              {/* Stats */}
              <div className="mt-4 w-full bg-zinc-900/90 rounded-xl p-3 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-400" /> Views no Mês:
                  </span>
                  <span className="font-bold text-white">{formatNumber(third.monthlyViews)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-zinc-400" /> Likes:
                  </span>
                  <span className="font-semibold text-zinc-300">{formatNumber(third.totalLikes)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> Seguidores:
                  </span>
                  <span className="font-semibold text-zinc-300">{formatNumber(third.followers)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800/80">
                  <span className="text-zinc-300 flex items-center gap-1 font-medium">
                    <Flame className="w-3.5 h-3.5 text-white" /> Média / TikTok:
                  </span>
                  <span className="font-bold text-white">~{formatNumber(getClipperAvgViews(third))}</span>
                </div>
              </div>

              <div className="mt-4 w-full py-1.5 rounded-lg bg-zinc-800/70 text-zinc-300 text-xs font-semibold">
                3º Lugar na Corrida
              </div>
            </div>
          ) : (
            <div className="order-3 matte-card rounded-2xl p-6 text-center text-zinc-500 text-sm">
              A aguardar clippers
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
