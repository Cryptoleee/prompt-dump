import React, { useState } from 'react';
import { Sparkles, ArrowRight, Ghost } from 'lucide-react';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from '../firebase';

interface LoginScreenProps {
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestLogin }) => {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase Console.');
      } else {
        setError(`Could not sign in: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-accent/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-pink/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-brand-accent blur-xl opacity-40 rounded-full animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-brand-accent to-neon-pink p-4 rounded-2xl shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
          Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-neon-pink">Dump</span>
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Collect, organize, and sync your AI prompts across all your devices.
        </p>

        <button
          onClick={handleLogin}
          className="w-full group relative flex items-center justify-center gap-3 bg-white text-dark-bg font-bold py-4 rounded-2xl hover:scale-[1.02] transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] mb-4"
        >
          Sign in with Google
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </button>

        <button
          onClick={onGuestLogin}
          className="w-full flex items-center justify-center gap-2 text-gray-400 font-medium py-3 rounded-2xl hover:bg-white/5 transition-colors"
        >
          <Ghost className="w-4 h-4" />
          Continue as Guest
        </button>

        <p className="mt-6 text-xs text-gray-600 max-w-xs mx-auto">
          Guest mode stores data locally on your device. Clearing browser cache will delete guest data.
        </p>

        {error && (
          <p className="mt-6 text-red-400 text-sm bg-red-900/20 py-2 px-4 rounded-lg border border-red-900/50">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};