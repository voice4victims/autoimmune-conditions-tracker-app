import React from 'react';

const MedicalDisclaimer: React.FC = () => {
  return (
    <div className="bg-warning-50 border-b border-warning-100 px-4 py-2 flex gap-2.5 items-start shrink-0">
      <span className="text-[14px] mt-0.5 shrink-0">⚠️</span>
      <p className="font-sans text-[11px] text-warning-500 m-0 leading-relaxed flex-1">
        <strong>Medical Disclaimer:</strong> This app is not a medical device and does not provide medical advice, diagnosis, or treatment recommendations.
        It is for personal tracking purposes only. Always consult a qualified healthcare professional before making any medical decisions.
      </p>
    </div>
  );
};

export default MedicalDisclaimer;
