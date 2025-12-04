
import React, { useEffect, useState } from 'react';
import { X, Heart, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  followingIds: string[];
}

export const FollowingModal: React.FC<FollowingModalProps> = ({ isOpen, onClose, followingIds }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && followingIds.length > 0) {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          // Fetch profiles in parallel
          const promises = followingIds.map(uid => getDoc(doc(db, 'users', uid)));
          const snapshots = await Promise.all(promises);
          
          const fetchedUsers: UserProfile[] = snapshots
            .filter(snap => snap.exists())
            .map(snap => ({ uid: snap.id, ...snap.data() } as UserProfile));
            
          setUsers(fetchedUsers);
        } catch (e) {
          console.error("Error fetching following list", e);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    } else {
        setUsers([]);
    }
  }, [isOpen, followingIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-brand-accent fill-brand-accent" />
            <h2 className="text-xl font-bold text-white">Following</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
           <div className="flex justify-center py-10">
               <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
           </div>
        ) : users.length === 0 ? (
           <div className="text-center text-gray-500 py-10">
               You aren't following anyone yet. <br/> Search for users to follow!
           </div>
        ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {users.map(user => (
                    <a 
                        key={user.uid}
                        href={`/?uid=${user.uid}`}
                        className="flex items-center gap-3 p-3 bg-dark-bg/50 rounded-xl hover:bg-dark-bg transition-colors border border-transparent hover:border-brand-accent/30"
                    >
                        <img 
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.username}`} 
                            className="w-10 h-10 rounded-full object-cover"
                            alt="Avatar" 
                        />
                        <div>
                            <div className="text-white font-medium">@{user.username}</div>
                            {user.displayName && user.displayName !== user.username && (
                                <div className="text-xs text-gray-500 hidden">{user.displayName}</div>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
