import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

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
    <Card className="mb-4 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Heart className="w-6 h-6 text-pink-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Remember to Take Care of Yourself Too!
              </h3>
              <p className="text-sm text-gray-600">
                Caring for a child with PANDAS is challenging. Don't forget that your well-being matters too. 
                Check out our Self Care section for tips on managing stress and maintaining your health.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-pink-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfCareBanner;