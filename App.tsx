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
import { Layers, Ghost, AlertTriangle } from 'lucide-react';
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
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // Data State
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  // Profile State
  const [viewingUid, setViewingUid] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | undefined>(undefined);

  // 1. Check URL for Shared Profile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUid = params.get('uid');
    if (sharedUid) {
      setViewingUid(sharedUid);
    }
  }, []);

  // 2. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !viewingUid) {
         setViewingUid(currentUser.uid);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [viewingUid]);

  // 3. Fetch User Profile (Banner/Username)
  useEffect(() => {
    if (!viewingUid || isGuest) {
        if (isGuest) {
            setUserProfile({
                uid: 'guest',
                displayName: 'Guest',
                username: 'guest',
                bannerURL: DEFAULT_BANNER
            });
        }
        return;
    }

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, 'users', viewingUid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                setUserProfile(data);
                
                // FORCE ONBOARDING: If this is the logged-in user and they don't have a username yet
                if (user && user.uid === viewingUid && !data.username) {
                    setIsOnboarding(true);
                    setProfileModalOpen(true);
                }
            } else if (user && user.uid === viewingUid) {
                // First time user, no profile doc exists
                const newProfile = {
                    uid: user.uid,
                    displayName: 'Anonymous', // Default to anonymous
                    username: '', // Empty triggers onboarding
                    photoURL: user.photoURL || '',
                    bannerURL: DEFAULT_BANNER
                };
                setUserProfile(newProfile);
                setIsOnboarding(true);
                setProfileModalOpen(true);
            } else {
                // Viewing unknown user
                setUserProfile({
                    uid: viewingUid,
                    displayName: 'Anonymous User',
                    username: 'unknown',
                    bannerURL: DEFAULT_BANNER
                });
            }
        } catch (e) {
            console.error("Profile fetch error", e);
        }
    };
    fetchProfile();
  }, [viewingUid, user, isGuest]);


  // 4. Data Sync Listener
  useEffect(() => {
    // A. Guest Mode: Load from LocalStorage
    if (isGuest) {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (stored) {
        setPrompts(JSON.parse(stored));
      }
      setLoadingPrompts(false);
      return;
    }

    // B. Cloud Mode: Load from Firestore
    if (!viewingUid) return;

    setLoadingPrompts(true);
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', viewingUid)
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
  }, [viewingUid, isGuest]);


  // --- Actions ---

  const handleSavePrompt = async (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: Category; mood: string }
  ) => {
    const newEntry = {
        text,
        sourceUrl,
        imageUrl,
        tags: analysis.tags,
        category: analysis.category,
        mood: analysis.mood,
        createdAt: Date.now(),
        userId: user?.uid || 'guest'
    };

    if (isGuest) {
        // Local Save
        const newPrompts = editingPrompt 
            ? prompts.map(p => p.id === editingPrompt.id ? { ...newEntry, id: p.id } : p)
            : [{ ...newEntry, id: Date.now().toString() }, ...prompts];
        
        setPrompts(newPrompts);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newPrompts));
    } else if (user) {
        // Cloud Save
        try {
            if (editingPrompt) {
                const promptRef = doc(db, 'prompts', editingPrompt.id);
                await updateDoc(promptRef, newEntry);
            } else {
                await addDoc(collection(db, 'prompts'), newEntry);
            }
        } catch (e) {
            alert("Save failed. Check connection.");
        }
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if(!window.confirm('Delete this prompt?')) return;

    if (isGuest) {
        const newPrompts = prompts.filter(p => p.id !== id);
        setPrompts(newPrompts);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newPrompts));
        setDetailModalOpen(false);
    } else {
        try {
            await deleteDoc(doc(db, 'prompts', id));
            setDetailModalOpen(false);
        } catch (e) {
            console.error(e);
        }
    }
  };

  const handleUpdateProfile = async (username: string, bannerUrl: string, avatarUrl: string, displayName: string) => {
    if (!user) return;
    try {
        const newData: UserProfile = {
            uid: user.uid,
            displayName: displayName, // Will be same as username for anonymity
            username,
            bannerURL: bannerUrl,
            photoURL: avatarUrl
        };
        await setDoc(doc(db, 'users', user.uid), newData, { merge: true });
        setUserProfile(prev => ({ ...prev, ...newData }));
        setIsOnboarding(false); // End onboarding if active
    } catch (e) {
        console.error(e);
        alert("Failed to update profile");
    }
  };

  // --- Modals ---

  const openEdit = (prompt: PromptEntry) => {
    setEditingPrompt(prompt);
    setDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const openDetail = (prompt: PromptEntry) => {
    setSelectedPrompt(prompt);
    setDetailModalOpen(true);
  }

  // Loading Screen
  if (!authChecked) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-brand-accent animate-pulse">Loading Dump...</div>;
  }

  // Not Logged In & Not Guest & Not Viewing -> Login Screen
  if (!user && !isGuest && !viewingUid) {
    return <LoginScreen onGuestLogin={() => setIsGuest(true)} />;
  }

  const isReadOnly = !isGuest && user?.uid !== viewingUid;
  const showGuestBanner = isGuest;
  const showSharedBanner = isReadOnly && userProfile;

  // Filtering
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
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg z-10" />
        <img 
            src={userProfile?.bannerURL || DEFAULT_BANNER} 
            className="w-full h-full object-cover opacity-60"
            alt="Banner"
        />
        <div className="absolute bottom-0 left-0 w-full z-20 p-6 flex items-end">
             <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-end gap-4">
                <img 
                    src={userProfile?.photoURL || (user?.photoURL) || `https://ui-avatars.com/api/?name=${userProfile?.username || 'user'}`} 
                    className="w-20 h-20 rounded-full border-4 border-dark-bg shadow-xl object-cover"
                />
                <div className="mb-2">
                    {/* Anonymity Logic: ONLY show Username. Fallback to 'Anonymous' if loading */}
                    <h1 className="text-3xl font-bold text-white font-display shadow-black drop-shadow-lg">
                        {userProfile?.username ? `@${userProfile.username}` : (isOnboarding ? 'Welcome' : '@anonymous')}
                    </h1>
                </div>
             </div>
        </div>
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-dark-bg -z-10">
          <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-[100px]" />
      </div>

      <Header 
        onAddClick={() => { setEditingPrompt(undefined); setIsModalOpen(true); }} 
        user={user} 
        isGuest={isGuest}
        userProfile={userProfile}
        isReadOnly={isReadOnly}
        onEditProfile={() => setProfileModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-20px]">
        
        {/* Guest Warning */}
        {showGuestBanner && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl flex items-center gap-3 text-yellow-200/80 text-sm">
                <Ghost className="w-5 h-5" />
                <span>Guest Mode: Prompts are saved to this device only. Log in to sync to cloud.</span>
            </div>
        )}

        {/* Read Only Warning */}
        {showSharedBanner && (
            <div className="mb-6 bg-brand-accent/10 border border-brand-accent/30 p-4 rounded-xl flex items-center gap-3 text-brand-accent text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Viewing Shared Profile. Read-only mode active.</span>
            </div>
        )}

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {loadingPrompts ? (
             <div className="text-center py-20 text-gray-500 animate-pulse">Syncing...</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} onClick={() => openDetail(prompt)} className="cursor-pointer h-full">
                <PromptCard 
                    prompt={prompt} 
                    onDelete={() => {}} 
                    onEdit={() => {}} 
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <AddPromptForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPrompt(undefined); }}
        onSubmit={handleSavePrompt}
        initialData={editingPrompt}
      />

      {selectedPrompt && (
        <PromptDetailModal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            prompt={selectedPrompt}
            onDelete={handleDeletePrompt}
            onEdit={openEdit}
            isReadOnly={isReadOnly}
        />
      )}

      {userProfile && (
        <ProfileEditModal
            isOpen={profileModalOpen}
            onClose={() => !isOnboarding && setProfileModalOpen(false)}
            onSave={handleUpdateProfile}
            currentProfile={userProfile}
            isOnboarding={isOnboarding}
        />
      )}

      <UserSearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

    </div>
  );
};

export default App;