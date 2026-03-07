import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

const AuthForm: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const { signInAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    try {
      await signInAsGuest();
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <div className="text-center mb-8">
        <img
          src="/owl-mascot.png"
          alt="PANDAS Tracker"
          className="w-20 h-20 mx-auto mb-4 object-contain"
          style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))' }}
        />
        <p
          className="font-sans font-extrabold text-[10px] tracking-[0.18em] uppercase mb-1"
          style={{ color: 'rgba(91,210,220,0.85)' }}
        >
          SPM HealthTech
        </p>
        <h1 className="font-serif text-[28px] text-white mb-1 leading-tight">PANDAS Tracker</h1>
        <p className="font-sans text-[13px] text-white/50">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-3">
            <p className="font-sans text-[12px] text-danger-500 m-0">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailPasswordAuth} className="space-y-3">
          <div>
            <Label className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className="w-full font-sans font-bold"
            style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 font-sans text-[11px] text-neutral-400 uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer font-sans font-bold text-[13px] text-neutral-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
          <button
            onClick={handleAppleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer font-sans font-bold text-[13px] text-neutral-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </button>
        </div>

        <button
          onClick={handleGuestSignIn}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 cursor-pointer font-sans font-bold text-[13px] text-neutral-500 transition-colors border-none"
        >
          Continue as Guest
        </button>

        <p className="text-center font-sans text-[13px] text-neutral-500 pt-1">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-primary-500 bg-transparent border-none cursor-pointer p-0"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
