
import React from 'react';
import MfaSetup from '@/components/MfaSetup';
import DataDeletion from '@/components/DataDeletion';
import AuditTrail from '@/components/AuditTrail';
import PrivacyInfo from '@/components/PrivacyInfo';
import PrivacySettings from '@/components/PrivacySettings';
import PrivacyStatusIndicator from '@/components/PrivacyStatusIndicator';
import { RoleDashboard } from '@/components/RoleDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ChildManager from './ChildManager';
import { Button } from './ui/button';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAndSecurityProps {
  showChildManager: boolean;
  setShowChildManager: (show: boolean) => void;
}

const ProfileAndSecurity: React.FC<ProfileAndSecurityProps> = ({ showChildManager, setShowChildManager }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <RoleDashboard />

      <Card>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">Profile Management</h3>
            <PrivacyStatusIndicator variant="badge" size="sm" />
          </div>
          <p className="font-sans text-[13px] text-neutral-500 dark:text-neutral-400">
            Manage child profiles and family members.
          </p>
          <Button onClick={() => setShowChildManager(true)}>Manage Children</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3.5">
          <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">Appearance</h3>
          <p className="font-sans text-[13px] text-neutral-500 dark:text-neutral-400">
            Choose light or dark mode for the app.
          </p>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, icon: <Sun className="w-4 h-4" />, label: 'Light' },
              { value: 'dark' as const, icon: <Moon className="w-4 h-4" />, label: 'Dark' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all',
                  theme === opt.value
                    ? 'border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-600/20 dark:text-primary-300 dark:border-primary-500'
                    : 'border-neutral-200 text-neutral-400 bg-transparent dark:border-neutral-700 dark:text-neutral-500'
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <PrivacySettings />

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">Security Settings</h3>
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
