import React from 'react';
import { Sparkles, Plus, LogOut } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface HeaderProps {
  onAddClick: () => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({ onAddClick, user }) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer select-none">
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

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3 mr-2">
                {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User" 
                      className="w-9 h-9 rounded-full border border-white/20 shadow-sm" 
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold border border-white/10">
                        {user.displayName?.charAt(0) || 'U'}
                    </div>
                )}
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                  title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
          )}

          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-white text-dark-bg px-5 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all active:translate-y-0 duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Dump It</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
