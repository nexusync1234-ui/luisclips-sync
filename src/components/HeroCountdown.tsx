'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Eye, Heart, Film, Sparkles, Flame } from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface HeroCountdownProps {
  stats: DashboardStats;
}

export default function HeroCountdown({ stats }: HeroCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calculateTime() {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = lastDay.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toLocaleString('pt-PT');
  };

  return (
    <section className="relative pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Luis Ferreira Official Announcement Banner */}
        <div className="mb-8 rounded-2xl matte-panel border border-zinc-800 p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Desafio Oficial do Mês de {stats.currentMonthName}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Batalha de Clippers — Luís Ferreira
              </h1>

              {/* Exact Quote from Streamer */}
              <div className="relative pl-4 border-l-2 border-white py-2 bg-zinc-900/40 rounded-r-lg">
                <p className="text-sm sm:text-base font-medium text-zinc-200 italic leading-relaxed">
                  &ldquo;Na última live de cada mês irei analisar <span className="text-white font-bold underline underline-offset-4 decoration-zinc-500">EM LIVE</span> as vossas contas de clipes. A que tiver mais views <span className="text-white font-bold">PAGO EM LIVE</span>. E se a conta for realmente boa, eu <span className="text-white font-bold">CONTRATO ESSA PESSOA EM LIVE</span>!&rdquo;
                </p>
                <span className="block mt-1.5 text-xs text-zinc-400 font-semibold">
                  — Luís Ferreira, na stream
                </span>
              </div>
            </div>

            {/* Live Countdown Clock */}
            <div className="bg-[#0c0c0f] border border-zinc-800/90 rounded-xl p-5 flex flex-col items-center justify-center min-w-[270px] shadow-sm">
              <div className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Live de Análise em:</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center w-full">
                <div className="bg-zinc-900/80 rounded-lg py-2.5 px-1 border border-zinc-800">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-medium mt-0.5">Dias</div>
                </div>
                <div className="bg-zinc-900/80 rounded-lg py-2.5 px-1 border border-zinc-800">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-medium mt-0.5">Horas</div>
                </div>
                <div className="bg-zinc-900/80 rounded-lg py-2.5 px-1 border border-zinc-800">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-medium mt-0.5">Min</div>
                </div>
                <div className="bg-zinc-900/80 rounded-lg py-2.5 px-1 border border-zinc-800">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-medium mt-0.5">Seg</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global KPI Metrics Cards - Matte Black & White */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Views no Mês */}
          <div className="matte-card rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
              <span>Views da Comunidade (Mês)</span>
              <div className="p-1.5 rounded-md bg-zinc-800/80 text-zinc-300">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNumber(stats.totalMonthlyViews)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Corrida de {stats.currentMonthName}
            </p>
          </div>

          {/* Card 2: Líder Atual */}
          <div className="matte-card rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
              <span>Líder Atual (#1)</span>
              <div className="p-1.5 rounded-md bg-zinc-800/80 text-white">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white truncate">
              {stats.topClipper ? `@${stats.topClipper.username}` : 'Nenhum'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium">
              {stats.topClipper ? `${formatNumber(stats.topClipper.monthlyViews)} views` : 'A aguardar dados'}
            </p>
          </div>

          {/* Card 3: Clipes Monitorizados */}
          <div className="matte-card rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
              <span>Clipes Rastreados</span>
              <div className="p-1.5 rounded-md bg-zinc-800/80 text-zinc-300">
                <Film className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.totalClipsCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Em {stats.totalClippersCount} contas ativas
            </p>
          </div>

          {/* Card 4: Curtidas Acumuladas */}
          <div className="matte-card rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
              <span>Likes Totais</span>
              <div className="p-1.5 rounded-md bg-zinc-800/80 text-zinc-300">
                <Heart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatNumber(stats.totalLikes)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Total acumulado no TikTok
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
