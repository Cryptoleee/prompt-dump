import React, { useState } from 'react';
import { Hash, Image as ImageIcon } from 'lucide-react';
import { PromptEntry } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface PromptCardProps {
  prompt: PromptEntry;
  onClick: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="bg-dark-card rounded-3xl overflow-hidden shadow-lg border border-dark-border hover:border-brand-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 group flex flex-col h-full relative cursor-pointer active:scale-[0.98]"
    >
      {/* Image Preview Area */}
      <div className={`relative w-full h-48 overflow-hidden border-b border-dark-border group-hover:border-brand-accent/20 transition-colors ${!prompt.imageUrl || imageError ? CATEGORY_COLORS[prompt.category].replace('text-', 'text-opacity-20 ').replace('bg-', 'bg-opacity-10 ') : 'bg-black/40'}`}>
          {prompt.imageUrl && !imageError ? (
              <img 
                src={prompt.imageUrl} 
                alt="Prompt Result" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                onError={() => setImageError(true)}
              />
          ) : (
             <div className="flex flex-col items-center justify-center w-full h-full text-white/10 group-hover:text-white/20 transition-colors">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest opacity-50">No Preview</span>
             </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${CATEGORY_COLORS[prompt.category]}`}>
                {prompt.category}
             </span>
             {prompt.mood && (
              <span className="text-[10px] font-medium text-white/80 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                {prompt.mood}
              </span>
            )}
          </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow mb-4">
            <p className="text-gray-300 font-sans text-base leading-relaxed line-clamp-3">
            {prompt.text}
            </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
            {prompt.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center text-[10px] text-gray-400 bg-dark-bg px-2 py-1 rounded-md border border-dark-border">
                <Hash className="w-2.5 h-2.5 mr-0.5 text-gray-600" />
                {tag}
            </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="text-[10px] text-gray-500 self-center">+{prompt.tags.length - 3}</span>
            )}
        </div>
      </div>
    </div>
  );
};