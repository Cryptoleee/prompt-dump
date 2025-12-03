import React from 'react';
import { Sparkles, Plus, LogOut, Link as LinkIcon, Users, Edit, LogIn } from 'lucide-react';
import { User, signOut, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { UserProfile } from '../types';

interface HeaderProps {
  onAddClick: () => void;
  user?: User | null;
  isGuest: boolean;
  userProfile?: UserProfile;
  isReadOnly: boolean;
  onEditProfile: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onAddClick, 
    user, 
    isGuest, 
    userProfile, 
    isReadOnly,
    onEditProfile,
    onOpenSearch
}) => {
  
  const handleShare = () => {
    const url = `${window.location.origin}/?uid=${userProfile?.uid}`;
    navigator.clipboard.writeText(url);
    alert("Profile link copied to clipboard!");
  };

  const handleGuestLogin = async () => {
     try {
        await signInWithPopup(auth, googleProvider);
        window.location.reload(); // Refresh to clear guest state
     } catch (e) {
        console.error(e);
     }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer select-none" onClick={() => window.location.href = '/'}>
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
          <button 
             onClick={onOpenSearch}
             className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
             title="Find People"
          >
             <Users className="w-5 h-5" />
          </button>

          {(user || isGuest) && (
            <div className="flex items-center gap-2 sm:gap-3 mr-2">
                {/* Avatar */}
                {userProfile?.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="User" 
                      className="w-9 h-9 rounded-full border border-white/20 shadow-sm object-cover" 
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold border border-white/10">
                        {userProfile?.displayName?.charAt(0) || 'G'}
                    </div>
                )}

                {/* Profile Actions */}
                {!isGuest && !isReadOnly && (
                    <>
                    <button onClick={onEditProfile} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full" title="Edit Profile">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={handleShare} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full" title="Share Profile">
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => signOut(auth)} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full" title="Sign Out">
                        <LogOut className="w-4 h-4" />
                    </button>
                    </>
                )}

                {/* Guest Actions */}
                {isGuest && (
                    <button onClick={handleGuestLogin} className="p-2 text-brand-accent hover:text-white bg-brand-accent/10 hover:bg-brand-accent rounded-full transition-colors" title="Log In to Sync">
                        <LogIn className="w-4 h-4" />
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