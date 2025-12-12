import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Mail,
    MessageSquare,
    Bell,
    Shield,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Info,
    Loader2
} from 'lucide-react';
import {
    CommunicationPreferences,
    CommunicationType,
    CommunicationRecord
} from '@/types/privacy';
import { privacyService } from '@/lib/privacyService';
import { communicationService } from '@/lib/communicationService';
import { useAuth } from '@/contexts/AuthContext';

interface CommunicationPanelProps {
    communications: CommunicationPreferences;
    onUpdate: (updates: Partial<CommunicationPreferences>) => Promise<void>;
    loading?: boolean;
}

interface CommunicationSetting {
    type: CommunicationType;
    label: string;
    description: string;
    icon: React.ReactNode;
    essential: boolean;
    category: 'notifications' | 'marketing' | 'security';
}

const COMMUNICATION_SETTINGS: CommunicationSetting[] = [
    {
        type: 'email_notifications',
        label: 'Email Notifications',
        description: 'Receive general notifications and updates via email',
        icon: <Mail className="h-4 w-4" />,
        essential: false,
        category: 'notifications'
    },
    {
        type: 'sms_notifications',
        label: 'SMS Notifications',
        description: 'Receive important notifications via text message',
        icon: <MessageSquare className="h-4 w-4" />,
        essential: false,
        category: 'notifications'
    },
    {
        type: 'security_alerts',
        label: 'Security Alerts',
        description: 'Critical security notifications (cannot be disabled)',
        icon: <Shield className="h-4 w-4" />,
        essential: true,
        category: 'security'
    },
    {
        type: 'medical_reminders',
        label: 'Medical Reminders',
        description: 'Medication and appointment reminders (cannot be disabled)',
        icon: <Bell className="h-4 w-4" />,
        essential: true,
        category: 'security'
    },
    {
        type: 'marketing_emails',
        label: 'Marketing Communications',
        description: 'Promotional emails and product updates',
        icon: <Mail className="h-4 w-4" />,
        essential: false,
        category: 'marketing'
    },
    {
        type: 'third_party_marketing',
        label: 'Third-Party Marketing',
        description: 'Allow sharing contact information with trusted partners',
        icon: <Users className="h-4 w-4" />,
        essential: false,
        category: 'marketing'
    }
];

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
    communications,
    onUpdate,
    loading = false
}) => {
    const { user } = useAuth();
    const [updating, setUpdating] = useState<CommunicationType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [pendingUpdates, setPendingUpdates] = useState<Set<CommunicationType>>(new Set());

    // Handle communication preference change
    const handleCommunicationChange = async (type: CommunicationType, enabled: boolean) => {
        if (!user?.uid) return;

        try {
            setUpdating(type);
            setError(null);
            setPendingUpdates(prev => new Set([...prev, type]));

            // Create communication record
            const communicationRecord: CommunicationRecord = {
                id: crypto.randomUUID(),
                type,
                enabled,
                changedAt: new Date(),
                changedBy: user.uid,
                reason: enabled ? 'User enabled communication' : 'User disabled communication'
            };

            // Update communication preferences
            const updatedHistory = [...communications.communicationHistory, communicationRecord];
            const updates: Partial<CommunicationPreferences> = {
                [type]: enabled,
                communicationHistory: updatedHistory
            };

            await onUpdate(updates);

            // Handle special cases for marketing communications
            if (type === 'marketing_emails') {
                if (enabled) {
                    await communicationService.processMarketingOptIn(user.uid);
                } else {
                    await communicationService.processMarketingOptOut(user.uid);
                }
            }

            // Update communication preferences with propagation
            await communicationService.updateCommunicationPreferences(user.uid, updates);

            setLastUpdate(new Date());

        } catch (err) {
            console.error('Error updating communication preference:', err);
            setError(err instanceof Error ? err.message : 'Failed to update communication preference');
        } finally {
            setUpdating(null);
            setPendingUpdates(prev => {
                const newSet = new Set(prev);
                newSet.delete(type);
                return newSet;
            });
        }
    };

    // Get current setting value
    const getCurrentValue = (type: CommunicationType): boolean => {
        switch (type) {
            case 'email_notifications':
                return communications.emailNotifications;
            case 'sms_notifications':
                return communications.smsNotifications;
            case 'marketing_emails':
                return communications.marketingEmails;
            case 'security_alerts':
                return communications.securityAlerts;
            case 'medical_reminders':
                return communications.medicalReminders;
            case 'third_party_marketing':
                return communications.thirdPartyMarketing;
            default:
                return false;
        }
    };

    // Group settings by category
    const settingsByCategory = COMMUNICATION_SETTINGS.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {} as Record<string, CommunicationSetting[]>);

    // Get category info
    const getCategoryInfo = (category: string) => {
        switch (category) {
            case 'notifications':
                return {
                    title: 'General Notifications',
                    description: 'Control how you receive general updates and notifications',
                    icon: <Bell className="h-5 w-5" />
                };
            case 'security':
                return {
                    title: 'Essential Communications',
                    description: 'Critical security and medical communications that cannot be disabled',
                    icon: <Shield className="h-5 w-5" />
                };
            case 'marketing':
                return {
                    title: 'Marketing & Promotional',
                    description: 'Control marketing communications and data sharing with partners',
                    icon: <Mail className="h-5 w-5" />
                };
            default:
                return {
                    title: 'Other',
                    description: 'Other communication preferences',
                    icon: <Info className="h-5 w-5" />
                };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Communication Preferences
                    </CardTitle>
                    <CardDescription>
                        Control how we communicate with you and manage your marketing preferences.
                        Essential communications like security alerts and medical reminders cannot be disabled.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Last Update Info */}
            {lastUpdate && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        Communication preferences updated successfully at {lastUpdate.toLocaleTimeString()}
                    </AlertDescription>
                </Alert>
            )}

            {/* Communication Settings by Category */}
            {Object.entries(settingsByCategory).map(([category, settings]) => {
                const categoryInfo = getCategoryInfo(category);

                return (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {categoryInfo.icon}
                                {categoryInfo.title}
                            </CardTitle>
                            <CardDescription>
                                {categoryInfo.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settings.map((setting, index) => {
                                const currentValue = getCurrentValue(setting.type);
                                const isUpdating = updating === setting.type;
                                const isPending = pendingUpdates.has(setting.type);

                                return (
                                    <div key={setting.type}>
                                        <div className="flex items-center justify-between space-x-4">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div className="mt-1">
                                                    {setting.icon}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label
                                                            htmlFor={setting.type}
                                                            className="text-sm font-medium"
                                                        >
                                                            {setting.label}
                                                        </Label>
                                                        {setting.essential && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Essential
                                                            </Badge>
                                                        )}
                                                        {isPending && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Updating...
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {setting.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {isUpdating && (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                )}
                                                <Switch
                                                    id={setting.type}
                                                    checked={currentValue}
                                                    onCheckedChange={(checked) =>
                                                        handleCommunicationChange(setting.type, checked)
                                                    }
                                                    disabled={setting.essential || loading || isUpdating}
                                                />
                                            </div>
                                        </div>
                                        {index < settings.length - 1 && (
                                            <Separator className="mt-4" />
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}

            {/* Communication History */}
            {communications.communicationHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Changes
                        </CardTitle>
                        <CardDescription>
                            Your recent communication preference changes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {communications.communicationHistory
                                .slice(-5) // Show last 5 changes
                                .reverse()
                                .map((record) => {
                                    const setting = COMMUNICATION_SETTINGS.find(s => s.type === record.type);
                                    return (
                                        <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                {setting?.icon}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {setting?.label || record.type}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {record.changedAt.toLocaleDateString()} at {record.changedAt.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={record.enabled ? "default" : "secondary"}>
                                                    {record.enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Important Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Important Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Essential Communications:</strong> Security alerts and medical reminders
                            cannot be disabled as they are critical for your safety and health management.
                        </AlertDescription>
                    </Alert>

                    <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Processing Time:</strong> Communication preference changes take effect
                            immediately for new communications. It may take up to 24 hours for changes to
                            propagate to all systems.
                        </AlertDescription>
                    </Alert>

                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Third-Party Sharing:</strong> When you enable third-party marketing,
                            we may share your contact information with trusted healthcare partners.
                            You can opt out at any time.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};

export default CommunicationPanel;