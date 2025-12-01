import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, Type, Image as ImageIcon, Tag, Smile } from 'lucide-react';
import { Category, PromptEntry } from '../types';

interface AddPromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: Category; mood: string }
  ) => void;
  initialData?: PromptEntry;
}

export const AddPromptForm: React.FC<AddPromptFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [text, setText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Manual Metadata State
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.PHOTOREALISTIC);
  const [mood, setMood] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setText(initialData.text);
        setSourceUrl(initialData.sourceUrl);
        setImageUrl(initialData.imageUrl || '');
        setSelectedCategory(initialData.category);
        setMood(initialData.mood || '');
        setTagsInput(initialData.tags.join(', '));
      } else {
        setText('');
        setSourceUrl('');
        setImageUrl('');
        setSelectedCategory(Category.PHOTOREALISTIC);
        setMood('');
        setTagsInput('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Parse comma separated tags
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    onSubmit(text, sourceUrl, imageUrl, {
      tags,
      category: selectedCategory,
      mood: mood || 'Neutral'
    });
    
    onClose();
  };

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent/20 p-3 rounded-2xl border border-brand-accent/20">
                 <Save className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  {isEditMode ? 'Edit Dump' : 'Manual Dump'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isEditMode ? 'Tweaking perfection.' : "Save it for later."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Source & Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-400 ml-1">Source Link</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                            placeholder="https://x.com/..."
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-400 ml-1">Image URL</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            </div>

            {/* Prompt Text */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400 ml-1">Prompt</label>
              <div className="relative group">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="block w-full p-4 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent min-h-[120px] resize-none transition-all font-sans text-lg"
                  placeholder="Paste your prompt text here..."
                />
                <div className="absolute top-4 right-4 pointer-events-none">
                  <Type className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Category Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-400 ml-1">Category</label>
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        className="block w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-2xl text-white focus:ring-2 focus:ring-brand-accent focus:border-transparent appearance-none"
                    >
                        {Object.values(Category).map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Mood Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-400 ml-1">Mood</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Smile className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                            placeholder="e.g. Dark, Cheerful"
                        />
                    </div>
                </div>
            </div>

             {/* Tags Input */}
             <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-400 ml-1">Tags (comma separated)</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                        placeholder="cyberpunk, neon, 8k..."
                    />
                </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium px-2 bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                {error}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white/5 text-gray-300 font-semibold rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-white text-dark-bg font-bold rounded-2xl hover:bg-brand-accent hover:text-white transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98]"
              >
                {isEditMode ? 'Update Dump' : 'Dump It'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
