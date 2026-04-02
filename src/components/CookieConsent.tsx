import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { initAnalytics } from '@/lib/firebase';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('analytics_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem('analytics_consent', 'granted');
    initAnalytics();
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('analytics_consent', 'denied');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 shadow-lg">
      <div className="mx-auto max-w-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 m-0 leading-snug">
          We use analytics cookies to understand how the app is used and improve it. No health data is included.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept Analytics
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
