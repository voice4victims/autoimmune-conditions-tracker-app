
import React from 'react';
import MfaSetup from '@/components/MfaSetup';
import DataDeletion from '@/components/DataDeletion';
import AuditTrail from '@/components/AuditTrail';
import PrivacyInfo from '@/components/PrivacyInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ChildManager from './ChildManager';
import { Button } from './ui/button';

interface ProfileAndSecurityProps {
  showChildManager: boolean;
  setShowChildManager: (show: boolean) => void;
}

const ProfileAndSecurity: React.FC<ProfileAndSecurityProps> = ({ showChildManager, setShowChildManager }) => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Manage child profiles and family members.</p>
          <Button onClick={() => setShowChildManager(true)}>Manage Children</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <MfaSetup />
          <Separator />
          <AuditTrail />
          <Separator />
          <DataDeletion />
          <Separator />
          <PrivacyInfo />
        </CardContent>
      </Card>

      <ChildManager 
        isOpen={showChildManager} 
        onClose={() => setShowChildManager(false)} 
      />
    </div>
  );
};

export default ProfileAndSecurity;
