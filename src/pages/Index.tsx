import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import AppLayout from '@/components/AppLayout';
import SplashScreen from '@/components/SplashScreen';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashShown'));

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('splashShown', '1');
    setShowSplash(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        {showSplash && <SplashScreen onDone={handleSplashDone} />}
        <AuthForm onAuthSuccess={() => {}} />
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <AppLayout />
    </>
  );
};

export default Index;