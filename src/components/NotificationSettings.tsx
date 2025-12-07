import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notificationsEnabled,
  onToggleNotifications
}) => {
  const { permission, requestPermission } = useNotifications();

  const handleEnableNotifications = async () => {
    if (permission.granted) {
      onToggleNotifications(true);
    } else {
      const granted = await requestPermission();
      if (granted) {
        onToggleNotifications(true);
      }
    }
  };

  const handleDisableNotifications = () => {
    onToggleNotifications(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notifications-toggle" className="text-sm font-medium">
              Push Notifications
            </Label>
            <p className="text-sm text-gray-500">
              Receive medication reminders on your phone
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled && permission.granted}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableNotifications();
              } else {
                handleDisableNotifications();
              }
            }}
          />
        </div>

        {!permission.granted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BellOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Notifications Disabled
              </span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Enable browser notifications to receive medication reminders on your phone.
            </p>
            <Button
              size="sm"
              onClick={requestPermission}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          </div>
        )}

        {permission.granted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Notifications Enabled
              </span>
            </div>
            <p className="text-sm text-green-700">
              You'll receive push notifications for active medication reminders.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;