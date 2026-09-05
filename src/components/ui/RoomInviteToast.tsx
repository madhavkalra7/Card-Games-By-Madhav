'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFriendsStore, RoomInvite } from '@/store/friendsStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/socket/client';
import { sounds } from '@/lib/sound';
import { X, Play, Sparkles } from 'lucide-react';

export const RoomInviteToast: React.FC = () => {
  const router = useRouter();
  const { incomingInvite, setIncomingInvite } = useFriendsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleInvite = (invite: RoomInvite) => {
      // Don't notify if invited to current room
      sounds.playCardDraw();
      setIncomingInvite(invite);
    };

    socket.on('room_invite_received', handleInvite);

    // Register user with socket so server routes invites accurately
    if (user && socket.connected) {
      socket.emit('register_user', {
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        avatarColor: user.avatarColor,
      });
    }

    return () => {
      socket.off('room_invite_received', handleInvite);
    };
  }, [user, setIncomingInvite]);

  if (!incomingInvite) return null;

  const handleJoin = () => {
    const code = incomingInvite.roomCode;
    setIncomingInvite(null);
    sounds.playCardFlip();
    router.push(`/room/${code}`);
  };

  const handleDecline = () => {
    setIncomingInvite(null);
  };

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[200] w-[94%] max-w-md animate-in slide-in-from-top duration-300 select-none">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-zinc-950 via-[#18110b] to-[#0d0a06] border-2 border-gold/70 shadow-[0_0_40px_rgba(212,175,55,0.45)] p-3.5 sm:p-4 text-white">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-36 h-12 bg-amber-500/20 blur-xl pointer-events-none rounded-full" />

        <div className="flex items-center gap-3">
          {/* Host Avatar */}
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 p-0.5 flex items-center justify-center shrink-0 shadow-gold-glow"
            style={{ backgroundColor: incomingInvite.hostAvatarColor || '#f59e0b' }}
          >
            {incomingInvite.hostAvatar ? (
              <img
                src={incomingInvite.hostAvatar}
                alt={incomingInvite.hostName}
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <span className="font-black text-sm text-black">
                {incomingInvite.hostName?.charAt(0).toUpperCase() || 'P'}
              </span>
            )}
          </div>

          {/* Invite Text */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Table Invitation</span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
              {incomingInvite.hostName}
            </h4>
            <p className="text-[11px] text-zinc-300 truncate">
              Invited you to play <span className="text-gold font-bold">Room #{incomingInvite.roomCode}</span>
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDecline}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
          <button
            onClick={handleDecline}
            className="flex-1 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Join Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
