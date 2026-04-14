import React, { useState } from 'react';

const MedicalDisclaimer: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('disclaimer_dismissed') === '1');

  if (dismissed) return null;

  return (
    <div className="bg-warning-50 border-b border-warning-100 px-4 py-2 flex gap-2.5 items-start shrink-0">
      <span className="text-[14px] mt-0.5 shrink-0">⚠️</span>
      <p className="font-sans text-[11px] text-warning-500 m-0 leading-relaxed flex-1">
        <strong>Medical Disclaimer:</strong> This app is not a medical device and does not provide medical advice, diagnosis, or treatment recommendations.
        It is for personal tracking purposes only. Always consult a qualified healthcare professional before making any medical decisions.
      </p>
      <button
        onClick={() => { localStorage.setItem('disclaimer_dismissed', '1'); setDismissed(true); }}
        className="text-warning-500 bg-transparent border-none cursor-pointer p-0 shrink-0 text-[16px] leading-none mt-0.5"
        aria-label="Dismiss disclaimer"
      >
        ✕
      </button>
    </div>
  );
};

export default MedicalDisclaimer;
