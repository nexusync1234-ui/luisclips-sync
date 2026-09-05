'use client';

import React from 'react';
import { X, ExternalLink, Eye, Heart, Film, Users, Play, Calendar, Flame } from 'lucide-react';
import { Clipper } from '@/lib/types';
import { formatNumber, getClipperAvgViews } from '@/lib/utils';

interface ClipperDetailModalProps {
  clipper: Clipper | null;
  onClose: () => void;
}

export default function ClipperDetailModal({
  clipper,
  onClose,
}: ClipperDetailModalProps) {
  if (!clipper) return null;

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

  const clips = clipper.clips || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="matte-panel rounded-2xl max-w-3xl w-full border border-zinc-800 shadow-2xl relative bg-[#0d0d10] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-[#111114]">
          <div className="flex items-center gap-4">
            <img
              src={clipper.avatar || '/placeholder-avatar.png'}
              alt={clipper.nickname}
              className="w-14 h-14 rounded-full object-cover border border-zinc-600 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${clipper.nickname}&background=18181b&color=fafafa`;
              }}
            />
            <div>
              <h2 className="text-xl font-black text-white">{clipper.nickname}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`https://www.tiktok.com/@${clipper.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  @{clipper.username}
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
                {clipper.bio && (
                  <span className="text-xs text-zinc-500 truncate max-w-xs hidden sm:inline">
                    • {clipper.bio}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0a0a0d] border-b border-zinc-800/70">
          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-zinc-400" /> Views no Mês
            </div>
            <div className="text-xl font-bold text-white">
              {formatNumber(clipper.monthlyViews)}
            </div>
          </div>

          <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <div className="text-xs text-white font-bold flex items-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5 text-white" /> Média / TikTok
            </div>
            <div className="text-xl font-black text-white">
              ~{formatNumber(getClipperAvgViews(clipper))}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
              <Heart className="w-3.5 h-3.5 text-zinc-400" /> Likes Totais
            </div>
            <div className="text-xl font-bold text-white">
              {formatNumber(clipper.totalLikes)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> Seguidores
            </div>
            <div className="text-xl font-bold text-white">
              {formatNumber(clipper.followers)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
              <Film className="w-3.5 h-3.5 text-zinc-400" /> Vídeos
            </div>
            <div className="text-xl font-bold text-white">
              {clipper.videoCount}
            </div>
          </div>
        </div>

        {/* Clips List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Clipes Rastreados ({clips.length})
            </h4>
            <span className="text-xs text-zinc-500">Ordenados por visualizações</span>
          </div>

          {clips.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Nenhum vídeo rastreado para esta conta ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[...clips]
                .sort((a, b) => b.viewCount - a.viewCount)
                .map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-xl bg-[#111114] border border-zinc-800 hover:border-zinc-700 transition-colors flex gap-3 group"
                  >
                    {/* Mini Cover */}
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                      {clip.coverUrl ? (
                        <img
                          src={clip.coverUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Play className="w-6 h-6 text-zinc-600" />
                      )}
                      <a
                        href={clip.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                      </a>
                    </div>

                    {/* Clip Meta */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-200 line-clamp-2">
                          {clip.title}
                        </p>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(clip.uploadDate)}
                          {clip.isCurrentMonth && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[9px] font-bold">
                              Deste Mês
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-white flex items-center gap-1">
                            <Eye className="w-3 h-3 text-zinc-400" />
                            {formatNumber(clip.viewCount)}
                          </span>
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-zinc-500" />
                            {formatNumber(clip.likeCount)}
                          </span>
                        </div>

                        <a
                          href={clip.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          Abrir
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
