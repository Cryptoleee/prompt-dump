
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PromptCard } from './components/PromptCard';
import { AddPromptForm } from './components/AddPromptForm';
import { LoginScreen } from './components/LoginScreen';
import { PromptDetailModal } from './components/PromptDetailModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { CommunityModal } from './components/CommunityModal';
import { PromptEntry, UserProfile, GUEST_USER_ID } from './types';
import { GUEST_STORAGE_KEY, DEFAULT_BANNER } from './constants';
import { Layers, Ghost, AlertTriangle, UserPlus, UserCheck, Heart } from 'lucide-react';
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
  setDoc,
  arrayUnion,
  arrayRemove
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
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>(undefined);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
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

  // 3. Fetch User Profile
  useEffect(() => {
    // A. Fetch Current User Profile (for Following list, Likes etc)
    if (user && !isGuest) {
        const fetchCurrentUser = async () => {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            if(snap.exists()) {
                setCurrentUserProfile(snap.data() as UserProfile);
            }
        };
        fetchCurrentUser();
    }

    // B. Fetch Viewing Profile (The banner/prompts we see)
    if (!viewingUid || isGuest) {
        if (isGuest) {
            setUserProfile({
                uid: GUEST_USER_ID,
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
                
                // FORCE ONBOARDING
                if (user && user.uid === viewingUid && !data.username) {
                    setIsOnboarding(true);
                    setProfileModalOpen(true);
                }
            } else if (user && user.uid === viewingUid) {
                // First time user, no profile doc exists
                const newProfile = {
                    uid: user.uid,
                    displayName: 'Anonymous', 
                    username: '', // Empty triggers onboarding
                    photoURL: user.photoURL || '',
                    bannerURL: DEFAULT_BANNER,
                    following: [],
                    likedPrompts: []
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
    if (isGuest) {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (stored) {
        const guestPrompts = JSON.parse(stored);
        if (selectedCategory === 'Favorites') {
           setPrompts([]); 
        } else {
           setPrompts(guestPrompts);
        }
      }
      setLoadingPrompts(false);
      return;
    }

    setLoadingPrompts(true);

    // SPECIAL CASE: FAVORITES TAB
    if (selectedCategory === 'Favorites') {
        if (!currentUserProfile?.likedPrompts || currentUserProfile.likedPrompts.length === 0) {
            setPrompts([]);
            setLoadingPrompts(false);
            return;
        }

        const fetchLiked = async () => {
            try {
                const promises = currentUserProfile.likedPrompts!.map(id => getDoc(doc(db, 'prompts', id)));
                const snaps = await Promise.all(promises);
                const liked = snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() } as PromptEntry));
                setPrompts(liked);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingPrompts(false);
            }
        };
        fetchLiked();
        return;
    }

    // NORMAL CASE: VIEWING USER PROFILE
    if (!viewingUid) return;

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
  }, [viewingUid, isGuest, selectedCategory, currentUserProfile?.likedPrompts]);


  // --- Actions ---

  const handleSavePrompt = async (
    text: string,
    sourceUrl: string,
    imageUrl: string,
    analysis: { tags: string[]; category: string; mood: string }
  ) => {
    const newEntry = {
        text,
        sourceUrl,
        imageUrl,
        tags: analysis.tags,
        category: analysis.category,
        mood: analysis.mood,
        createdAt: Date.now(),
        userId: user?.uid || GUEST_USER_ID
    };

    if (isGuest) {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY);
        const currentPrompts = stored ? JSON.parse(stored) : [];
        const newPrompts = editingPrompt 
            ? currentPrompts.map((p: PromptEntry) => p.id === editingPrompt.id ? { ...newEntry, id: p.id } : p)
            : [{ ...newEntry, id: Date.now().toString() }, ...currentPrompts];
        
        setPrompts(newPrompts);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newPrompts));
    } else if (user) {
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

  const handleUpdateProfile = async (username: string, bannerUrl: string, avatarUrl: string, displayName: string, bannerSourceUrl: string) => {
    if (!user) return;
    try {
        const newData: Partial<UserProfile> = {
            displayName: displayName, // Set to username for anonymity
            username,
            bannerURL: bannerUrl,
            bannerSourceURL: bannerSourceUrl,
            photoURL: avatarUrl
        };
        await setDoc(doc(db, 'users', user.uid), newData, { merge: true });
        setUserProfile(prev => prev ? ({ ...prev, ...newData } as UserProfile) : undefined);
        setIsOnboarding(false);
    } catch (e) {
        console.error(e);
        alert("Failed to update profile");
    }
  };
  
  const handleFollowToggle = async () => {
    if (!user || !viewingUid || user.uid === viewingUid) return;
    
    try {
        const userRef = doc(db, 'users', user.uid);
        const isFollowing = currentUserProfile?.following?.includes(viewingUid);
        
        if (isFollowing) {
            await updateDoc(userRef, {
                following: arrayRemove(viewingUid)
            });
            setCurrentUserProfile(prev => prev ? ({ ...prev, following: prev.following?.filter(id => id !== viewingUid) }) : undefined);
        } else {
            await updateDoc(userRef, {
                following: arrayUnion(viewingUid)
            });
            setCurrentUserProfile(prev => prev ? ({ ...prev, following: [...(prev.following || []), viewingUid] }) : undefined);
        }
    } catch (e) {
        console.error("Follow error", e);
    }
  };

  const handleLikeToggle = async (promptId: string) => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const isLiked = currentUserProfile?.likedPrompts?.includes(promptId);

        if (isLiked) {
             await updateDoc(userRef, {
                likedPrompts: arrayRemove(promptId)
            });
            setCurrentUserProfile(prev => prev ? ({ ...prev, likedPrompts: prev.likedPrompts?.filter(id => id !== promptId) }) : undefined);
        } else {
             await updateDoc(userRef, {
                likedPrompts: arrayUnion(promptId)
            });
            setCurrentUserProfile(prev => prev ? ({ ...prev, likedPrompts: [...(prev.likedPrompts || []), promptId] }) : undefined);
        }
      } catch (e) {
          console.error("Like error", e);
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

  if (!user && !isGuest && !viewingUid) {
    return <LoginScreen onGuestLogin={() => setIsGuest(true)} />;
  }

  const isReadOnly = !isGuest && user?.uid !== viewingUid;
  const showGuestBanner = isGuest;
  const showSharedBanner = isReadOnly && userProfile;
  const isFollowing = currentUserProfile?.following?.includes(viewingUid || '');
  
  // Filtering
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory =
      selectedCategory === 'All' || selectedCategory === 'Favorites' || p.category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-200">
      
      {/* Dynamic Profile Banner - Hide if viewing Favorites */}
      {selectedCategory !== 'Favorites' && (
        <div className="relative h-64 w-full overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg z-10" />
            <img 
                src={userProfile?.bannerURL || DEFAULT_BANNER} 
                className="w-full h-full object-cover opacity-60"
                alt="Banner"
            />
            <div className="absolute bottom-0 left-0 w-full z-20 p-6 flex items-end justify-between">
                <div className="max-w-7xl mx-auto w-full flex items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                        <img 
                            src={userProfile?.photoURL || (user?.photoURL) || `https://ui-avatars.com/api/?name=${userProfile?.username || 'user'}`} 
                            className="w-20 h-20 rounded-full border-4 border-dark-bg shadow-xl object-cover"
                        />
                        <div className="mb-2">
                            <h1 className="text-3xl font-bold text-white font-display shadow-black drop-shadow-lg">
                                {userProfile?.username ? `@${userProfile.username}` : (isOnboarding ? 'Welcome' : '@anonymous')}
                            </h1>
                            <div className="flex gap-4 mt-1 text-sm text-gray-400 font-medium">
                                <span>{prompts.length} Dumps</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Follow Button */}
                    {isReadOnly && user && !isGuest && (
                        <button 
                            onClick={handleFollowToggle}
                            className={`mb-3 px-5 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${
                                isFollowing 
                                ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 border border-white/10' 
                                : 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-lg'
                            }`}
                        >
                            {isFollowing ? (
                                <>
                                    <UserCheck className="w-4 h-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Follow
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {selectedCategory === 'Favorites' && (
           <div className="relative h-40 w-full bg-dark-bg border-b border-dark-border mb-8">
               <div className="max-w-7xl mx-auto h-full flex items-center px-6">
                   <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
                       <Heart className="w-8 h-8 fill-neon-pink text-neon-pink" />
                       My Favorites
                   </h1>
               </div>
           </div>
      )}

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-dark-bg -z-10">
          <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-[100px]" />
      </div>

      <Header 
        onAddClick={() => { setEditingPrompt(undefined); setIsModalOpen(true); }} 
        user={user} 
        isGuest={isGuest}
        userProfile={currentUserProfile}
        isReadOnly={isReadOnly}
        onEditProfile={() => setProfileModalOpen(true)}
        onOpenCommunity={() => setCommunityModalOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-20px]">
        
        {showGuestBanner && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl flex items-center gap-3 text-yellow-200/80 text-sm">
                <Ghost className="w-5 h-5" />
                <span>Guest Mode: Prompts are saved to this device only. Log in to sync to cloud.</span>
            </div>
        )}

        {showSharedBanner && selectedCategory !== 'Favorites' && (
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
             <div className="text-center py-20 text-gray-500 animate-pulse">Loading Dumps...</div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-dark-card border border-dark-border p-6 rounded-full shadow-lg mb-6">
              <Layers className="w-12 h-12 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Empty Dump
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {selectedCategory === 'Favorites' 
                ? "You haven't liked any prompts yet." 
                : isReadOnly 
                    ? "This user hasn't dumped anything yet." 
                    : "No prompts here yet. Dump your first one!"}
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
                    isLiked={currentUserProfile?.likedPrompts?.includes(prompt.id)}
                    onLike={handleLikeToggle}
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
            isLiked={currentUserProfile?.likedPrompts?.includes(selectedPrompt.id)}
            onLike={handleLikeToggle}
        />
      )}

      {currentUserProfile && (
        <ProfileEditModal
            isOpen={profileModalOpen}
            onClose={() => !isOnboarding && setProfileModalOpen(false)}
            onSave={handleUpdateProfile}
            currentProfile={currentUserProfile}
            isOnboarding={isOnboarding}
        />
      )}

      {currentUserProfile && (
          <CommunityModal
             isOpen={communityModalOpen}
             onClose={() => setCommunityModalOpen(false)}
             followingIds={currentUserProfile.following || []}
          />
      )}

    </div>
  );
};

export default App;
