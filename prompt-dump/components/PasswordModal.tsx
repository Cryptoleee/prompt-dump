import React, { useState } from 'react';
import { Lock, X, ChevronRight } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'dikkeluldriebier') {
      onSuccess();
      setPassword('');
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mb-4 border border-brand-accent/30">
            <Lock className="w-8 h-8 text-brand-accent" />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-white mb-2">Restricted Area</h2>
          <p className="text-gray-400 text-sm mb-6">Enter the secret key to edit this dump.</p>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`block w-full px-4 py-3 bg-dark-bg border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all text-center tracking-widest ${error ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:ring-brand-accent'}`}
              placeholder="••••••••••••"
            />
            
            <button
              type="submit"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-dark-bg font-bold py-3 rounded-xl hover:bg-brand-accent hover:text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              Unlock <ChevronRight className="w-4 h-4" />
            </button>
          </form>
          
          {error && (
            <p className="mt-3 text-red-400 text-xs font-medium animate-pulse">
              Wrong password. Nice try!
            </p>
          )}

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};