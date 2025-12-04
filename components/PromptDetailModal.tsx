import React from 'react';
import { X, Copy, ExternalLink, Hash, Edit, Trash2 } from 'lucide-react';
import { PromptEntry } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptEntry;
  onDelete: (id: string) => void;
  onEdit: (prompt: PromptEntry) => void;
  isReadOnly: boolean;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onDelete,
  onEdit,
  isReadOnly
}) => {
  const [copied, setCopied] = React.useState(false);
  const [showFullPrompt, setShowFullPrompt] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header Image */}
        <div className="relative h-64 w-full bg-black flex-shrink-0">
            {prompt.imageUrl ? (
                <img 
                    src={prompt.imageUrl} 
                    className="w-full h-full object-cover opacity-90" 
                    alt="Result"
                />
            ) : (
                <div className={`w-full h-full ${CATEGORY_COLORS[prompt.category]} opacity-20`} />
            )}
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-4 flex gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${CATEGORY_COLORS[prompt.category]} bg-black/50 border-white/10`}>
                    {prompt.category}
                 </span>
                 {prompt.mood && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium text-white/90 bg-black/50 backdrop-blur-md border border-white/10">
                        {prompt.mood}
                    </span>
                 )}
            </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="flex gap-2 mb-6 flex-wrap">
                {prompt.tags.map(tag => (
                    <span key={tag} className="flex items-center text-xs text-gray-400 bg-dark-bg px-2.5 py-1 rounded-lg border border-dark-border">
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Prompt</h3>
                <div className={`bg-dark-bg p-5 rounded-2xl border border-dark-border text-gray-200 text-lg leading-relaxed font-sans ${!showFullPrompt && 'line-clamp-6'}`}>
                    {prompt.text}
                </div>
                {prompt.text.length > 300 && (
                    <button 
                        onClick={() => setShowFullPrompt(!showFullPrompt)}
                        className="mt-2 text-brand-accent text-sm font-medium hover:text-white transition-colors"
                    >
                        {showFullPrompt ? 'Show Less' : 'Show Full Prompt'}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-dark-border">
                <div className="flex gap-2">
                    {prompt.sourceUrl && (
                        <a 
                            href={prompt.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors text-sm font-medium border border-dark-border"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Source
                        </a>
                    )}
                </div>

                <div className="flex gap-2">
                    {!isReadOnly && (
                        <>
                            <button 
                                onClick={() => onDelete(prompt.id)}
                                className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => onEdit(prompt)}
                                className="p-2.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
                                title="Edit"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                            copied
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20'
                        }`}
                    >
                        {copied ? 'Copied' : 'Copy Prompt'}
                        {!copied && <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};