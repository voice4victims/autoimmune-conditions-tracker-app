import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import AppLayout from '@/components/AppLayout';

const Index: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0E1F6A 0%, #1a3585 50%, #0D4A72 100%)' }}
      >
        <img
          src="/owl-mascot.png"
          alt="Loading..."
          className="w-16 h-16 object-contain mb-4 animate-pulse"
          style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }}
        />
        <p className="font-sans text-[13px] text-white/50">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #0E1F6A 0%, #1a3585 50%, #0D4A72 100%)' }}
      >
        <div className="py-10 w-full">
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </div>
    );
  }

  return <AppLayout />;
};

export default Index;
