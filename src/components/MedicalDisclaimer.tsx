import React, { useState, useEffect } from 'react';

const MedicalDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('disclaimerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('disclaimerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-warning-50 border-b border-warning-100 px-4 py-2.5 flex gap-2.5 items-start shrink-0">
      <span className="text-[14px] mt-0.5 shrink-0">⚠️</span>
      <p className="font-sans text-[11px] text-warning-500 m-0 leading-relaxed flex-1">
        <strong>Medical Disclaimer:</strong> This app is for tracking purposes only and is not
        intended to diagnose, treat, cure, or prevent any medical condition.
      </p>
      <button
        onClick={handleDismiss}
        className="bg-transparent border-none text-[16px] text-neutral-400 cursor-pointer shrink-0 p-0 leading-none"
      >
        ×
      </button>
    </div>
  );
};

export default MedicalDisclaimer;
