import React, { useState } from 'react';
import { Sparkles, Plus, LogOut, Share2, LogIn, Check, Users, Edit3 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';

interface HeaderProps {
  onAddClick: () => void;
  userProfile?: UserProfile | null;
  isGuest?: boolean;
  isReadOnly?: boolean;
  onGuestLogin?: () => void;
  onEditProfile?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddClick, 
  userProfile, 
  isGuest,
  isReadOnly,
  onGuestLogin,
  onEditProfile,
  onOpenSearch
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareProfile = () => {
    if (!userProfile) return;
    const url = `${window.location.origin}?uid=${userProfile.uid}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div 
            className="flex items-center gap-3 group cursor-pointer select-none" 
            onClick={() => window.location.href = '/'}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-brand-accent blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
            <div className="relative bg-gradient-to-br from-brand-accent to-neon-pink p-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight hidden sm:block">
            Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-neon-pink">Dump</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Guest Login Button */}
          {isGuest && onGuestLogin && (
            <button
              onClick={onGuestLogin}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5"
            >
              <LogIn className="w-4 h-4" />
              Log In
            </button>
          )}

          <button
            onClick={onOpenSearch}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5"
            title="Community Search"
          >
            <Users className="w-5 h-5" />
          </button>

          {userProfile && (
            <div className="flex items-center gap-2 sm:gap-3 mr-1">
                {/* Share Profile Button */}
                <button
                    onClick={handleShareProfile}
                    className={`p-2 transition-all rounded-full border ${
                        copied 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'text-gray-400 hover:text-brand-accent bg-white/5 hover:bg-brand-accent/10 border-transparent hover:border-brand-accent/20'
                    }`}
                    title="Share Profile Link"
                >
                    {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>

                 {/* Edit Profile (Only if not read only) */}
                 {!isGuest && !isReadOnly && onEditProfile && (
                    <button
                        onClick={onEditProfile}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 hidden sm:block"
                        title="Edit Profile"
                    >
                        <Edit3 className="w-5 h-5" />
                    </button>
                 )}

                {/* Avatar */}
                {userProfile.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="User" 
                      onClick={onEditProfile}
                      className={`w-9 h-9 rounded-full border border-white/20 shadow-sm object-cover ${!isReadOnly ? 'cursor-pointer hover:border-brand-accent' : ''}`}
                    />
                ) : (
                    <div 
                        onClick={onEditProfile}
                        className={`w-9 h-9 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold border border-white/10 ${!isReadOnly ? 'cursor-pointer' : ''}`}>
                        {userProfile.displayName?.charAt(0) || 'U'}
                    </div>
                )}
                
                {/* Sign Out (Only show if it's MY session) */}
                {!isGuest && !isReadOnly && (
                    <button 
                    onClick={() => signOut(auth)}
                    className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                    title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
          )}

          {!isReadOnly && (
            <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-white text-dark-bg px-4 sm:px-5 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all active:translate-y-0 duration-200"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Dump It</span>
                <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};