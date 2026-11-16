import { NextRequest, NextResponse } from 'next/server';
import { extractUsername, ProfileData, PostItem } from '@/lib/instagram';
import { adminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function parsePostItem(media: any, defaultThumb: string, idx: number, forceVideo = false): PostItem | null {
  if (!media) return null;
  const isVideo = forceVideo || Boolean(media.video_versions) || Boolean(media.is_video) || media.media_type === 2 || media.product_type === 'clips';
  const isCarousel = Boolean(media.carousel_media && media.carousel_media.length > 0);
  const type: 'video' | 'image' | 'carousel' = isCarousel ? 'carousel' : isVideo ? 'video' : 'image';

  const thumb =
    media.image_versions2?.candidates?.[0]?.url ||
    media.display_url ||
    defaultThumb;

  const mediaList: { id: string; url: string; thumbnailUrl: string; type: 'image' | 'video' }[] = [];

  if (isCarousel && media.carousel_media) {
    media.carousel_media.forEach((c: any, cIdx: number) => {
      const cIsVideo = Boolean(c.video_versions) || Boolean(c.is_video) || c.media_type === 2;
      const cUrl = c.video_versions?.[0]?.url || c.image_versions2?.candidates?.[0]?.url;
      const cThumb = c.image_versions2?.candidates?.[0]?.url || thumb;
      if (cUrl) {
        mediaList.push({
          id: c.id || `${media.id}_${cIdx}`,
          url: cUrl,
          thumbnailUrl: cThumb,
          type: cIsVideo ? 'video' : 'image',
        });
      }
    });
  } else {
    const itemUrl = media.video_versions?.[0]?.url || media.video_url || thumb;
    mediaList.push({
      id: media.id || `m_${idx}`,
      url: itemUrl,
      thumbnailUrl: thumb,
      type: isVideo ? 'video' : 'image',
    });
  }

  return {
    id: media.id || media.pk || `post_${idx}`,
    shortcode: media.code || `${idx}`,
    type,
    caption: media.caption?.text || '',
    thumbnailUrl: thumb,
    mediaList: mediaList.length > 0 ? mediaList : [{ id: `m_${idx}`, url: thumb, thumbnailUrl: thumb, type: isVideo ? 'video' : 'image' }],
    timestamp: media.taken_at ? media.taken_at * 1000 : undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const postToken = searchParams.get('postToken') || '';
  const reelToken = searchParams.get('reelToken') || '';
  const mode = searchParams.get('mode') || 'all'; // 'all' (initial load), 'more_posts', 'more_reels'

  if (!query) {
    return NextResponse.json({ error: 'Informe um nome de usuário ou URL do Instagram.' }, { status: 400 });
  }

  const username = extractUsername(query);

  if (!username) {
    return NextResponse.json({ error: 'Nome de usuário inválido.' }, { status: 400 });
  }

  try {
    const apiKey = process.env.INSTAGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada na Vercel.' }, { status: 500 });
    }

    const headers = {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
    };

    // 1. Obter informações do perfil (apenas na carga inicial)
    let profileInfo: any = {};
    if (mode === 'all') {
      const formProfile = new FormData();
      formProfile.append('username_or_url', username);
      formProfile.append('data', 'basic');

      try {
        const resProfile = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile.php', {
          method: 'POST',
          headers,
          body: formProfile,
        });
        if (resProfile.ok) {
          profileInfo = await resProfile.json();
        }
      } catch (err) {
        console.warn('Erro ao obter perfil base:', err);
      }
    }

    const profilePic =
      profileInfo.hd_profile_pic_url_info?.url ||
      profileInfo.profile_pic_url ||
      profileInfo.profile_pic_url_hd ||
      '';

    // 2. Buscar Posts (Feed / Carrosséis / Imagens)
    const fetchPosts = async () => {
      const form = new FormData();
      form.append('username_or_url', username);
      form.append('amount', '24');
      if (postToken) form.append('pagination_token', postToken);

      const res = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_posts.php', {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) return { posts: [], pagination_token: '' };
      return res.json();
    };

    // 3. Buscar Reels (Vídeos curtos em alta resolução)
    const fetchReels = async () => {
      const form = new FormData();
      form.append('username_or_url', username);
      form.append('amount', '24');
      if (reelToken) form.append('pagination_token', reelToken);

      const res = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_reels.php', {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) return { reels: [], pagination_token: '' };
      return res.json();
    };

    // Executa as chamadas em paralelo para máxima velocidade
    const [postsData, reelsData] = await Promise.all([
      mode === 'more_reels' ? Promise.resolve({ posts: [], pagination_token: '' }) : fetchPosts(),
      mode === 'more_posts' ? Promise.resolve({ reels: [], pagination_token: '' }) : fetchReels(),
    ]);

    const collectedPosts: PostItem[] = [];
    const seenIds = new Set<string>();

    // Parser dos posts do feed
    (postsData.posts || []).forEach((item: any, idx: number) => {
      const media = item.node?.media_dict || item.node || item;
      const parsed = parsePostItem(media, profilePic, idx);
      if (parsed && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        collectedPosts.push(parsed);
      }
    });

    // Parser dos Reels
    (reelsData.reels || []).forEach((item: any, idx: number) => {
      const media = item.node?.media || item.node || item;
      const parsed = parsePostItem(media, profilePic, idx + 100, true);
      if (parsed && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        collectedPosts.push(parsed);
      }
    });

    // Ordenar por data mais recente
    collectedPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const profile: ProfileData = {
      username: profileInfo.username || username,
      fullName: profileInfo.full_name || '',
      biography: profileInfo.biography || '',
      profilePicUrl: profilePic,
      followersCount: profileInfo.follower_count || 0,
      followingCount: profileInfo.following_count || 0,
      postsCount: profileInfo.media_count || collectedPosts.length,
      isPrivate: Boolean(profileInfo.is_private),
      posts: collectedPosts,
      postsPaginationToken: postsData.pagination_token || '',
      reelsPaginationToken: reelsData.pagination_token || '',
    };

    if (adminDb && mode === 'all') {
      adminDb.collection('searches').add({
        username: profile.username,
        searchedAt: new Date().toISOString(),
        postsFound: profile.posts.length,
      }).catch(() => {});
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar mídias.' }, { status: 500 });
  }
}
