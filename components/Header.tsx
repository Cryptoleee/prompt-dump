import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

interface HeaderProps {
  onAddClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddClick }) => {
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
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-neon-pink">Dump</span>
          </h1>
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-white text-dark-bg px-5 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all active:translate-y-0 duration-200"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Dump It</span>
        </button>
      </div>
    </header>
  );
};