import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Configuração otimizada para Serverless Functions na Vercel
export const maxDuration = 60; // 60 segundos permitidos no plano da Vercel
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'instagram_media';

  if (!mediaUrl) {
    return NextResponse.json({ error: 'URL do arquivo ausente.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(mediaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Falha ao recuperar a mídia original.' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const extension = contentType.includes('video') ? '.mp4' : '.jpg';
    const finalFilename = filename.endsWith('.mp4') || filename.endsWith('.jpg')
      ? filename
      : `${filename}${extension}`;

    // Registrar estatística de download no Firebase Firestore de forma assíncrona
    if (adminDb) {
      adminDb.collection('downloads').add({
        filename: finalFilename,
        contentType,
        downloadedAt: new Date().toISOString(),
      }).catch((e) => console.warn('Erro ao salvar telemetria de download:', e));
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFilename)}"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no streaming do download.' }, { status: 500 });
  }
}
