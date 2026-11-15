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
}

export function extractUsername(input: string): string {
  let cleaned = input.trim();
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  // Se for URL completa do Instagram (ex: https://www.instagram.com/username/)
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i);
  if (urlMatch && urlMatch[1]) {
    // Ignorar caminhos de rotas comuns que não são perfis
    if (!['p', 'reel', 'stories', 'explore'].includes(urlMatch[1].toLowerCase())) {
      return urlMatch[1];
    }
  }

  // Remove @ inicial ou espaços
  return cleaned.replace(/^@/, '');
}

