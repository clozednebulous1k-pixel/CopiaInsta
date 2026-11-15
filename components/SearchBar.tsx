'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: @cristiano ou link do perfil..."
          className="w-full px-4 py-3.5 pl-11 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-zinc-500 transition-all text-sm"
        />
        <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
      </div>
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-500/20 text-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
          </>
        ) : (
          'Buscar Perfil'
        )}
      </button>
    </form>
  );
}

