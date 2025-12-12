import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Shield, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useAuth } from '@/contexts/AuthContext';

interface PrivacyNotification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    dismissible?: boolean;
    autoHide?: boolean;
    duration?: number; // in milliseconds
}

interface PrivacyNotificationsProps {
    onNavigateToPrivacy?: () => void;
    compact?: boolean;
    maxNotifications?: number;
}

const PrivacyNotifications: React.FC<PrivacyNotificationsProps> = ({
    onNavigateToPrivacy,
    compact = false,
    maxNotifications = 3
}) => {
    const { user } = useAuth();
    const { privacySettings, loading, error } = usePrivacy();
    const [notifications, setNotifications] = useState<PrivacyNotification[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

    // Generate privacy notifications based on current state
    useEffect(() => {
        if (!user || loading) return;

        const newNotifications: PrivacyNotification[] = [];

        // Error notification
        if (error) {
            newNotifications.push({
                id: 'privacy-error',
                type: 'error',
                title: 'Privacy Settings Error',
                message: 'Unable to load your privacy settings. Some features may not work correctly.',
                action: {
                    label: 'Retry',
                    onClick: () => window.location.reload()
                },
                dismissible: true
            });
        }

        // Privacy settings not configured
        if (!privacySettings && !loading && !error) {
            newNotifications.push({
                id: 'privacy-not-configured',
                type: 'warning',
                title: 'Privacy Settings Required',
                message: 'Please configure your privacy settings to ensure your medical data is protected according to your preferences.',
                action: onNavigateToPrivacy ? {
                    label: 'Configure Now',
                    onClick: onNavigateToPrivacy
                } : undefined,
                dismissible: true
            });
        }

        if (privacySettings) {
            // Data sharing notifications
            if (privacySettings.dataSharing?.researchParticipation) {
                newNotifications.push({
                    id: 'research-participation-active',
                    type: 'info',
                    title: 'Research Participation Active',
                    message: 'Your anonymized data is being shared for medical research. You can opt out anytime.',
                    action: onNavigateToPrivacy ? {
                        label: 'Manage',
                        onClick: onNavigateToPrivacy
                    } : undefined,
                    dismissible: true
                });
            }

            // Third-party sharing notifications
            const activeIntegrations = privacySettings.dataSharing?.thirdPartyIntegrations
                ? Object.entries(privacySettings.dataSharing.thirdPartyIntegrations)
                    .filter(([_, enabled]) => enabled)
                    .map(([service, _]) => service)
                : [];

            if (activeIntegrations.length > 0) {
                newNotifications.push({
                    id: 'third-party-sharing-active',
                    type: 'info',
                    title: 'Third-Party Sharing Active',
                    message: `Your data is being shared with ${activeIntegrations.length} third-party service${activeIntegrations.length > 1 ? 's' : ''}.`,
                    action: onNavigateToPrivacy ? {
                        label: 'Review',
                        onClick: onNavigateToPrivacy
                    } : undefined,
                    dismissible: true
                });
            }

            // Data retention notifications
            if (!privacySettings.dataRetention?.automaticDeletion) {
                newNotifications.push({
                    id: 'auto-deletion-disabled',
                    type: 'warning',
                    title: 'Automatic Data Deletion Disabled',
                    message: 'Your data will be stored indefinitely. Consider enabling automatic deletion for better privacy.',
                    action: onNavigateToPrivacy ? {
                        label: 'Enable',
                        onClick: onNavigateToPrivacy
                    } : undefined,
                    dismissible: true
                });
            }

            // Data retention period warning
            if (privacySettings.dataRetention?.automaticDeletion &&
                privacySettings.dataRetention?.retentionPeriod &&
                privacySettings.dataRetention.retentionPeriod > 60) { // More than 5 years
                newNotifications.push({
                    id: 'long-retention-period',
                    type: 'info',
                    title: 'Long Data Retention Period',
                    message: `Your data will be kept for ${Math.round(privacySettings.dataRetention.retentionPeriod / 12)} years. Consider a shorter period for better privacy.`,
                    action: onNavigateToPrivacy ? {
                        label: 'Adjust',
                        onClick: onNavigateToPrivacy
                    } : undefined,
                    dismissible: true
                });
            }

            // Marketing consent notification
            if (privacySettings.dataSharing?.marketingConsent) {
                newNotifications.push({
                    id: 'marketing-consent-active',
                    type: 'info',
                    title: 'Marketing Communications Enabled',
                    message: 'You will receive marketing communications. You can opt out anytime.',
                    action: onNavigateToPrivacy ? {
                        label: 'Manage',
                        onClick: onNavigateToPrivacy
                    } : undefined,
                    dismissible: true,
                    autoHide: true,
                    duration: 10000
                });
            }

            // Privacy settings updated recently
            const lastUpdated = privacySettings.lastUpdated;
            const isRecentlyUpdated = lastUpdated && (Date.now() - lastUpdated.getTime()) < 24 * 60 * 60 * 1000; // 24 hours

            if (isRecentlyUpdated) {
                newNotifications.push({
                    id: 'privacy-settings-updated',
                    type: 'success',
                    title: 'Privacy Settings Updated',
                    message: 'Your privacy preferences have been successfully updated.',
                    dismissible: true,
                    autoHide: true,
                    duration: 5000
                });
            }
        }

        // Filter out dismissed notifications and limit count
        const filteredNotifications = newNotifications
            .filter(notification => !dismissedNotifications.has(notification.id))
            .slice(0, maxNotifications);

        setNotifications(filteredNotifications);
    }, [user, privacySettings, loading, error, onNavigateToPrivacy, dismissedNotifications, maxNotifications]);

    // Auto-hide notifications
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        notifications.forEach(notification => {
            if (notification.autoHide && notification.duration) {
                const timer = setTimeout(() => {
                    handleDismiss(notification.id);
                }, notification.duration);
                timers.push(timer);
            }
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [notifications]);

    const handleDismiss = (notificationId: string) => {
        setDismissedNotifications(prev => new Set([...prev, notificationId]));
    };

    const getIcon = (type: PrivacyNotification['type']) => {
        switch (type) {
            case 'error':
                return <AlertTriangle className="h-4 w-4" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4" />;
            case 'success':
                return <CheckCircle className="h-4 w-4" />;
            case 'info':
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getVariant = (type: PrivacyNotification['type']) => {
        switch (type) {
            case 'error':
                return 'destructive';
            case 'warning':
                return 'default'; // Using default for warning as there's no warning variant
            case 'success':
                return 'default';
            case 'info':
            default:
                return 'default';
        }
    };

    if (notifications.length === 0) {
        return null;
    }

    if (compact) {
        return (
            <div className="space-y-2">
                {notifications.map(notification => (
                    <Alert key={notification.id} variant={getVariant(notification.type)} className="relative">
                        <div className="flex items-start gap-2">
                            {getIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{notification.title}</div>
                                <div className="text-sm opacity-90">{notification.message}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {notification.action && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={notification.action.onClick}
                                        className="h-7 text-xs"
                                    >
                                        {notification.action.label}
                                    </Button>
                                )}
                                {notification.dismissible && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDismiss(notification.id)}
                                        className="h-7 w-7 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Alert>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notifications.map(notification => (
                <Card key={notification.id} className="relative">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                    notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                            'bg-blue-100 text-blue-600'
                                }`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm">{notification.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Privacy
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {notification.message}
                                </p>
                                {notification.action && (
                                    <Button
                                        size="sm"
                                        onClick={notification.action.onClick}
                                        className="h-8"
                                    >
                                        {notification.action.label}
                                    </Button>
                                )}
                            </div>
                            {notification.dismissible && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDismiss(notification.id)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default PrivacyNotifications;