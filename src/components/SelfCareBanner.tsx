import React, { useState, useEffect } from 'react';

const SelfCareBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('selfCareBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('selfCareBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      className="border-b px-4 py-2.5 flex gap-2.5 items-center shrink-0 bg-[#FFF0F7] dark:bg-[#2D1525] border-[#F9C6DF] dark:border-[#4A2040]"
    >
      <div className="w-7 h-7 rounded-full bg-[#FF6B9D] flex items-center justify-center text-[14px] shrink-0">
        💜
      </div>
      <div className="flex-1">
        <p className="font-sans font-extrabold text-[12px] text-[#C2185B] m-0 mb-0.5">
          Remember to Take Care of Yourself Too
        </p>
        <p className="font-sans text-[11px] text-[#E91E80]/75 m-0">
          Caring for a child with PANDAS is challenging. Your wellbeing matters.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="bg-transparent border-none text-[16px] text-neutral-400 cursor-pointer shrink-0 p-0 leading-none"
      >
        ×
      </button>
    </div>
  );
};

export default SelfCareBanner;
