import { Clipper } from './types';

export function formatNumber(num: number): string {
  if (!num && num !== 0) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toLocaleString('pt-PT');
}

export function getClipperAvgViews(c: Clipper, isMonth: boolean = true): number {
  if (!c) return 0;
  if (isMonth) {
    const septClips = c.clips ? c.clips.filter((cl) => cl.isCurrentMonth) : [];
    const count = septClips.length > 0 ? septClips.length : (c.monthlyViews > 0 ? 1 : 0);
    return count > 0 ? Math.round(c.monthlyViews / count) : 0;
  } else {
    const count =
      c.clips && c.clips.length > 0
        ? c.clips.length
        : c.videoCount > 0
        ? c.videoCount
        : c.allTimeViews > 0
        ? 1
        : 0;
    return count > 0 ? Math.round(c.allTimeViews / count) : 0;
  }
}
