import { NextRequest, NextResponse } from 'next/server';
import { extractUsername, ProfileData, PostItem } from '@/lib/instagram';
import { adminDb } from '@/lib/firebaseAdmin';

// Configuração para Serverless da Vercel
export const maxDuration = 30; // 30 segundos de timeout na Vercel
export const dynamic = 'force-dynamic';

function getMockProfile(username: string): ProfileData {
  const mockPosts: PostItem[] = [
    {
      id: 'post_1',
      shortcode: 'DEMO123',
      type: 'video',
      caption: '🚀 Exemplo de Reel/Vídeo de alta qualidade! #tech #developer',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      mediaList: [
        {
          id: 'v_1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          type: 'video'
        }
      ],
      timestamp: Date.now() - 3600000
    },
    {
      id: 'post_2',
      shortcode: 'DEMO124',
      type: 'carousel',
      caption: '📸 Carrossel demonstrativo com múltiplos slides.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      mediaList: [
        {
          id: 'c_1',
          url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=90',
          thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
          type: 'image'
        },
        {
          id: 'c_2',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=90',
          thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          type: 'image'
        }
      ],
      timestamp: Date.now() - 86400000
    },
    {
      id: 'post_3',
      shortcode: 'DEMO125',
      type: 'image',
      caption: '✨ Foto única em alta resolução.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      mediaList: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=90',
          thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
          type: 'image'
        }
      ],
      timestamp: Date.now() - 172800000
    }
  ];

  return {
    username,
    fullName: `${username.charAt(0).toUpperCase() + username.slice(1)} (Perfil Público)`,
    biography: 'Conta pública localizada com sucesso. Você pode visualizar e baixar os conteúdos abaixo.',
    profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    followersCount: 12450,
    followingCount: 382,
    postsCount: 48,
    isPrivate: false,
    posts: mockPosts
  };
}

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
    let profile: ProfileData;

    if (apiKey) {
      const res = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
        },
        next: { revalidate: 180 }
      });

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao consultar a API upstream.' }, { status: res.status });
      }

      const data = await res.json();
      const profileInfo = data.data || {};

      profile = {
        username: profileInfo.username || username,
        fullName: profileInfo.full_name || '',
        biography: profileInfo.biography || '',
        profilePicUrl: profileInfo.profile_pic_url_hd || profileInfo.profile_pic_url || '',
        followersCount: profileInfo.follower_count || 0,
        followingCount: profileInfo.following_count || 0,
        postsCount: profileInfo.media_count || 0,
        isPrivate: Boolean(profileInfo.is_private),
        posts: (profileInfo.items || []).map((item: any) => ({
          id: item.id,
          shortcode: item.code || item.id,
          type: item.carousel_media ? 'carousel' : item.video_versions ? 'video' : 'image',
          caption: item.caption?.text || '',
          thumbnailUrl: item.image_versions2?.candidates?.[0]?.url || '',
          mediaList: item.carousel_media
            ? item.carousel_media.map((c: any) => ({
                id: c.id,
                url: c.video_versions?.[0]?.url || c.image_versions2?.candidates?.[0]?.url,
                thumbnailUrl: c.image_versions2?.candidates?.[0]?.url,
                type: c.video_versions ? 'video' : 'image',
              }))
            : [
                {
                  id: item.id,
                  url: item.video_versions?.[0]?.url || item.image_versions2?.candidates?.[0]?.url,
                  thumbnailUrl: item.image_versions2?.candidates?.[0]?.url,
                  type: item.video_versions ? 'video' : 'image',
                },
              ],
        })),
      };
    } else {
      profile = getMockProfile(username);
    }

    // Salvar registro de busca no Firebase Firestore de forma assíncrona
    if (adminDb) {
      try {
        await adminDb.collection('searches').add({
          username: profile.username,
          searchedAt: new Date().toISOString(),
          postsFound: profile.posts.length,
          userAgent: req.headers.get('user-agent') || 'unknown'
        });
      } catch (dbErr) {
        console.warn('Erro não bloqueante ao registrar busca no Firestore:', dbErr);
      }
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno ao processar solicitação.' }, { status: 500 });
  }
}
