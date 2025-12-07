import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const MedicalDisclaimer: React.FC = () => {
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <strong>Medical Disclaimer:</strong> This application is for tracking purposes only and is not intended to diagnose, treat, cure, or prevent any medical condition. Always consult with qualified healthcare professionals for medical advice and treatment decisions.
      </AlertDescription>
    </Alert>
  );
};

export default MedicalDisclaimer;