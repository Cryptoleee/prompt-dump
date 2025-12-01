import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { AddPromptForm } from './components/AddPromptForm';
import { PasswordModal } from './components/PasswordModal';
import { PromptEntry, Category } from './types';
import { INITIAL_PROMPTS } from './constants';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptEntry[]>(() => {
      const saved = localStorage.getItem('prompt_dump_storage_v2');
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch(e) {
              return INITIAL_PROMPTS;
          }
      }
      return INITIAL_PROMPTS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  // Edit State
  const [pendingEditPrompt, setPendingEditPrompt] = useState<PromptEntry | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);

  useEffect(() => {
      localStorage.setItem('prompt_dump_storage_v2', JSON.stringify(prompts));
  }, [prompts]);

  const handleSavePrompt = (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: Category; mood: string }
  ) => {
    if (editingPrompt) {
      // Update existing
      setPrompts(prompts.map(p => 
        p.id === editingPrompt.id 
        ? { 
            ...p, 
            text, 
            sourceUrl, 
            imageUrl, 
            tags: analysis.tags, 
            category: analysis.category, 
            mood: analysis.mood 
          } 
        : p
      ));
    } else {
      // Create new
      const newPrompt: PromptEntry = {
        id: Date.now().toString(),
        text,
        sourceUrl,
        imageUrl,
        tags: analysis.tags,
        category: analysis.category,
        mood: analysis.mood,
        createdAt: Date.now(),
      };
      setPrompts([newPrompt, ...prompts]);
    }
  };

  const handleDeletePrompt = (id: string) => {
      if(window.confirm('Are you sure you want to flush this dump?')) {
          setPrompts(prompts.filter(p => p.id !== id));
      }
  }

  const onEditClick = (prompt: PromptEntry) => {
    setPendingEditPrompt(prompt);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    if (pendingEditPrompt) {
      setEditingPrompt(pendingEditPrompt);
      setPendingEditPrompt(null);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleAddClick = () => {
    setEditingPrompt(undefined);
    setIsModalOpen(true);
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-200">
      {/* Background decoration - Dark Mode */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-dark-bg">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-brand-accent/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-neon-pink/10 blur-[120px]" />
          <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-[100px]" />
      </div>

      <Header onAddClick={handleAddClick} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-dark-card border border-dark-border p-6 rounded-full shadow-lg mb-6 animate-pulse">
              <Layers className="w-12 h-12 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Empty Dump
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No prompts here yet. Time to fill it up!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onDelete={handleDeletePrompt}
                onEdit={onEditClick}
              />
            ))}
          </div>
        )}
      </main>

      <AddPromptForm
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSavePrompt}
        initialData={editingPrompt}
      />

      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};

export default App;