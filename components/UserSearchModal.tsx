import React, { useState } from 'react';
import { X, Search, User as UserIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { UserProfile } from '../types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setResults([]);

    try {
        const usersRef = collection(db, 'users');
        // Simple search by username (in a real app, use Algolia/Typesense for better search)
        // Here we just check if it exactly matches or we can just fetch some users
        // Since Firestore doesn't do "contains" natively effectively without external tools,
        // we'll try to find by exact username OR get latest users.
        
        // Strategy: Get a batch of users and filter client side for this demo
        // (Not efficient for millions of users, but fine for personal/small scale)
        const q = query(usersRef, limit(20)); 
        const snapshot = await getDocs(q);
        
        const matched = snapshot.docs
            .map(d => d.data() as UserProfile)
            .filter(u => 
                (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
        setResults(matched);

    } catch (error) {
        console.error("Search error", error);
    } finally {
        setLoading(false);
    }
  };

  const goToProfile = (uid: string) => {
    window.location.href = `/?uid=${uid}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-white">Find Dumpers</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-brand-accent focus:outline-none"
                    placeholder="Search username..."
                    autoFocus
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {loading && <div className="text-center text-gray-500 py-4">Searching...</div>}
                {!loading && results.length === 0 && searchTerm && (
                    <div className="text-center text-gray-500 py-4">No users found.</div>
                )}
                
                {results.map(user => (
                    <div 
                        key={user.uid}
                        onClick={() => goToProfile(user.uid)}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5"
                    >
                        <img 
                            src={user.photoURL || 'https://via.placeholder.com/50'} 
                            alt={user.displayName} 
                            className="w-10 h-10 rounded-full bg-dark-bg object-cover"
                        />
                        <div>
                            <div className="font-bold text-white text-sm">{user.displayName}</div>
                            {user.username && <div className="text-xs text-brand-accent">@{user.username}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};