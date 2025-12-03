import React, { useState } from 'react';
import { Sparkles, ArrowRight, Ghost } from 'lucide-react';
import { signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from '../firebase';

interface LoginScreenProps {
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestLogin }) => {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Could not sign in. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
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

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full group relative flex items-center justify-center gap-3 bg-white text-dark-bg font-bold py-4 rounded-2xl hover:scale-[1.02] transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>

          <button
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-2 text-gray-500 font-medium py-3 rounded-2xl hover:text-white hover:bg-white/5 transition-all"
          >
            <Ghost className="w-4 h-4" />
            Continue as Guest
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 max-w-xs mx-auto">
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