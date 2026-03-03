import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState<'scale-in' | 'content' | 'fade-out'>('scale-in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('content'), 800);
    const t2 = setTimeout(() => setPhase('fade-out'), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 transition-opacity duration-500 ${
        phase === 'fade-out' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`transition-transform duration-700 ease-out ${
          phase === 'scale-in' ? 'scale-0' : 'scale-100'
        }`}
      >
        <img
          src="/esther-owl.png"
          alt="Esther the Owl"
          className="w-32 h-32 drop-shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      <div
        className={`mt-6 text-center transition-all duration-500 ${
          phase === 'content' || phase === 'fade-out'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl font-bold text-white mb-2">PANDAS Tracker</h1>
        <p className="text-white/80 text-sm">Empowering families through tracking</p>
      </div>
    </div>
  );
};

export default SplashScreen;
