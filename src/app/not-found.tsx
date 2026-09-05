import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6 font-black text-2xl tracking-tighter">
        LF
      </div>
      <h1 className="text-6xl font-black text-white mb-2 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-gray-300 mb-4">Página Não Encontrada</h2>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        A página que estás à procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-all text-sm tracking-wide shadow-lg shadow-white/5"
      >
        Voltar à Leaderboard
      </Link>
    </div>
  );
}
