export interface Clip {
  id: string;
  clipperId: string;
  clipperUsername?: string;
  clipperNickname?: string;
  clipperAvatar?: string;
  title: string;
  url: string;
  coverUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  duration: number;
  uploadDate: string;
  isCurrentMonth: boolean;
  createdAt?: string;
}

export interface Clipper {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  bio?: string;
  secUid?: string;
  followers: number;
  totalLikes: number;
  videoCount: number;
  monthlyViews: number;
  allTimeViews: number;
  lastSyncedAt: string;
  createdAt: string;
  clips?: Clip[];
}

export interface MaintenanceState {
  enabled: boolean;
  endsAt: string | null;
}

export interface SiteAnnouncement {
  message: string;
  updatedAt: string | null;
}

export interface DashboardStats {
  totalMonthlyViews: number;
  totalAllTimeViews: number;
  totalLikes: number;
  totalClipsCount: number;
  totalClippersCount: number;
  topClipper?: Clipper;
  topClip?: Clip;
  daysRemainingInMonth: number;
  currentMonthName: string;
}
