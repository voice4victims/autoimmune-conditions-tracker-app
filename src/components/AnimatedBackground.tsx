import React from 'react';

const STARS = [
  [10, 14], [88, 20], [6, 80], [92, 70], [48, 7],
  [18, 90], [82, 88], [60, 45], [25, 55], [72, 12],
  [35, 82], [95, 42], [4, 35], [55, 92], [78, 58],
  [42, 22], [14, 62], [66, 76], [30, 8], [86, 50],
  [50, 68], [20, 42], [74, 30], [38, 52], [62, 15],
  [8, 50], [90, 85], [46, 38], [16, 75], [70, 62],
] as const;

const AnimatedBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto"
    style={{ background: 'linear-gradient(160deg, #0E1F6A 0%, #1a3585 50%, #0D4A72 100%)' }}
  >
    <style>{`
      @keyframes starTwinkle {
        0% { opacity: 0.15; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.15; transform: scale(0.8); }
      }
    `}</style>
    {STARS.map(([x, y], i) => {
      const size = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5;
      const warmth = i % 4 === 0;
      return (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            zIndex: 0,
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}px`,
            height: `${size}px`,
            background: warmth ? '#fff8e1' : '#ffffff',
            boxShadow: `0 0 ${size + 2}px ${size}px rgba(${warmth ? '255,248,225' : '200,220,255'},${size > 2 ? 0.3 : 0.15})`,
            animation: `starTwinkle ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      );
    })}
    <div className="relative z-10 flex flex-col items-center justify-center w-full">
      {children}
    </div>
  </div>
);

export default AnimatedBackground;
