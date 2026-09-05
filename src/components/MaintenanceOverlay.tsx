'use client';

import React, { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';

interface MaintenanceOverlayProps {
  endsAt: string | null;
}

function getRemaining(endsAt: string | null) {
  if (!endsAt) {
    return { hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const diff = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export default function MaintenanceOverlay({ endsAt }: MaintenanceOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    function tick() {
      setTimeLeft(getRemaining(endsAt));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="matte-panel rounded-2xl max-w-md w-full border border-zinc-800 p-6 sm:p-8 shadow-2xl bg-[#0e0e11] text-center">
        <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Aviso do site
        </p>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          Site em manutenção
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          Os developers estão a trabalhar para o site voltar o mais rápido possível. Obrigado pela paciência.
        </p>

        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Tempo restante
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/80 rounded-lg py-3 border border-zinc-800">
              <div className="text-2xl font-black text-white">{pad(timeLeft.hours)}</div>
              <div className="text-[10px] font-bold uppercase text-zinc-500 mt-1">Horas</div>
            </div>
            <div className="bg-zinc-900/80 rounded-lg py-3 border border-zinc-800">
              <div className="text-2xl font-black text-white">{pad(timeLeft.minutes)}</div>
              <div className="text-[10px] font-bold uppercase text-zinc-500 mt-1">Min</div>
            </div>
            <div className="bg-zinc-900/80 rounded-lg py-3 border border-zinc-800">
              <div className="text-2xl font-black text-white">{pad(timeLeft.seconds)}</div>
              <div className="text-[10px] font-bold uppercase text-zinc-500 mt-1">Seg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
