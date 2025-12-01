import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { AddPromptForm } from './components/AddPromptForm';
import { LoginScreen } from './components/LoginScreen';
import { PromptEntry, Category } from './types';
import { Layers } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Sync Listener
  useEffect(() => {
    if (!user) {
      setPrompts([]);
      return;
    }

    setLoadingPrompts(true);
    // Create query to get prompts for this user only
    // NOTE: We removed orderBy('createdAt') to prevent "Missing Index" errors.
    // We will sort it in the javascript below instead.
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
  }, [user]);

  const handleSavePrompt = async (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: Category; mood: string }
  ) => {
    if (!user) return;

    try {
      if (editingPrompt) {
        // Update existing
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
        // Create new in Firestore
        await addDoc(collection(db, 'prompts'), {
          text,
          sourceUrl,
          imageUrl,
          tags: analysis.tags,
          category: analysis.category,
          mood: analysis.mood,
          createdAt: Date.now(),
          userId: user.uid // Securely link to user
        });
      }
    } catch (e) {
      console.error("Error saving prompt: ", e);
      alert("Failed to save to cloud. Please check your internet connection.");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if(window.confirm('Are you sure you want to flush this dump?')) {
      try {
        await deleteDoc(doc(db, 'prompts', id));
      } catch (e) {
        console.error("Error deleting:", e);
      }
    }
  }

  const onEditClick = (prompt: PromptEntry) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleAddClick = () => {
    setEditingPrompt(undefined);
    setIsModalOpen(true);
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand-accent">Loading...</div>;
  }

  // If not logged in, show Login Screen
  if (!user) {
    return <LoginScreen />;
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
    </div>
  );
};

export default App;