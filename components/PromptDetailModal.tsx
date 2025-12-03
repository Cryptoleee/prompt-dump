import React, { useState } from 'react';
import { X, Copy, ExternalLink, Pencil, Trash2, Hash, Calendar, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { PromptEntry } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface PromptDetailModalProps {
  prompt: PromptEntry | undefined;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (prompt: PromptEntry) => void;
  isReadOnly?: boolean;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ 
  prompt, 
  isOpen, 
  onClose,
  onDelete,
  onEdit,
  isReadOnly
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(prompt.id);
    onClose();
  };

  const handleEdit = () => {
    onEdit(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header / Image Section */}
        <div className="relative w-full shrink-0 min-h-[200px] max-h-[40vh] overflow-hidden bg-black/50">
             <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-md hover:bg-white/10 text-white rounded-full transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {prompt.imageUrl && !imageError ? (
              <img 
                src={prompt.imageUrl} 
                alt="Prompt Result" 
                className="w-full h-full object-contain bg-black/80"
                onError={() => setImageError(true)}
              />
            ) : (
               <div className={`w-full h-full flex flex-col items-center justify-center ${CATEGORY_COLORS[prompt.category].replace('text-', 'text-opacity-20 ').replace('bg-', 'bg-opacity-10 ')}`}>
                  <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-sm uppercase font-bold tracking-widest opacity-50">No Image Preview</span>
               </div>
            )}
            
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-dark-card to-transparent pointer-events-none" />
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
            
            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${CATEGORY_COLORS[prompt.category]}`}>
                    {prompt.category}
                </span>
                {prompt.mood && (
                    <span className="text-xs font-medium text-gray-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {prompt.mood}
                    </span>
                )}
                 <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
                    <Calendar className="w-3 h-3" />
                    {new Date(prompt.createdAt).toLocaleDateString()}
                 </span>
            </div>

            {/* Main Prompt Text */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Prompt</h3>
                <div className="bg-dark-bg p-6 rounded-2xl border border-dark-border relative group">
                     <p className={`text-gray-200 font-sans text-lg leading-relaxed whitespace-pre-wrap ${!showFullText ? 'line-clamp-4 mask-fade-bottom' : ''}`}>
                        {prompt.text}
                     </p>
                     
                     <div className="mt-4 flex justify-center">
                        <button 
                            onClick={() => setShowFullText(!showFullText)}
                            className="text-xs font-bold uppercase tracking-wider text-brand-accent hover:text-white transition-colors flex items-center gap-1"
                        >
                            {showFullText ? (
                                <>Show Less <ChevronUp className="w-3 h-3" /></>
                            ) : (
                                <>Show Full Prompt <ChevronDown className="w-3 h-3" /></>
                            )}
                        </button>
                     </div>
                </div>
            </div>

            {/* Tags & Source */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                 <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {prompt.tags.map((tag) => (
                        <span key={tag} className="flex items-center text-xs text-gray-400 bg-dark-bg px-3 py-1.5 rounded-lg border border-dark-border">
                            <Hash className="w-3 h-3 mr-1 text-gray-600" />
                            {tag}
                        </span>
                        ))}
                    </div>
                 </div>
                 
                 {prompt.sourceUrl && (
                    <div className="shrink-0">
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Source</h3>
                         <a
                            href={prompt.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white rounded-xl transition-all border border-brand-accent/20 text-sm font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Link
                        </a>
                    </div>
                 )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-6 border-t border-dark-border">
                {!isReadOnly && (
                    <>
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-bg text-gray-300 hover:text-white hover:bg-white/5 border border-dark-border transition-all text-sm font-medium"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-bg text-red-400 hover:text-white hover:bg-red-500/20 border border-dark-border hover:border-red-500/30 transition-all text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </>
                )}
                
                <div className="ml-auto">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
                            copied
                            ? 'bg-green-500 text-white shadow-green-500/20 scale-105'
                            : 'bg-white text-dark-bg hover:bg-brand-accent hover:text-white hover:shadow-brand-accent/30'
                        }`}
                    >
                        {copied ? 'Copied!' : 'Copy Prompt'}
                        {!copied && <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};