import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

const AMBIENT_DOTS = [
  [10, 14], [88, 20], [6, 80], [92, 70],
  [48, 7], [18, 90], [82, 88], [60, 45], [25, 55],
] as const;

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'linear-gradient(160deg, #0E1F6A 0%, #1a3585 50%, #0D4A72 100%)',
        opacity: phase === 2 ? 0 : 1,
        pointerEvents: phase === 2 ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes owlFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0); }
        }
        @keyframes splashDot {
          from { opacity: 0.2; transform: scale(1); }
          to { opacity: 0.9; transform: scale(1.6); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient circuit dots */}
      {AMBIENT_DOTS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: i % 3 === 0 ? '9px' : '5px',
            height: i % 3 === 0 ? '9px' : '5px',
            background: 'rgba(28,196,206,0.3)',
            animation: `splashDot ${1.0 + i * 0.18}s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}

      {/* Owl mascot */}
      <div
        style={{
          transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
          transform: phase === 0 ? 'scale(0.45) translateY(40px)' : 'scale(1) translateY(0)',
          opacity: phase === 0 ? 0 : 1,
          animation: phase === 1 ? 'owlFloat 3.2s ease-in-out infinite' : 'none',
          marginBottom: '24px',
        }}
      >
        <img
          src="/owl-mascot.png"
          alt="Esther the Owl - SPM HealthTech"
          className="object-contain"
          style={{
            width: '195px',
            height: '195px',
            filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(28,196,206,0.2))',
          }}
        />
      </div>

      {/* Brand lockup */}
      <div
        className="text-center"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s ease 0.1s',
        }}
      >
        <p className="font-sans font-extrabold text-[10px] tracking-[0.22em] uppercase mb-[7px]"
          style={{ color: 'rgba(91,210,220,0.75)' }}>
          SPM HealthTech
        </p>
        <h1 className="font-serif text-[28px] text-white mb-[9px] leading-tight font-normal">
          PANDAS Tracker
        </h1>
        <p className="font-sans text-xs tracking-[0.02em]"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          Protecting Families. Empowering Health.
        </p>
      </div>

      {/* Animated loading dots */}
      <div
        className="flex gap-[7px] mt-11"
        style={{
          opacity: phase >= 1 ? 0.7 : 0,
          transition: 'opacity 0.4s ease 0.3s',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: '7px',
              height: '7px',
              background: '#1BC4CE',
              animation: `splashDot ${0.55 + i * 0.15}s ease-in-out ${i * 0.15}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
