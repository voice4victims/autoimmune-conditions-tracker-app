
import React from 'react';
import MfaSetup from '@/components/MfaSetup';
import DataDeletion from '@/components/DataDeletion';
import AuditTrail from '@/components/AuditTrail';
import PrivacyInfo from '@/components/PrivacyInfo';
import ProfileMenu from '@/components/ProfileMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ProfileAndSecurity: React.FC = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileMenu />
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
    </div>
  );
};

export default ProfileAndSecurity;
