import React, { useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
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
    try {
        const usersRef = collection(db, 'users');
        // Simple prefix search on username
        const q = query(
            usersRef, 
            where('username', '>=', searchTerm.toLowerCase()),
            where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
            limit(5)
        );
        
        const snap = await getDocs(q);
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
        setResults(users);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Find People</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-4 pr-12 text-white focus:border-brand-accent outline-none"
                placeholder="Search by username..."
            />
            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-brand-accent rounded-lg text-white">
                <Search className="w-4 h-4" />
            </button>
        </form>

        <div className="space-y-3">
            {loading && <div className="text-center text-gray-500 py-4">Searching...</div>}
            
            {results.map(user => (
                <a 
                    key={user.uid}
                    href={`/?uid=${user.uid}`}
                    className="flex items-center gap-3 p-3 bg-dark-bg/50 rounded-xl hover:bg-dark-bg transition-colors border border-transparent hover:border-brand-accent/30"
                >
                    <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                        className="w-10 h-10 rounded-full object-cover"
                        alt={user.displayName} 
                    />
                    <div>
                        <div className="text-white font-medium">{user.displayName}</div>
                        {user.username && <div className="text-xs text-brand-accent">@{user.username}</div>}
                    </div>
                </a>
            ))}
            
            {!loading && results.length === 0 && searchTerm && (
                <div className="text-center text-gray-500 mt-10">No users found.</div>
            )}
        </div>
      </div>
    </div>
  );
};