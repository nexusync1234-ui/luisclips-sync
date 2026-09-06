'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Key, Loader2, Lock } from 'lucide-react';

export default function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Senha incorreta');
      }

      // Reload page so server verifies cookie and renders AdminDashboard
      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message || 'Falha na autenticação.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="matte-panel rounded-2xl max-w-sm w-full border border-zinc-800 p-6 shadow-2xl bg-[#0e0e11]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Acesso de Administrador</h3>
            <p className="text-xs text-zinc-400">Insira a sua senha para gerir contas</p>
          </div>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Senha de Admin
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                disabled={isLoggingIn}
                placeholder="Insira a sua senha"
                maxLength={256}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141418] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
            >
              Voltar
            </Link>

            <button
              type="submit"
              disabled={isLoggingIn || !password}
              className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>A verificar...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
