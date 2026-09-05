import { NextRequest, NextResponse } from 'next/server';
import { getStoredClippers, saveClipperData, isNeonConfigured } from '@/lib/db';
import { fetchClipperData } from '@/lib/scraper';
import { consumeMutationAttempt, verifyAdminMutation } from '@/lib/auth';
import { DashboardStats } from '@/lib/types';
import { getMaintenanceState } from '@/lib/maintenance';
import { getAnnouncement } from '@/lib/announcement';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { clippers, clips } = await getStoredClippers();
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'monthlyViews';

    const sortedClippers = [...clippers].sort((a, b) => {
      if (sortBy === 'allTimeViews') return b.allTimeViews - a.allTimeViews;
      if (sortBy === 'followers') return b.followers - a.followers;
      if (sortBy === 'totalLikes') return b.totalLikes - a.totalLikes;
      if (sortBy === 'videoCount') return b.videoCount - a.videoCount;
      return b.monthlyViews - a.monthlyViews;
    });

    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, lastDayOfMonth - now.getDate());
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Find top clip
    const topClip = clips.length > 0
      ? [...clips].sort((a, b) => b.viewCount - a.viewCount)[0]
      : undefined;

    const stats: DashboardStats = {
      totalMonthlyViews: clippers.reduce((acc, c) => acc + c.monthlyViews, 0),
      totalAllTimeViews: clippers.reduce((acc, c) => acc + c.allTimeViews, 0),
      totalLikes: clippers.reduce((acc, c) => acc + c.totalLikes, 0),
      totalClipsCount: clips.length,
      totalClippersCount: clippers.length,
      topClipper: sortedClippers[0],
      topClip,
      daysRemainingInMonth: daysRemaining,
      currentMonthName: monthNames[now.getMonth()],
    };

    return NextResponse.json({
      success: true,
      clippers: sortedClippers,
      stats,
      isNeonConnected: isNeonConfigured(),
      maintenance: await getMaintenanceState(),
      announcement: await getAnnouncement(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!consumeMutationAttempt(req)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados pedidos. Tente novamente dentro de um minuto.' },
        { status: 429 }
      );
    }

    if (!verifyAdminMutation(req)) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Apenas o administrador pode adicionar contas.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    let username = body.username;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username é obrigatório' }, { status: 400 });
    }

    // Clean username (supports @user, https://tiktok.com/@user?lang=pt, etc.)
    if (username.includes('@')) {
      const match = username.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) username = match[1];
    }
    username = username.replace(/[^a-zA-Z0-9_.-]/g, '').trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Nome de utilizador inválido' }, { status: 400 });
    }

    // Check if already exists (case-insensitive)
    const { clippers } = await getStoredClippers();
    const existing = clippers.find((c) => c.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A conta @${username} já está registada!` },
        { status: 400 }
      );
    }

    // Scrape data
    const scraped = await fetchClipperData(username);
    if (!scraped || !scraped.profile) {
      return NextResponse.json(
        { success: false, error: `Não foi possível encontrar a conta @${username} no TikTok.` },
        { status: 404 }
      );
    }

    const saved = await saveClipperData(
      {
        username: scraped.profile.username,
        nickname: scraped.profile.nickname,
        avatar: scraped.profile.avatar,
        bio: scraped.profile.bio,
        secUid: scraped.profile.secUid,
        followers: scraped.profile.followers,
        totalLikes: scraped.profile.totalLikes,
        videoCount: scraped.profile.videoCount,
        monthlyViews: scraped.monthlyViews,
        allTimeViews: scraped.allTimeViews,
        lastSyncedAt: scraped.syncedAt,
      },
      scraped.videos.map((v) => ({
        ...v,
        clipperId: '',
      }))
    );

    return NextResponse.json({ success: true, clipper: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
