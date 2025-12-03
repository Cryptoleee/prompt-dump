import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, Loader2, Upload } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.photoURL || '');
      setBannerUrl(currentUser.bannerURL || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
    }

    try {
        setLoading(true);
        const fileName = `${auth.currentUser?.uid}_${type}_${Date.now()}`;
        const storageRef = ref(storage, `profiles/${fileName}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        if (type === 'avatar') setAvatarUrl(url);
        else setBannerUrl(url);
    } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload image.");
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    try {
        setLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        const profileData: UserProfile = {
            uid: auth.currentUser.uid,
            displayName,
            photoURL: avatarUrl,
            bannerURL: bannerUrl,
            username: username.replace('@', ''), // Strip @ if added by user
            bio
        };

        await setDoc(userRef, profileData, { merge: true });
        onClose();
    } catch (error) {
        console.error("Save failed", error);
        alert("Failed to update profile.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <form onSubmit={handleSave}>
            {/* Banner Preview & Edit */}
            <div className="relative h-32 bg-gray-800">
                {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-60" />}
                <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors border border-white/20"
                    title="Change Banner"
                >
                    <Camera className="w-4 h-4" />
                </button>
                <input ref={bannerInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
            </div>

            {/* Avatar & Content */}
            <div className="px-6 pb-6 -mt-10 relative">
                <div className="relative inline-block">
                    <img 
                        src={avatarUrl || 'https://via.placeholder.com/100'} 
                        alt="Avatar" 
                        className="w-20 h-20 rounded-full border-4 border-dark-card object-cover bg-dark-bg" 
                    />
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-brand-accent text-white rounded-full shadow-lg border border-dark-card hover:bg-brand-accent/80 transition-colors"
                        title="Change Avatar"
                    >
                        <Upload className="w-3 h-3" />
                    </button>
                    <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                </div>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-7 pr-3 py-2 text-white focus:ring-2 focus:ring-brand-accent focus:outline-none"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-brand-accent focus:outline-none h-20 resize-none"
                            placeholder="Tell us about your prompts..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl transition-colors font-bold text-sm shadow-lg shadow-brand-accent/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Profile
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};