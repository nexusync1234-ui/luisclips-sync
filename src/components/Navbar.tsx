'use client';

import React from 'react';
import Link from 'next/link';
import { Megaphone, RefreshCw, Tv } from 'lucide-react';

interface NavbarProps {
  onSyncAll: () => void;
  onOpenStreamMode: () => void;
  isSyncing: boolean;
  isNeonConnected: boolean;
  announcement?: string;
}

export default function Navbar({
  onSyncAll,
  onOpenStreamMode,
  isSyncing,
  isNeonConnected,
  announcement,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  Live Hub
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Streamer Luís Ferreira • Batalha Mensal
              </p>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* DB Status Badge */}
          <div
            title={isNeonConnected ? 'Conectado ao Neon PostgreSQL (Nuvem)' : 'Armazenamento Local Persistente'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300"
          >
            <span className={`w-2 h-2 rounded-full ${isNeonConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isNeonConnected ? 'Neon DB' : 'Local DB'}</span>
          </div>

          {/* Streamer OBS Mode */}
          <button
            onClick={onOpenStreamMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <Tv className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Modo Stream</span> (OBS)
          </button>

          {/* Sync All Button with Auto-Sync Status */}
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            title="Auto-Sync ativo (atualização automática em direto). Clique para sincronizar agora."
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all disabled:opacity-50 group"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white ${isSyncing ? 'animate-spin text-white' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Auto-Sync ativo" />
          </button>
        </div>
      </div>
      {announcement ? (
        <div className="border-t border-zinc-800/80 bg-zinc-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-zinc-200">
            <Megaphone className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <p className="font-semibold truncate">{announcement}</p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
