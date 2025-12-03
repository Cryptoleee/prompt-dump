import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { AddPromptForm } from './components/AddPromptForm';
import { LoginScreen } from './components/LoginScreen';
import { PromptDetailModal } from './components/PromptDetailModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { UserSearchModal } from './components/UserSearchModal';
import { PromptEntry, Category, UserProfile } from './types';
import { GUEST_STORAGE_KEY, DEFAULT_BANNER } from './constants';
import { Layers, AlertTriangle, Users } from 'lucide-react';
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
  updateDoc,
  getDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [isGuest, setIsGuest] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);

  // Social Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Shared Profile State
  const [viewingSharedUid, setViewingSharedUid] = useState<string | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    // Check URL for shared profile
    const params = new URLSearchParams(window.location.search);
    const sharedUid = params.get('uid');
    if (sharedUid) {
        setViewingSharedUid(sharedUid);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        // Initial Fetch of own profile if not viewing someone else
        if (!sharedUid) {
            await fetchUserProfile(currentUser.uid);
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch User Profile Data (Banner, Username etc)
  const fetchUserProfile = async (uid: string) => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
        } else {
            // If viewing self and no doc exists, create default from Google Auth
            if (auth.currentUser && uid === auth.currentUser.uid) {
                const defaultProfile: UserProfile = {
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.displayName || 'User',
                    photoURL: auth.currentUser.photoURL || '',
                };
                setUserProfile(defaultProfile);
            } else {
                // Viewing other user who hasn't set up profile
                 setUserProfile({
                    uid,
                    displayName: 'Unknown User',
                    photoURL: '',
                });
            }
        }
    } catch (e) {
        console.error("Error fetching profile", e);
    }
  };

  // 3. Listen for Real-time Profile Updates (Only for logged in user)
  useEffect(() => {
    if (user && !viewingSharedUid) {
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) setUserProfile(doc.data() as UserProfile);
        });
        return () => unsub();
    }
  }, [user, viewingSharedUid]);

  // 4. Update Profile when viewing shared
  useEffect(() => {
    if (viewingSharedUid) {
        fetchUserProfile(viewingSharedUid);
    }
  }, [viewingSharedUid]);


  // 5. Data Sync Listener (Prompts)
  useEffect(() => {
    
    // Case 1: Viewing Shared Profile (Takes Priority)
    if (viewingSharedUid) {
        setLoadingPrompts(true);
        const q = query(
          collection(db, 'prompts'),
          where('userId', '==', viewingSharedUid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPrompts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PromptEntry[];
          
          fetchedPrompts.sort((a, b) => b.createdAt - a.createdAt);
          setPrompts(fetchedPrompts);
          setLoadingPrompts(false);
        }, (error) => {
           console.error("Error fetching shared prompts:", error);
           setLoadingPrompts(false);
        });
        return () => unsubscribe();
    }

    // Case 2: Guest Mode
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

    // Case 3: Logged In User
    if (user) {
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
        
        fetchedPrompts.sort((a, b) => b.createdAt - a.createdAt);
        setPrompts(fetchedPrompts);
        setLoadingPrompts(false);
        }, (error) => {
        console.error("Error fetching prompts:", error);
        setLoadingPrompts(false);
        });

        return () => unsubscribe();
    }
    
    // Case 4: Default (No user, no guest, no share)
    setPrompts([]);
  }, [user, isGuest, viewingSharedUid]);

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
      alert("Failed to save to cloud.");
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

  const resetToLogin = () => {
    setIsGuest(false);
    setUserProfile(null);
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand-accent animate-pulse">Loading...</div>;
  }

  // Show Login if not user, not guest, and not viewing shared profile
  if (!user && !isGuest && !viewingSharedUid) {
    return <LoginScreen onGuestLogin={handleGuestLogin} />;
  }

  // Determine Read-Only Status
  // It is read-only if we are viewing a shared UID that is NOT our own UID
  const isReadOnly = !!viewingSharedUid && viewingSharedUid !== user?.uid;

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
      
      {/* Dynamic Profile Banner */}
      <div className="relative w-full h-[250px] md:h-[350px] overflow-hidden">
        <div className="absolute inset-0 bg-dark-bg/20 z-10"></div>
        <img 
            src={userProfile?.bannerURL || DEFAULT_BANNER} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg z-20"></div>
        
        {/* Profile Info Overlay */}
        {userProfile && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 max-w-7xl mx-auto flex items-end">
                <div className="flex items-center gap-4">
                     <img 
                        src={userProfile.photoURL || 'https://via.placeholder.com/100'} 
                        alt="Profile" 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-dark-bg shadow-xl object-cover bg-dark-card"
                    />
                    <div className="mb-2">
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white text-shadow">{userProfile.displayName}</h1>
                        {userProfile.username && <p className="text-brand-accent font-medium">@{userProfile.username}</p>}
                        {userProfile.bio && <p className="text-gray-300 text-sm mt-1 max-w-md line-clamp-2">{userProfile.bio}</p>}
                    </div>
                </div>
            </div>
        )}
      </div>

      <Header 
        onAddClick={handleAddClick} 
        userProfile={userProfile} 
        isGuest={isGuest} 
        isReadOnly={isReadOnly}
        onGuestLogin={resetToLogin}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Info Banners */}
        {isGuest && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3 flex items-center justify-center gap-2 text-yellow-500 text-sm">
             <AlertTriangle className="w-4 h-4" />
             Guest Mode: Prompts are saved on this device only.
          </div>
        )}

        {isReadOnly && (
            <div className="mb-6 bg-brand-accent/20 border border-brand-accent/40 rounded-xl p-3 flex items-center justify-center gap-2 text-brand-accent text-sm">
                <Users className="w-4 h-4" />
                Viewing Shared Profile.
                <button 
                    onClick={() => window.location.href = '/'}
                    className="ml-2 font-bold underline hover:text-white"
                >
                    Go to My Dump
                </button>
            </div>
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {loadingPrompts ? (
             <div className="text-center py-20 text-gray-500 animate-pulse">Loading dump...</div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-dark-card border border-dark-border p-6 rounded-full shadow-lg mb-6">
              <Layers className="w-12 h-12 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Empty Dump
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {isReadOnly ? "This user hasn't dumped anything yet." : "No prompts here yet. Dump your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        isReadOnly={isReadOnly}
      />

      <ProfileEditModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={userProfile}
      />

      <UserSearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

    </div>
  );
};

export default App;