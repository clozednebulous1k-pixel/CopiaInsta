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

    // Formulário exato exigido pela Instagram Scraper Stable API
    const formData = new FormData();
    formData.append('username_or_url', username);
    formData.append('data', 'basic');

    const res = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile.php', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
      },
      body: formData,
      next: { revalidate: 180 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Perfil não encontrado ou conta privada.' }, { status: 404 });
      }
      return NextResponse.json({ error: `Erro na API do Instagram (${res.status}).` }, { status: res.status });
    }

    const data = await res.json();

    if (!data || (!data.username && !data.full_name && !data.pk)) {
      return NextResponse.json({ error: 'Perfil não encontrado ou conta privada.' }, { status: 404 });
    }

    const profilePic =
      data.hd_profile_pic_url_info?.url ||
      data.profile_pic_url ||
      data.profile_pic_url_hd ||
      '';

    // Cria os posts a partir das mídias retornadas ou da mídia de destaque do perfil
    const posts: PostItem[] = [];

    if (profilePic) {
      posts.push({
        id: `avatar_${data.pk || username}`,
        shortcode: 'AVATAR_HD',
        type: 'image',
        caption: `Foto de Perfil Oficial em Alta Resolução (@${data.username || username})`,
        thumbnailUrl: profilePic,
        mediaList: [
          {
            id: `avatar_img_${data.pk || username}`,
            url: profilePic,
            thumbnailUrl: profilePic,
            type: 'image',
          },
        ],
      });
    }

    // Se o perfil trouxer posts ou reels vinculados
    const items = data.items || data.edge_owner_to_timeline_media?.edges || [];
    items.forEach((rawItem: any, idx: number) => {
      const item = rawItem.node || rawItem;
      posts.push({
        id: item.id || `post_${idx}`,
        shortcode: item.code || item.shortcode || `${idx}`,
        type: item.carousel_media ? 'carousel' : item.is_video || item.video_versions ? 'video' : 'image',
        caption: item.caption?.text || item.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        thumbnailUrl: item.image_versions2?.candidates?.[0]?.url || item.display_url || profilePic,
        mediaList: item.carousel_media
          ? item.carousel_media.map((c: any) => ({
              id: c.id,
              url: c.video_versions?.[0]?.url || c.image_versions2?.candidates?.[0]?.url || c.display_url,
              thumbnailUrl: c.image_versions2?.candidates?.[0]?.url || c.display_url,
              type: c.video_versions || c.is_video ? 'video' : 'image',
            }))
          : [
              {
                id: item.id || `media_${idx}`,
                url:
                  item.video_versions?.[0]?.url ||
                  item.video_url ||
                  item.image_versions2?.candidates?.[0]?.url ||
                  item.display_url,
                thumbnailUrl:
                  item.image_versions2?.candidates?.[0]?.url || item.display_url,
                type: item.is_video || item.video_versions ? 'video' : 'image',
              },
            ],
      });
    });

    const profile: ProfileData = {
      username: data.username || username,
      fullName: data.full_name || '',
      biography: data.biography || '',
      profilePicUrl: profilePic,
      followersCount: data.follower_count || 0,
      followingCount: data.following_count || 0,
      postsCount: data.media_count || 0,
      isPrivate: Boolean(data.is_private),
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
