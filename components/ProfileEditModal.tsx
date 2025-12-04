import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Image as ImageIcon, AtSign } from 'lucide-react';
import { UserProfile } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { ImageCropper } from './ImageCropper';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, bannerUrl: string, avatarUrl: string, displayName: string) => Promise<void>;
  currentProfile: UserProfile;
  isOnboarding?: boolean;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentProfile,
  isOnboarding = false
}) => {
  const [username, setUsername] = useState(currentProfile.username || '');
  const [bannerUrl, setBannerUrl] = useState(currentProfile.bannerURL || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.photoURL || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  // Cropper State
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'banner' | 'avatar' | null>(null);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        setCroppingImage(reader.result as string);
        setCropType(type);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!cropType) return;
    
    try {
        setCroppingImage(null); // Close cropper
        setIsUploading(true);
        setUploadStatus('Uploading...');

        const path = `users/${currentProfile.uid}/${cropType}_${Date.now()}`;
        const storageRef = ref(storage, path);
        
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        
        if (cropType === 'banner') setBannerUrl(url);
        else setAvatarUrl(url);
        
    } catch (err) {
        console.error(err);
        alert("Upload failed. Please try again.");
    } finally {
        setIsUploading(false);
        setUploadStatus('');
        setCropType(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
        setError("Username is required.");
        return;
    }
    
    try {
        // Enforce anonymity: Display Name is set to Username
        await onSave(username, bannerUrl, avatarUrl, username);
        if (!isOnboarding) onClose();
    } catch (err) {
        console.error(err);
        setError("Failed to save profile. Please try again.");
    }
  };

  if (croppingImage && cropType) {
      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90">
             <div className="w-full max-w-2xl bg-dark-card border border-dark-border rounded-2xl p-6">
                <ImageCropper 
                    imageSrc={croppingImage} 
                    aspectRatio={cropType === 'banner' ? 16 / 9 : 1}
                    onCrop={handleCropComplete}
                    onCancel={() => { setCroppingImage(null); setCropType(null); }}
                />
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={() => !isOnboarding && onClose()} 
      />
      <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
                {isOnboarding ? 'Create your Identity' : 'Edit Profile'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
                {isOnboarding ? "Choose a username to stay anonymous." : "Update your public profile."}
            </p>
          </div>
          {!isOnboarding && (
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Profile Banner</label>
            <div 
              className="relative h-32 rounded-xl bg-dark-bg border-2 border-dashed border-dark-border flex items-center justify-center overflow-hidden group cursor-pointer"
              onClick={() => !isUploading && document.getElementById('bannerInput')?.click()}
            >
              {bannerUrl ? (
                <img src={bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="Banner" />
              ) : (
                <div className="text-center p-4">
                    <ImageIcon className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Tap to upload banner</span>
                </div>
              )}
              
              {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-xs text-brand-accent font-medium">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      {uploadStatus}
                  </div>
              )}

              <input type="file" id="bannerInput" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'banner')} disabled={isUploading} />
            </div>
          </div>

           {/* Avatar Upload */}
           <div className="flex items-center gap-4">
             <div 
                className="relative w-16 h-16 rounded-full bg-dark-bg border border-dark-border overflow-hidden cursor-pointer group"
                onClick={() => !isUploading && document.getElementById('avatarInput')?.click()}
             >
                 {avatarUrl ? (
                     <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center bg-brand-accent/10 text-brand-accent">
                         <ImageIcon className="w-6 h-6" />
                     </div>
                 )}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                     <ImageIcon className="w-4 h-4 text-white" />
                 </div>
                 <input type="file" id="avatarInput" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'avatar')} disabled={isUploading} />
             </div>
             <div className="text-sm text-gray-500">
                 <p className="font-medium text-gray-300">Profile Picture</p>
                 <p className="text-xs">Tap to change</p>
             </div>
           </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Username (Required)</label>
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
                    required
                />
            </div>
            <p className="text-xs text-gray-600">This will be your unique identity. Real names are hidden.</p>
          </div>
            
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-brand-accent text-white font-bold py-3 rounded-xl hover:bg-brand-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
            {isOnboarding ? 'Start Dumping' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};