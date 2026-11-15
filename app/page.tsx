'use client';

import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import ProfileHeader from '@/components/ProfileHeader';
import MediaCard from '@/components/MediaCard';
import { ProfileData } from '@/lib/instagram';
import { AlertCircle, Film, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';

type FilterType = 'all' | 'video' | 'image';

export default function Home() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setVisibleCount(12);

    try {
      const res = await fetch(`/api/profile?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao buscar perfil.');
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = (profile?.posts || []).filter((post) => {
    if (filter === 'all') return true;
    if (filter === 'video') return post.type === 'video';
    if (filter === 'image') return post.type === 'image' || post.type === 'carousel';
    return true;
  });

  const displayedPosts = filteredPosts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-12 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> IG Downloader & Explorer
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 bg-clip-text text-transparent mb-4">
            Baixe Mídias do Instagram
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Consulte perfis públicos, visualize carrosséis, Reels e fotos em alta resolução e faça downloads diretos sem bloqueios de CORS.
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <SearchBar onSearch={handleSearch} isLoading={loading} />

        {/* Notificação de Erro */}
        {error && (
          <div className="w-full max-w-2xl mt-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Skeleton de Carregamento */}
        {loading && (
          <div className="w-full max-w-4xl mt-12 space-y-6 animate-pulse">
            <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo do Perfil */}
        {profile && !loading && (
          <div className="w-full mt-12">
            <ProfileHeader profile={profile} />

            {/* Barra de Filtros */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'all'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Todos ({profile.posts.length})
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'video'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Vídeos / Reels
              </button>
              <button
                onClick={() => setFilter('image')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'image'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Fotos / Carrosséis
              </button>
            </div>

            {/* Grid de Postagens */}
            {displayedPosts.length === 0 ? (
              <p className="text-center text-zinc-500 my-12 text-sm">
                Nenhuma publicação encontrada para o filtro selecionado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedPosts.map((post) => (
                  <MediaCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Botão Carregar Mais */}
            {visibleCount < filteredPosts.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-white rounded-xl transition-all cursor-pointer"
                >
                  Carregar mais mídias
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

