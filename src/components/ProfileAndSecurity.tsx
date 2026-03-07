
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
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAndSecurityProps {
  showChildManager: boolean;
  setShowChildManager: (show: boolean) => void;
}

const ProfileAndSecurity: React.FC<ProfileAndSecurityProps> = ({ showChildManager, setShowChildManager }) => {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

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
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-sans font-bold text-[13px] text-neutral-800 dark:text-neutral-100 m-0">
                  Dark Mode
                </p>
                <p className="font-sans text-[11px] text-neutral-400 dark:text-neutral-500 m-0">
                  {theme === 'dark' ? 'On' : 'Off'}
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                theme === 'dark' ? 'bg-primary-500' : 'bg-neutral-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
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

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 font-sans font-bold text-[13px] text-red-600 dark:text-red-400 cursor-pointer transition-colors hover:bg-red-100 dark:hover:bg-red-900"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <ChildManager
        isOpen={showChildManager}
        onClose={() => setShowChildManager(false)}
      />
    </div>
  );
};

export default ProfileAndSecurity;
