
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create an Account' : 'Sign In'}</CardTitle>
        <CardDescription>{isSignUp ? 'Enter your details to get started.' : 'Access your PANDAS Tracker dashboard.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full">{isSignUp ? 'Sign Up' : 'Sign In'}</Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} className="w-full">Sign in with Google</Button>
        <Button variant="secondary" onClick={handleGuestSignIn} className="w-full">Sign in as Guest</Button>
        <p className="text-center text-sm">
          {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="p-0 h-auto">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Button>
        </p>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
