import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { connection } from 'next/server';
import './globals.css';
import SiteAlerts from '@/components/SiteAlerts';
import { getMaintenanceState } from '@/lib/maintenance';
import { getAnnouncement } from '@/lib/announcement';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Luisclips — Batalha & Ranking de Clippers do Luís Ferreira',
  description: 'Plataforma oficial de análise das contas de TikTok dos clippers do streamer Luís Ferreira. Ranking em tempo real para a premiação e contratação em live no fim do mês.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  let maintenance = { enabled: false, endsAt: null as string | null };
  let announcement = '';

  try {
    maintenance = await getMaintenanceState();
    const notice = await getAnnouncement();
    announcement = notice.message || '';
  } catch {
    maintenance = { enabled: false, endsAt: null };
    announcement = '';
  }

  return (
    <html lang="pt-PT" className="dark">
      <body className="min-h-screen bg-[#0a0910] text-gray-100 selection:bg-brand-500 selection:text-white antialiased">
        <SiteAlerts maintenance={maintenance} announcement={announcement} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
