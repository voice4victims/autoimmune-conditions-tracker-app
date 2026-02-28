
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User, Settings, Menu, Monitor, Smartphone, Tablet, Shield, AlertTriangle, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import PANDASApp from './PANDASApp';
import ThemeToggle from './ThemeToggle';

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { privacySettings, loading: privacyLoading, error: privacyError } = usePrivacy();
  const deviceInfo = useDeviceDetection();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTab, setCurrentTab] = useState('track');
  const [showChildManager, setShowChildManager] = useState(false);

  const handleAppSettingsClick = () => {
    setCurrentTab('profile');
    setShowMobileMenu(false);
  };

  const handlePrivacySettingsClick = () => {
    setCurrentTab('privacy');
    setShowMobileMenu(false);
  };

  // Privacy status indicator logic
  const getPrivacyStatus = () => {
    if (privacyLoading) return { status: 'loading', message: 'Loading privacy settings...' };
    if (privacyError) return { status: 'error', message: 'Privacy settings error' };
    if (!privacySettings) return { status: 'warning', message: 'Privacy settings not configured' };

    // Check for potential privacy concerns
    const concerns = [];
    if (privacySettings.dataSharing?.researchParticipation) concerns.push('Research participation enabled');
    if (privacySettings.dataSharing?.thirdPartyIntegrations && Object.values(privacySettings.dataSharing.thirdPartyIntegrations).some(enabled => enabled)) {
      concerns.push('Third-party sharing enabled');
    }
    if (!privacySettings.dataRetention?.automaticDeletion) concerns.push('Automatic data deletion disabled');

    if (concerns.length > 0) {
      return { status: 'warning', message: `${concerns.length} privacy setting${concerns.length > 1 ? 's' : ''} need attention` };
    }

    return { status: 'good', message: 'Privacy settings configured' };
  };

  const privacyStatus = getPrivacyStatus();

  const getDeviceIcon = () => {
    if (deviceInfo.isMobile) return <Smartphone className="w-3 h-3" />;
    if (deviceInfo.isTablet) return <Tablet className="w-3 h-3" />;
    return <Monitor className="w-3 h-3" />;
  };

  const getDeviceType = () => {
    if (deviceInfo.isMobile) return 'Mobile';
    if (deviceInfo.isTablet) return 'Tablet';
    return 'Desktop';
  };

  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-12 touch-manipulation relative">
          <User className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Settings</span>
          {privacyStatus.status === 'warning' && (
            <AlertTriangle className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
          )}
          {privacyStatus.status === 'error' && (
            <AlertTriangle className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleAppSettingsClick} className="h-12">
          <Settings className="w-4 h-4 mr-2" />
          App Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrivacySettingsClick} className="h-12">
          <Shield className="w-4 h-4 mr-2" />
          <div className="flex flex-col items-start">
            <span>Privacy Settings</span>
            <span className={`text-xs ${privacyStatus.status === 'good' ? 'text-green-600' :
              privacyStatus.status === 'warning' ? 'text-amber-600' :
                privacyStatus.status === 'error' ? 'text-red-600' :
                  'text-gray-500'
              }`}>
              {privacyStatus.message}
            </span>
          </div>
          {privacyStatus.status === 'warning' && (
            <AlertTriangle className="w-4 h-4 ml-auto text-amber-500" />
          )}
          {privacyStatus.status === 'error' && (
            <AlertTriangle className="w-4 h-4 ml-auto text-red-500" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="h-12 text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={`min-h-screen android-fix bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${deviceInfo.isMobile ? 'mobile-layout' : deviceInfo.isTablet ? 'tablet-layout' : 'desktop-layout'
      }`}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-50 safe-area-top">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate no-select">
            PANDAS Tracker
          </h1>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            {getDeviceIcon()}
            {getDeviceType()}
          </Badge>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48">{user?.email}</span>
          <ThemeToggle />
          <ProfileDropdown />
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-12 w-12 p-0 touch-manipulation">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 safe-area-inset">
              <div className="flex flex-col gap-4 pt-8">
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate pb-4 border-b dark:border-gray-700">
                  {user?.email}
                </div>
                <Button
                  variant="outline"
                  onClick={handleAppSettingsClick}
                  className="justify-start h-14 text-base touch-manipulation"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  App Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrivacySettingsClick}
                  className="justify-start h-14 text-base touch-manipulation relative"
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span>Privacy Settings</span>
                    <span className={`text-sm ${privacyStatus.status === 'good' ? 'text-green-600' :
                        privacyStatus.status === 'warning' ? 'text-amber-600' :
                          privacyStatus.status === 'error' ? 'text-red-600' :
                            'text-gray-500'
                      }`}>
                      {privacyStatus.message}
                    </span>
                  </div>
                  {privacyStatus.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 ml-auto text-amber-500" />
                  )}
                  {privacyStatus.status === 'error' && (
                    <AlertTriangle className="w-4 h-4 ml-auto text-red-500" />
                  )}
                </Button>
                <div className="border-t dark:border-gray-700 pt-4 mt-4">
                  <Button
                    variant="destructive"
                    onClick={signOut}
                    className="w-full justify-start h-14 text-base touch-manipulation"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="p-4 pb-8 safe-area-bottom">
        <PANDASApp
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          showChildManager={showChildManager}
          setShowChildManager={setShowChildManager}
        />
      </main>
    </div>
  );
};

export default AppLayout;
