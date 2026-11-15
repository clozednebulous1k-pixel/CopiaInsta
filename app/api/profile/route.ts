import { NextRequest, NextResponse } from 'next/server';
import { extractUsername, ProfileData, PostItem } from '@/lib/instagram';
import { adminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

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

    // Chamada ao endpoint que traz o perfil E as postagens/reels (ig_get_fb_profile_hover)
    const res = await fetch(
      `https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_hover.php?username_or_url=${encodeURIComponent(
        username
      )}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Perfil não encontrado ou conta privada.' }, { status: 404 });
      }
      return NextResponse.json({ error: `Erro na API do Instagram (${res.status}).` }, { status: res.status });
    }

    const data = await res.json();
    const userData = data.user_data || data.data || data;

    if (!userData || (!userData.username && !userData.full_name && !userData.pk)) {
      return NextResponse.json({ error: 'Perfil não encontrado ou conta privada.' }, { status: 404 });
    }

    const profilePic =
      userData.hd_profile_pic_url_info?.url ||
      userData.profile_pic_url ||
      '';

    const posts: PostItem[] = [];

    // Processar todas as publicações e reels retornados em user_posts
    const rawPosts = data.user_posts || userData.user_posts || [];

    rawPosts.forEach((entry: any, idx: number) => {
      const media = entry.node?.media_dict || entry.node || entry;
      const typeName = entry.node?.__typename || '';
      
      const isVideo =
        typeName.toLowerCase().includes('video') ||
        typeName.toLowerCase().includes('clip') ||
        Boolean(media.is_video) ||
        Boolean(media.video_versions);

      const isCarousel =
        typeName.toLowerCase().includes('carousel') ||
        Boolean(media.carousel_media);

      const postType: 'video' | 'image' | 'carousel' = isCarousel ? 'carousel' : isVideo ? 'video' : 'image';

      const thumb =
        media.image_versions2?.candidates?.[0]?.url ||
        media.display_url ||
        profilePic;

      const mediaList: { id: string; url: string; thumbnailUrl: string; type: 'image' | 'video' }[] = [];

      if (isCarousel && media.carousel_media) {
        media.carousel_media.forEach((c: any, cIdx: number) => {
          const cIsVideo = Boolean(c.video_versions) || Boolean(c.is_video);
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
          id: media.id || `post_${idx}`,
          url: itemUrl,
          thumbnailUrl: thumb,
          type: isVideo ? 'video' : 'image',
        });
      }

      posts.push({
        id: media.id || `post_${idx}`,
        shortcode: media.code || `${idx}`,
        type: postType,
        caption: media.caption?.text || entry.node?.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        thumbnailUrl: thumb,
        mediaList: mediaList.length > 0 ? mediaList : [{ id: `m_${idx}`, url: thumb, thumbnailUrl: thumb, type: isVideo ? 'video' : 'image' }],
      });
    });

    const profile: ProfileData = {
      username: userData.username || username,
      fullName: userData.full_name || '',
      biography: userData.biography || '',
      profilePicUrl: profilePic,
      followersCount: userData.follower_count || 0,
      followingCount: userData.following_count || 0,
      postsCount: userData.media_count || 0,
      isPrivate: Boolean(userData.is_private),
      posts,
    };

    if (adminDb) {
      adminDb.collection('searches').add({
        username: profile.username,
        searchedAt: new Date().toISOString(),
        postsFound: profile.posts.length,
      }).catch(() => {});
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno ao consultar o perfil.' }, { status: 500 });
  }
}
