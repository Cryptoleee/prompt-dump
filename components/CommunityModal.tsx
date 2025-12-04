
import React, { useState, useEffect } from 'react';
import { X, Search, Heart, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  followingIds: string[];
}

// UserListItem moved outside main component to prevent re-creation on every render
const UserListItem: React.FC<{ user: UserProfile; followingIds: string[] }> = ({ user, followingIds }) => (
    <a 
        href={`/?uid=${user.uid}`}
        className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-xl hover:bg-dark-bg transition-colors border border-transparent hover:border-brand-accent/30 group"
    >
        <div className="flex items-center gap-3">
            <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.username}`} 
                className="w-10 h-10 rounded-full object-cover border border-white/10"
                alt="Avatar" 
            />
            <div>
                <div className="text-white font-medium">@{user.username}</div>
            </div>
        </div>
        <div className="text-gray-500 group-hover:text-brand-accent transition-colors">
            {followingIds.includes(user.uid) ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
        </div>
    </a>
);

export const CommunityModal: React.FC<CommunityModalProps> = ({ isOpen, onClose, followingIds }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Following State
  const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Fetch Following list when tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'following' && followingIds.length > 0) {
      setFollowingLoading(true);
      const fetchFollowing = async () => {
        try {
          const promises = followingIds.map(uid => getDoc(doc(db, 'users', uid)));
          const snapshots = await Promise.all(promises);
          const users = snapshots
            .filter(snap => snap.exists())
            .map(snap => ({ uid: snap.id, ...snap.data() } as UserProfile));
          setFollowingUsers(users);
        } catch (e) {
          console.error(e);
        } finally {
          setFollowingLoading(false);
        }
      };
      fetchFollowing();
    } else if (activeTab === 'following' && followingIds.length === 0) {
        setFollowingUsers([]);
    }
  }, [isOpen, activeTab, followingIds]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef, 
            where('username', '>=', searchTerm.toLowerCase()),
            where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
            limit(5)
        );
        
        const snap = await getDocs(q);
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
        setSearchResults(users);
    } catch (err) {
        console.error(err);
    } finally {
        setSearchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-6 min-h-[500px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Community</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-dark-bg rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('discover')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'discover' ? 'bg-dark-card text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Discover
            </button>
            <button 
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'following' ? 'bg-dark-card text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Following <span className="ml-1 text-xs opacity-60">({followingIds.length})</span>
            </button>
        </div>

        {/* Discover Tab */}
        {activeTab === 'discover' && (
            <div className="flex-1 flex flex-col">
                <form onSubmit={handleSearch} className="relative mb-6">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-4 pr-12 text-white focus:border-brand-accent outline-none placeholder-gray-600"
                        placeholder="Search by username..."
                    />
                    <button type="submit" className="absolute right-2 top-2 p-1.5 bg-brand-accent rounded-lg text-white">
                        <Search className="w-4 h-4" />
                    </button>
                </form>

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {searchLoading && <div className="text-center text-gray-500 py-4">Searching...</div>}
                    
                    {searchResults.map(user => (
                        <UserListItem key={user.uid} user={user} followingIds={followingIds} />
                    ))}
                    
                    {!searchLoading && searchResults.length === 0 && searchTerm && (
                        <div className="text-center text-gray-500 mt-10">No users found.</div>
                    )}
                    {!searchLoading && searchResults.length === 0 && !searchTerm && (
                        <div className="text-center text-gray-600 mt-10 text-sm">
                            Search for creators to add to your feed.
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
            <div className="flex-1 flex flex-col">
                {followingLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
                    </div>
                ) : followingUsers.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                        <Heart className="w-12 h-12 mb-4 text-gray-700" />
                        <p>You aren't following anyone yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                        {followingUsers.map(user => (
                            <UserListItem key={user.uid} user={user} followingIds={followingIds} />
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
