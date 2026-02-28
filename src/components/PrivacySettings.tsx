import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users, Database, FileText, MessageSquare, Baby, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { privacyService } from '@/lib/privacyService';
import { PrivacySettings as PrivacySettingsType } from '@/types/privacy';
import DataSharingPanel from './DataSharingPanel';
import AccessControlPanel from './AccessControlPanel';
import DataRetentionPanel from './DataRetentionPanel';
import AuditLogPanel from './AuditLogPanel';
import ChildPrivacyPanel from './ChildPrivacyPanel';
import CommunicationPanel from './CommunicationPanel';
import DataProcessingPanel from './DataProcessingPanel';

interface PrivacySettingsProps {
    userId?: string;
    onSettingsChange?: (settings: PrivacySettingsType) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

// Simple Error Boundary Component
class PrivacyErrorBoundary extends React.Component<
    { children: React.ReactNode; onError?: (error: Error) => void },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Privacy Settings Error:', error, errorInfo);
        this.props.onError?.(error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Privacy Settings Error
                        </CardTitle>
                        <CardDescription>
                            Something went wrong while loading your privacy settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </AlertDescription>
                        </Alert>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            className="mt-4"
                            variant="outline"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
    userId: propUserId,
    onSettingsChange
}) => {
    const { user, signOut } = useAuth();
    const { children } = useApp();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [privacySettings, setPrivacySettings] = useState<PrivacySettingsType | null>(null);
    const [activeTab, setActiveTab] = useState('data-sharing');

    const userId = propUserId || user?.uid;

    // Load privacy settings
    const loadPrivacySettings = async () => {
        if (!userId) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const settings = await privacyService.getPrivacySettings(userId);
            setPrivacySettings(settings);
            onSettingsChange?.(settings);
        } catch (err) {
            console.error('Error loading privacy settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load privacy settings');
        } finally {
            setLoading(false);
        }
    };

    // Handle settings updates
    const handleSettingsUpdate = async (updatedSettings: Partial<PrivacySettingsType>) => {
        if (!userId || !privacySettings) return;

        try {
            await privacyService.updatePrivacySettings(userId, updatedSettings);
            const newSettings = { ...privacySettings, ...updatedSettings };
            setPrivacySettings(newSettings);
            onSettingsChange?.(newSettings);
        } catch (err) {
            console.error('Error updating privacy settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
        }
    };

    // Handle error recovery
    const handleErrorRecovery = () => {
        setError(null);
        loadPrivacySettings();
    };

    useEffect(() => {
        loadPrivacySettings();
    }, [userId]);

    // Loading state
    if (loading) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your data privacy preferences and security settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                            <p className="text-muted-foreground">Loading your privacy settings...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Privacy Settings Error
                    </CardTitle>
                    <CardDescription>
                        Unable to load your privacy settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={handleErrorRecovery} className="mt-4" variant="outline">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // No user state
    if (!userId) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Please sign in to access your privacy settings.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <PrivacyErrorBoundary onError={(error) => setError(error.message)}>
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy Settings
                        </CardTitle>
                        <CardDescription>
                            Manage your data privacy preferences, access controls, and security settings.
                            Your privacy is important to us, and these settings give you control over how your medical data is handled.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="data-sharing" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span className="hidden sm:inline">Data Sharing</span>
                        </TabsTrigger>
                        <TabsTrigger value="access-control" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Access Control</span>
                        </TabsTrigger>
                        <TabsTrigger value="data-retention" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Data Retention</span>
                        </TabsTrigger>
                        <TabsTrigger value="audit-logs" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Audit Logs</span>
                        </TabsTrigger>
                        <TabsTrigger value="communications" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Communications</span>
                        </TabsTrigger>
                        <TabsTrigger value="data-processing" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Data Processing</span>
                        </TabsTrigger>
                        <TabsTrigger value="child-privacy" className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span className="hidden sm:inline">Child Privacy</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="data-sharing" className="mt-6">
                        {privacySettings ? (
                            <DataSharingPanel
                                dataSharing={privacySettings.dataSharing}
                                onUpdate={async (updates) => {
                                    await handleSettingsUpdate({ dataSharing: { ...privacySettings.dataSharing, ...updates } });
                                }}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Sharing & Consent</CardTitle>
                                    <CardDescription>
                                        Control how your medical data is shared for research and with third parties
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Loading privacy settings...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="access-control" className="mt-6">
                        {privacySettings ? (
                            <AccessControlPanel
                                accessControl={privacySettings.accessControl}
                                onUpdate={async (updates) => {
                                    await handleSettingsUpdate({ accessControl: { ...privacySettings.accessControl, ...updates } });
                                }}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Access Control Management</CardTitle>
                                    <CardDescription>
                                        Manage who can access your family's medical data and their permission levels
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Loading access control settings...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="data-retention" className="mt-6">
                        {privacySettings ? (
                            <DataRetentionPanel
                                dataRetention={privacySettings.dataRetention}
                                onUpdate={async (updates) => {
                                    await handleSettingsUpdate({ dataRetention: { ...privacySettings.dataRetention, ...updates } });
                                }}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Retention & Deletion</CardTitle>
                                    <CardDescription>
                                        Control how long your data is stored and request data deletion
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Loading data retention settings...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="audit-logs" className="mt-6">
                        <AuditLogPanel />
                    </TabsContent>

                    <TabsContent value="communications" className="mt-6">
                        {privacySettings ? (
                            <CommunicationPanel
                                communications={privacySettings.communications}
                                onUpdate={async (updates) => {
                                    await handleSettingsUpdate({ communications: { ...privacySettings.communications, ...updates } });
                                }}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Communication Preferences</CardTitle>
                                    <CardDescription>
                                        Control how we communicate with you and manage marketing preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Loading communication preferences...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="data-processing" className="mt-6">
                        <DataProcessingPanel loading={loading} />
                    </TabsContent>

                    <TabsContent value="child-privacy" className="mt-6">
                        {privacySettings ? (
                            <ChildPrivacyPanel
                                childSpecific={privacySettings.childSpecific}
                                onUpdate={async (updates) => {
                                    await handleSettingsUpdate({ childSpecific: updates });
                                }}
                                loading={loading}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Child-Specific Privacy</CardTitle>
                                    <CardDescription>
                                        Set individual privacy preferences for each child's medical data
                                        {children.length > 0 && (
                                            <span className="block mt-1 text-sm">
                                                Managing privacy for {children.length} child{children.length !== 1 ? 'ren' : ''}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Loading child privacy settings...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Privacy Settings Status */}
                {privacySettings && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Privacy settings last updated: {privacySettings.lastUpdated.toLocaleDateString()}</span>
                                <span>Settings version: {privacySettings.version}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={signOut}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </PrivacyErrorBoundary>
    );
};

export default PrivacySettings;