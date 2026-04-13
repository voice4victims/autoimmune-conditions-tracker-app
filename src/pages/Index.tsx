import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';

const Index: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AnimatedBackground>
        <style>{`
          @keyframes owlFloat {
            0% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
            100% { transform: translateY(0); }
          }
          @keyframes loadDot {
            from { opacity: 0.2; transform: scale(1); }
            to { opacity: 0.9; transform: scale(1.6); }
          }
        `}</style>
        <img
          src="/owl-mascot.png"
          alt="Loading..."
          className="object-contain mb-6"
          style={{
            width: '120px',
            height: '120px',
            filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(28,196,206,0.2))',
            animation: 'owlFloat 3.2s ease-in-out infinite',
          }}
        />
        <p className="font-sans font-extrabold text-[10px] tracking-[0.22em] uppercase mb-2"
          style={{ color: 'rgba(91,210,220,0.75)' }}>
          SPM HealthTech
        </p>
        <p className="font-serif text-xl text-white mb-8">PANDAS Tracker</p>
        <div className="flex gap-[7px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: '7px',
                height: '7px',
                background: '#1BC4CE',
                animation: `loadDot ${0.55 + i * 0.15}s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </AnimatedBackground>
    );
  }

  if (!user) {
    return (
      <AnimatedBackground>
        <div className="py-10 w-full">
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </AnimatedBackground>
    );
  }

  return <AppLayout />;
};

export default Index;
