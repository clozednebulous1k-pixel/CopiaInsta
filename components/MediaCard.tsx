'use client';

import React, { useState } from 'react';
import { PostItem } from '@/lib/instagram';
import { Download, Play, Layers, Check } from 'lucide-react';

interface MediaCardProps {
  post: PostItem;
}

export default function MediaCard({ post }: MediaCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = (mediaUrl: string, suffix: string = '') => {
    setDownloading(true);
    const filename = `ig_${post.shortcode}${suffix}`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`;

    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    }, 800);
  };

  const handleDownloadAll = () => {
    setDownloading(true);
    post.mediaList.forEach((media, idx) => {
      setTimeout(() => {
        const filename = `ig_${post.shortcode}_${idx + 1}`;
        const proxyUrl = `/api/download?url=${encodeURIComponent(media.url)}&filename=${encodeURIComponent(filename)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (idx === post.mediaList.length - 1) {
          setDownloading(false);
          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2500);
        }
      }, idx * 600);
    });
  };

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
        <img
          src={post.thumbnailUrl}
          alt={post.caption || 'Instagram Post'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge do tipo */}
        <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md p-1.5 rounded-lg text-white shadow-md">
          {post.type === 'video' && <Play className="w-3.5 h-3.5 fill-white" />}
          {post.type === 'carousel' && <Layers className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>

      <div className="p-3 bg-zinc-900 flex flex-col flex-1 justify-between gap-3">
        {post.caption ? (
          <p className="text-xs text-zinc-400 line-clamp-2" title={post.caption}>
            {post.caption}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">Sem legenda</p>
        )}

        <div className="pt-2 border-t border-zinc-800">
          {post.type === 'carousel' ? (
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 hover:bg-pink-600 text-zinc-200 hover:text-white'
              }`}
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Baixado com Sucesso!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Baixar Carrossel ({post.mediaList.length})
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleDownload(post.mediaList[0]?.url || post.thumbnailUrl)}
              disabled={downloading}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 hover:bg-pink-600 text-zinc-200 hover:text-white'
              }`}
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Baixado com Sucesso!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Baixar {post.type === 'video' ? 'Vídeo / Reel' : 'Foto'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

