import React, { useState, useEffect } from 'react';
import { X, Wand2, Link as LinkIcon, Type, Loader2, Image as ImageIcon, Sparkles, Save } from 'lucide-react';
import { analyzePrompt, extractTweetInfo } from '../services/geminiService';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  // Reset or Populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setText(initialData.text);
        setSourceUrl(initialData.sourceUrl);
        setImageUrl(initialData.imageUrl || '');
      } else {
        setText('');
        setSourceUrl('');
        setImageUrl('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAutoFill = async () => {
    if (!sourceUrl) {
      setError('Paste a link first to use Auto-Fill');
      return;
    }
    
    setIsExtracting(true);
    setError('');
    
    try {
      const info = await extractTweetInfo(sourceUrl);
      
      if (info.imageUrl) {
        setImageUrl(info.imageUrl);
      }
      
      if (info.prompt && !text) {
        setText(info.prompt);
      } else if (info.prompt && text) {
        if (text.length < 10) setText(info.prompt);
      }

      if (!info.imageUrl && !info.prompt) {
        setError('Could not extract info. Try entering manually.');
      }
    } catch (err) {
      setError('Failed to auto-fill. Please enter manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Always re-analyze to ensure tags/categories are fresh based on new text
      const analysis = await analyzePrompt(text);
      onSubmit(text, sourceUrl, imageUrl, analysis);
      
      onClose();
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-brand-accent/20 p-3 rounded-2xl border border-brand-accent/20">
                 {isEditMode ? <Save className="w-6 h-6 text-brand-accent" /> : <Wand2 className="w-6 h-6 text-brand-accent" />}
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  {isEditMode ? 'Edit Dump' : 'Add New Dump'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isEditMode ? 'Tweaking perfection.' : "Paste your find, we'll organize it."}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-400 ml-1">
                        Source Link (X/Twitter)
                    </label>
                    <div className="relative group flex gap-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LinkIcon className="h-5 w-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                            </div>
                            <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                            placeholder="https://x.com/..."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={!sourceUrl || isExtracting}
                            className="px-4 py-2 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/20 rounded-2xl text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px]"
                            title="Auto-fill info from URL"
                        >
                            {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-400 ml-1">
                    Image URL (Preview)
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ImageIcon className="h-5 w-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                    </div>
                    <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
                    placeholder="Auto-filled or paste URL"
                    />
                </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-400 ml-1">
                Prompt
              </label>
              <div className="relative group">
                <textarea
                  id="prompt-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="block w-full p-4 bg-dark-bg border border-dark-border rounded-2xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-accent focus:border-transparent min-h-[150px] resize-none transition-all font-sans text-lg"
                  placeholder="Paste prompt here or try auto-fill..."
                />
                <div className="absolute top-4 right-4 pointer-events-none">
                  <Type className="h-5 w-5 text-gray-600" />
                </div>
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
                disabled={isAnalyzing || !text}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-white text-dark-bg font-bold rounded-2xl hover:bg-brand-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    {isEditMode ? <Save className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                    {isEditMode ? 'Update Dump' : 'Dump It'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};