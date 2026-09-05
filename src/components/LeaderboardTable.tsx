'use client';

import React, { useState } from 'react';
import {
  Trophy,
  ExternalLink,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Film,
  Heart,
  Users,
  Flame,
} from 'lucide-react';
import { Clipper } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

interface LeaderboardTableProps {
  clippers: Clipper[];
  onSyncClipper: (username: string) => void;
  onDeleteClipper: (username: string) => void;
  onSelectClipper: (clipper: Clipper) => void;
  syncingUsername: string | null;
  isAdmin?: boolean;
}

export default function LeaderboardTable({
  clippers,
  onSyncClipper,
  onDeleteClipper,
  onSelectClipper,
  syncingUsername,
  isAdmin = false,
}: LeaderboardTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'avgViews' | 'allTime'>('month');

  // Sort based on viewMode
  const sorted = [...clippers].sort((a, b) => {
    if (viewMode === 'avgViews') {
      const avgA = getClipperAvgViews(a, true);
      const avgB = getClipperAvgViews(b, true);
      return avgB - avgA;
    }
    if (viewMode === 'allTime') return b.allTimeViews - a.allTimeViews;
    return b.monthlyViews - a.monthlyViews;
  });

  // Filter by search
  const filtered = sorted.filter(
    (c) =>
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxViews = Math.max(
    ...clippers.map((c) => (viewMode === 'allTime' ? c.allTimeViews : c.monthlyViews)),
    1
  );

  return (
    <div className="matte-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header with Search and Period Toggle */}
      <div className="p-5 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d0d10]">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-white" />
            Classificação Geral dos Clippers
          </h3>
          <p className="text-xs text-zinc-400">
            Acompanhe o desempenho e a média de visualizações de cada conta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View / Sort Mode Toggle */}
          <div className="bg-[#141418] p-1 rounded-xl border border-zinc-800 flex items-center flex-wrap gap-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mês Atual (Live)
            </button>
            <button
              onClick={() => setViewMode('avgViews')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'avgViews'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Maior Média / TikTok
            </button>
            <button
              onClick={() => setViewMode('allTime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'allTime'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Histórico Geral
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar clipper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141418] border border-zinc-800 rounded-xl pl-8 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#09090b] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80">
            <tr>
              <th scope="col" className="px-4 sm:px-5 py-3 text-center font-bold">#</th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold">Clipper</th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold">
                {viewMode === 'allTime' ? 'Views Totais' : 'Views no Mês'}
              </th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold">
                <span className="flex items-center gap-1 text-white">
                  <Flame className="w-3.5 h-3.5 text-white" />
                  Média / TikTok
                </span>
              </th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold hidden sm:table-cell">Likes</th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold hidden md:table-cell">Seguidores</th>
              <th scope="col" className="px-4 sm:px-5 py-3 font-bold hidden lg:table-cell">Clips</th>
              <th scope="col" className="px-4 sm:px-5 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-zinc-500 text-sm">
                  Nenhum clipper encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              filtered.map((clipper, index) => {
                const currentViews = viewMode === 'allTime' ? clipper.allTimeViews : clipper.monthlyViews;
                const avgViews = getClipperAvgViews(clipper, viewMode !== 'allTime');
                const viewPercentage = Math.min(100, Math.round((currentViews / maxViews) * 100));
                const isWinner = index === 0;
                const isSyncingThis = syncingUsername === clipper.username;

                return (
                  <tr
                    key={clipper.id}
                    className={`hover:bg-zinc-900/40 transition-colors ${
                      isWinner ? 'bg-zinc-900/20' : ''
                    }`}
                  >
                    {/* Rank Number */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          index === 0
                            ? 'bg-white text-black shadow-sm'
                            : index === 1
                            ? 'bg-zinc-800 text-zinc-200'
                            : index === 2
                            ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                            : 'bg-zinc-900/60 text-zinc-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* Clipper Profile Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={clipper.avatar || '/placeholder-avatar.png'}
                          alt={clipper.nickname}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${clipper.nickname}&background=1f1f23&color=fff`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectClipper(clipper)}
                              className="font-bold text-white hover:text-zinc-300 transition-colors truncate max-w-[140px] sm:max-w-none text-left"
                            >
                              {clipper.nickname}
                            </button>
                            {isWinner && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-black">
                                TOP 1
                              </span>
                            )}
                          </div>
                          <a
                            href={`https://www.tiktok.com/@${clipper.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-0.5"
                          >
                            @{clipper.username}
                            <ExternalLink className="w-3 h-3 text-zinc-600" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Views with Progress Bar */}
                    <td className="px-4 sm:px-5 py-4">
                      <div className="space-y-1.5 min-w-[110px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-base">
                            {formatNumber(currentViews)}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-normal">views</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${viewPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Média / TikTok (Prominently next to views and likes) */}
                    <td className="px-4 sm:px-5 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors ${
                          viewMode === 'avgViews'
                            ? 'bg-white text-black border-white font-black shadow-sm'
                            : 'bg-zinc-900/90 border-zinc-800 text-zinc-200 font-bold hover:border-zinc-700'
                        }`}
                      >
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            viewMode === 'avgViews' ? 'text-black' : 'text-white'
                          }`}
                        />
                        <span className="text-xs sm:text-sm">~{formatNumber(avgViews)}</span>
                        <span
                          className={`text-[10px] font-normal ${
                            viewMode === 'avgViews' ? 'text-zinc-700' : 'text-zinc-400'
                          }`}
                        >
                          /tt
                        </span>
                      </div>
                    </td>

                    {/* Total Likes */}
                    <td className="px-4 sm:px-5 py-4 hidden sm:table-cell font-medium text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatNumber(clipper.totalLikes)}</span>
                      </div>
                    </td>

                    {/* Followers */}
                    <td className="px-4 sm:px-5 py-4 hidden md:table-cell font-medium text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatNumber(clipper.followers)}</span>
                      </div>
                    </td>

                    {/* Video Count */}
                    <td className="px-4 sm:px-5 py-4 hidden lg:table-cell font-medium text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{clipper.videoCount}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectClipper(clipper)}
                          title="Ver vídeos deste clipper"
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onSyncClipper(clipper.username)}
                              disabled={isSyncingThis}
                              title="Sincronizar métricas"
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-white' : ''}`} />
                            </button>
                            <button
                              onClick={() => onDeleteClipper(clipper.username)}
                              title="Remover clipper"
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-900/50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
