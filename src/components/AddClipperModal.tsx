'use client';

import React, { useState } from 'react';
import { X, Plus, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AddClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddClipperModal({
  isOpen,
  onClose,
  onAdded,
}: AddClipperModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/clippers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
        credentials: 'same-origin',
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro ao adicionar clipper');
      }

      setUsername('');
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao analisar a conta do TikTok.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="matte-panel rounded-2xl max-w-md w-full border border-zinc-800 p-6 shadow-2xl relative bg-[#0e0e11]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Adicionar Clipper</h3>
            <p className="text-xs text-zinc-400">Insira o @ ou link do perfil do TikTok</p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
          <span>
            Zero login necessário! O sistema recolhe seguidores, likes e os vídeos do mês de forma 100% pública.
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nome de Utilizador ou Link
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                @
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="ex: clipsdoferreirinha ou link"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#141418] border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>A analisar...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-black" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
