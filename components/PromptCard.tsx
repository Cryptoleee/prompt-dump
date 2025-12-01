import React, { useState } from 'react';
import { Copy, ExternalLink, Hash, X, Image as ImageIcon, Pencil } from 'lucide-react';
import { PromptEntry } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface PromptCardProps {
  prompt: PromptEntry;
  onDelete: (id: string) => void;
  onEdit: (prompt: PromptEntry) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-dark-card rounded-3xl overflow-hidden shadow-lg border border-dark-border hover:border-brand-accent/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 group flex flex-col h-full relative">
      
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
          
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
             <button 
               onClick={() => onEdit(prompt)}
               className="p-2 bg-black/50 backdrop-blur-md text-blue-400 rounded-full hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-white/10"
               title="Edit"
             >
               <Pencil className="w-4 h-4" />
             </button>
             <button 
               onClick={() => onDelete(prompt.id)}
               className="p-2 bg-black/50 backdrop-blur-md text-red-400 rounded-full hover:bg-red-500/20 hover:text-red-300 transition-colors border border-white/10"
               title="Delete"
             >
               <X className="w-4 h-4" />
             </button>
          </div>

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
        <div className="flex-grow mb-6">
            <p className="text-gray-300 font-sans text-base leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-text select-text selection:bg-brand-accent/30 selection:text-white">
            {prompt.text}
            </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
            {prompt.tags.map((tag) => (
            <span key={tag} className="flex items-center text-[10px] text-gray-400 bg-dark-bg px-2 py-1 rounded-md border border-dark-border">
                <Hash className="w-2.5 h-2.5 mr-0.5 text-gray-600" />
                {tag}
            </span>
            ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-dark-border">
            <div className="flex gap-2">
            {prompt.sourceUrl && (
                <a
                    href={prompt.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-colors"
                    title="Open Source"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
            )}
            </div>

            <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-white text-dark-bg hover:bg-brand-accent hover:text-white border border-transparent hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]'
            }`}
            >
            {copied ? 'Copied!' : 'Copy'}
            {!copied && <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
      </div>
    </div>
  );
};