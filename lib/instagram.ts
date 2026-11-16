export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  type: 'image' | 'video';
}

export interface PostItem {
  id: string;
  shortcode: string;
  type: 'image' | 'video' | 'carousel';
  caption?: string;
  thumbnailUrl: string;
  mediaList: MediaItem[];
  timestamp?: number;
}

export interface ProfileData {
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  posts: PostItem[];
  postsPaginationToken?: string;
  reelsPaginationToken?: string;
}

export function extractUsername(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i);
  if (urlMatch && urlMatch[1]) {
    if (!['p', 'reel', 'stories', 'explore'].includes(urlMatch[1].toLowerCase())) {
      return urlMatch[1];
    }
  }

  return cleaned.replace(/^@/, '');
}
