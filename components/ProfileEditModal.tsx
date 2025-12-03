import React, { useState } from 'react';
import { X, Save, Upload, Loader2, Image as ImageIcon, AtSign } from 'lucide-react';
import { UserProfile } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, bannerUrl: string, avatarUrl: string) => Promise<void>;
  currentProfile: UserProfile;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, onSave, currentProfile }) => {
  const [username, setUsername] = useState(currentProfile.username || '');
  const [bannerUrl, setBannerUrl] = useState(currentProfile.bannerURL || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.photoURL || '');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const path = `users/${currentProfile.uid}/${type}_${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (type === 'banner') setBannerUrl(url);
      else setAvatarUrl(url);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(username, bannerUrl, avatarUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Profile Banner</label>
            <div 
              className="relative h-32 rounded-xl bg-dark-bg border-2 border-dashed border-dark-border flex items-center justify-center overflow-hidden group cursor-pointer"
              onClick={() => document.getElementById('bannerInput')?.click()}
            >
              {bannerUrl ? (
                <img src={bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="Banner" />
              ) : (
                <div className="text-center p-4">
                    <ImageIcon className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Tap to upload banner</span>
                </div>
              )}
              <input type="file" id="bannerInput" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Username</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-4 w-4 text-gray-500" />
                </div>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-accent outline-none"
                    placeholder="username"
                    maxLength={20}
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-brand-accent text-white font-bold py-3 rounded-xl hover:bg-brand-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};