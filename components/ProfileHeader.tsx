import React from 'react';
import { ProfileData } from '@/lib/instagram';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ProfileHeader({ profile }: { profile: ProfileData }) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <img
            src={profile.profilePicUrl}
            alt={profile.username}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-pink-500/80 object-cover p-0.5 shadow-lg"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-1.5">
              @{profile.username}
              <CheckCircle2 className="w-5 h-5 text-pink-500 fill-pink-500/20" />
            </h2>
            {profile.isPrivate && (
              <span className="flex items-center gap-1 text-xs bg-zinc-800/80 text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-700">
                <Lock className="w-3 h-3" /> Privado
              </span>
            )}
          </div>
          {profile.fullName && (
            <p className="text-sm font-medium text-zinc-300 mt-1">{profile.fullName}</p>
          )}
          {profile.biography && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 whitespace-pre-line max-w-xl">
              {profile.biography}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-8 mt-5 pt-4 border-t border-zinc-800/60 text-sm">
            <div>
              <span className="font-bold text-white">{profile.postsCount.toLocaleString()}</span>
              <span className="text-zinc-500 ml-1.5 text-xs">publicações</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile.followersCount.toLocaleString()}</span>
              <span className="text-zinc-500 ml-1.5 text-xs">seguidores</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile.followingCount.toLocaleString()}</span>
              <span className="text-zinc-500 ml-1.5 text-xs">seguindo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

