import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { AddPromptForm } from './components/AddPromptForm';
import { LoginScreen } from './components/LoginScreen';
import { PromptDetailModal } from './components/PromptDetailModal';
import { PromptEntry, Category } from './types';
import { GUEST_STORAGE_KEY } from './constants';
import { Layers, AlertTriangle } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);

  // 1. Auth Listener
  useEffect(() => {
    // Check for redirect result first
    getRedirectResult(auth).catch(e => console.error("Redirect Error", e));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Sync Listener
  useEffect(() => {
    // If Guest Mode
    if (isGuest && !user) {
      setLoadingPrompts(true);
      const localData = localStorage.getItem(GUEST_STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setPrompts(parsed.sort((a: PromptEntry, b: PromptEntry) => b.createdAt - a.createdAt));
        } catch (e) {
          console.error("Failed to parse guest data", e);
          setPrompts([]);
        }
      } else {
        setPrompts([]);
      }
      setLoadingPrompts(false);
      return;
    }

    // If Not Logged In and Not Guest
    if (!user) {
      setPrompts([]);
      return;
    }

    // Cloud Mode (Firestore)
    setLoadingPrompts(true);
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPrompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromptEntry[];
      
      // Sort by newest first (Client Side)
      fetchedPrompts.sort((a, b) => b.createdAt - a.createdAt);
      
      setPrompts(fetchedPrompts);
      setLoadingPrompts(false);
    }, (error) => {
       console.error("Error fetching prompts:", error);
       setLoadingPrompts(false);
    });

    return () => unsubscribe();
  }, [user, isGuest]);

  const saveToLocalStorage = (newPrompts: PromptEntry[]) => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newPrompts));
    setPrompts(newPrompts);
  };

  const handleSavePrompt = async (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: Category; mood: string }
  ) => {
    
    // GUEST LOGIC
    if (isGuest) {
      let updatedPrompts = [...prompts];
      if (editingPrompt) {
        updatedPrompts = updatedPrompts.map(p => p.id === editingPrompt.id ? {
          ...p,
          text,
          sourceUrl,
          imageUrl,
          tags: analysis.tags,
          category: analysis.category,
          mood: analysis.mood
        } : p);
      } else {
        const newPrompt: PromptEntry = {
          id: Date.now().toString(),
          text,
          sourceUrl,
          imageUrl,
          tags: analysis.tags,
          category: analysis.category,
          mood: analysis.mood,
          createdAt: Date.now()
        };
        updatedPrompts = [newPrompt, ...updatedPrompts];
      }
      saveToLocalStorage(updatedPrompts);
      return;
    }

    // CLOUD LOGIC
    if (!user) return;
    try {
      if (editingPrompt) {
        const promptRef = doc(db, 'prompts', editingPrompt.id);
        await updateDoc(promptRef, {
          text,
          sourceUrl,
          imageUrl,
          tags: analysis.tags,
          category: analysis.category,
          mood: analysis.mood
        });
      } else {
        await addDoc(collection(db, 'prompts'), {
          text,
          sourceUrl,
          imageUrl,
          tags: analysis.tags,
          category: analysis.category,
          mood: analysis.mood,
          createdAt: Date.now(),
          userId: user.uid
        });
      }
    } catch (e) {
      console.error("Error saving prompt: ", e);
      alert("Failed to save to cloud. Please check your internet connection.");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if(!window.confirm('Are you sure you want to flush this dump?')) return;

    // GUEST LOGIC
    if (isGuest) {
      const updatedPrompts = prompts.filter(p => p.id !== id);
      saveToLocalStorage(updatedPrompts);
      // Close modal if deleting the open prompt
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(undefined);
      }
      return;
    }

    // CLOUD LOGIC
    try {
      await deleteDoc(doc(db, 'prompts', id));
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(undefined);
      }
    } catch (e) {
      console.error("Error deleting:", e);
    }
  }

  const handleEditInit = (prompt: PromptEntry) => {
    setEditingPrompt(prompt);
    setIsAddModalOpen(true);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleAddClick = () => {
    setEditingPrompt(undefined);
    setIsAddModalOpen(true);
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand-accent">Loading...</div>;
  }

  // Show Login if not user and not guest
  if (!user && !isGuest) {
    return <LoginScreen onGuestLogin={handleGuestLogin} />;
  }

  // Filter local state for search/category
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

      <Header onAddClick={handleAddClick} user={user} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isGuest && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3 flex items-center justify-center gap-2 text-yellow-500 text-sm">
             <AlertTriangle className="w-4 h-4" />
             Guest Mode: Prompts are saved on this device only. Log in to sync across devices.
          </div>
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {loadingPrompts ? (
             <div className="text-center py-20 text-gray-500 animate-pulse">Syncing your dump...</div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-dark-card border border-dark-border p-6 rounded-full shadow-lg mb-6">
              <Layers className="w-12 h-12 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Empty Dump
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No prompts here yet. Dump your first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onClick={() => setSelectedPrompt(prompt)}
              />
            ))}
          </div>
        )}
      </main>

      <AddPromptForm
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSubmit={handleSavePrompt}
        initialData={editingPrompt}
      />

      <PromptDetailModal 
        prompt={selectedPrompt}
        isOpen={!!selectedPrompt}
        onClose={() => setSelectedPrompt(undefined)}
        onDelete={handleDeletePrompt}
        onEdit={handleEditInit}
      />
    </div>
  );
};

export default App;