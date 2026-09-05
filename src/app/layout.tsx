import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luisclips — Batalha & Ranking de Clippers do Luís Ferreira',
  description: 'Plataforma oficial de análise das contas de TikTok dos clippers do streamer Luís Ferreira. Ranking em tempo real para a premiação e contratação em live no fim do mês.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark">
      <body className="min-h-screen bg-[#0a0910] text-gray-100 selection:bg-brand-500 selection:text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
