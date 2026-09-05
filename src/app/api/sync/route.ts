import { NextRequest, NextResponse } from 'next/server';
import { getStoredClippers, saveClipperData } from '@/lib/db';
import { fetchClipperData } from '@/lib/scraper';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUsername = body.username ? body.username.replace(/^@/, '').trim() : null;

    const { clippers } = await getStoredClippers();
    const clippersToSync = targetUsername
      ? clippers.filter((c) => c.username.toLowerCase() === targetUsername.toLowerCase())
      : clippers;

    if (clippersToSync.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum clipper encontrado para sincronizar.' },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];

    for (const clipper of clippersToSync) {
      try {
        const scraped = await fetchClipperData(clipper.username);
        if (scraped && scraped.profile) {
          const updated = await saveClipperData(
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
            scraped.videos.map((v) => ({ ...v, clipperId: clipper.id }))
          );
          results.push(updated);
        }
      } catch (err: any) {
        errors.push({ username: clipper.username, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      clippers: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
