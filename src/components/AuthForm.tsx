import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  // Auto-trigger auth success since login is disabled
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onAuthSuccess();
    }, 100);
    return () => clearTimeout(timer);
  }, [onAuthSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PANDAS Tracker</CardTitle>
        <CardDescription>
          Loading your health tracking dashboard...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground">
          No login required - accessing your tracker now
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthForm;