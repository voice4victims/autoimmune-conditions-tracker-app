import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Info, Shield, Users, Database, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { DataSharingPreferences, ConsentRecord } from '@/types/privacy';

interface DataSharingPanelProps {
    dataSharing: DataSharingPreferences;
    onUpdate: (updates: Partial<DataSharingPreferences>) => Promise<void>;
    loading?: boolean;
}

interface ConsentChangeRequest {
    type: 'research' | 'anonymized' | 'thirdParty' | 'marketing';
    value: boolean;
    label: string;
}

const DataSharingPanel: React.FC<DataSharingPanelProps> = ({
    dataSharing,
    onUpdate,
    loading = false
}) => {
    const [pendingChange, setPendingChange] = useState<ConsentChangeRequest | null>(null);
    const [showResearchInfo, setShowResearchInfo] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Handle consent change with confirmation
    const handleConsentChange = (type: ConsentChangeRequest['type'], value: boolean, label: string) => {
        setPendingChange({ type, value, label });
    };

    // Confirm and apply consent change
    const confirmConsentChange = async () => {
        if (!pendingChange) return;

        setUpdating(true);
        try {
            const consentRecord: ConsentRecord = {
                id: crypto.randomUUID(),
                consentType: pendingChange.type as any,
                granted: pendingChange.value,
                timestamp: new Date(),
                ipAddress: 'unknown', // Would be populated by backend
                userAgent: navigator.userAgent,
                version: '1.0'
            };

            const updates: Partial<DataSharingPreferences> = {
                consentHistory: [...dataSharing.consentHistory, consentRecord]
            };

            // Update specific consent setting
            switch (pendingChange.type) {
                case 'research':
                    updates.researchParticipation = pendingChange.value;
                    break;
                case 'anonymized':
                    updates.anonymizedDataSharing = pendingChange.value;
                    break;
                case 'marketing':
                    updates.marketingConsent = pendingChange.value;
                    break;
                case 'thirdParty':
                    // Handle third-party integrations
                    updates.thirdPartyIntegrations = {
                        ...dataSharing.thirdPartyIntegrations,
                        // This would be more specific in a real implementation
                    };
                    break;
            }

            await onUpdate(updates);
        } catch (error) {
            console.error('Error updating consent:', error);
        } finally {
            setUpdating(false);
            setPendingChange(null);
        }
    };

    // Cancel consent change
    const cancelConsentChange = () => {
        setPendingChange(null);
    };

    // Get consent status for display
    const getConsentStatus = (granted: boolean) => {
        return granted ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Granted
            </Badge>
        ) : (
            <Badge variant="secondary">
                Not Granted
            </Badge>
        );
    };

    // Get latest consent record for a type
    const getLatestConsent = (type: string) => {
        return dataSharing.consentHistory
            .filter(record => record.consentType === type)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    };

    return (
        <div className="space-y-6">
            {/* Research Participation Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Research Participation
                            </CardTitle>
                            <CardDescription>
                                Help advance PANDAS/PANS research by sharing anonymized data
                            </CardDescription>
                        </div>
                        {getConsentStatus(dataSharing.researchParticipation)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Your participation in research is completely voluntary and you can withdraw at any time.
                            All data shared for research purposes is anonymized and cannot be traced back to you or your child.
                        </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="research-consent" className="text-base font-medium">
                                Allow anonymized data sharing for research
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Share symptom patterns and treatment outcomes to help researchers understand PANDAS/PANS better
                            </p>
                        </div>
                        <Switch
                            id="research-consent"
                            checked={dataSharing.researchParticipation}
                            onCheckedChange={(checked) =>
                                handleConsentChange('research', checked, 'research participation')
                            }
                            disabled={loading || updating}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResearchInfo(true)}
                        >
                            <Info className="h-4 w-4 mr-2" />
                            Learn More About Research
                        </Button>
                        {getLatestConsent('research_participation') && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last updated: {new Date(getLatestConsent('research_participation')!.timestamp).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Anonymized Data Sharing Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Anonymized Data Sharing
                            </CardTitle>
                            <CardDescription>
                                Share anonymized data with healthcare partners for improved care
                            </CardDescription>
                        </div>
                        {getConsentStatus(dataSharing.anonymizedDataSharing)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="anonymized-consent" className="text-base font-medium">
                                Allow anonymized data sharing with healthcare partners
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Help healthcare providers understand treatment patterns and improve care protocols
                            </p>
                        </div>
                        <Switch
                            id="anonymized-consent"
                            checked={dataSharing.anonymizedDataSharing}
                            onCheckedChange={(checked) =>
                                handleConsentChange('anonymized', checked, 'anonymized data sharing')
                            }
                            disabled={loading || updating}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Third-Party Integrations Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Third-Party Integrations
                    </CardTitle>
                    <CardDescription>
                        Control data sharing with external services and applications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(dataSharing.thirdPartyIntegrations).length === 0 ? (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                No third-party integrations are currently configured.
                                When you connect external services, you'll be able to manage their data access here.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(dataSharing.thirdPartyIntegrations).map(([service, enabled]) => (
                                <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label className="text-base font-medium capitalize">{service}</Label>
                                        <p className="text-sm text-muted-foreground">
                                            External service integration
                                        </p>
                                    </div>
                                    <Switch
                                        checked={enabled}
                                        onCheckedChange={(checked) =>
                                            handleConsentChange('thirdParty', checked, `${service} integration`)
                                        }
                                        disabled={loading || updating}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Marketing Communications Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Marketing Communications
                            </CardTitle>
                            <CardDescription>
                                Control marketing and promotional communications
                            </CardDescription>
                        </div>
                        {getConsentStatus(dataSharing.marketingConsent)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="marketing-consent" className="text-base font-medium">
                                Receive marketing communications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get updates about new features, research findings, and community resources
                            </p>
                        </div>
                        <Switch
                            id="marketing-consent"
                            checked={dataSharing.marketingConsent}
                            onCheckedChange={(checked) =>
                                handleConsentChange('marketing', checked, 'marketing communications')
                            }
                            disabled={loading || updating}
                        />
                    </div>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Essential communications (security alerts, medical reminders) will continue regardless of this setting.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Consent History Section */}
            {dataSharing.consentHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Consent History
                        </CardTitle>
                        <CardDescription>
                            Track of all consent changes and their timestamps
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {dataSharing.consentHistory
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .slice(0, 10)
                                .map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                        <div>
                                            <span className="font-medium capitalize">
                                                {record.consentType.replace('_', ' ')}
                                            </span>
                                            <span className="ml-2">
                                                {record.granted ? 'granted' : 'revoked'}
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {new Date(record.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog open={!!pendingChange} onOpenChange={() => setPendingChange(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Consent Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingChange && (
                                <>
                                    You are about to <strong>{pendingChange.value ? 'grant' : 'revoke'}</strong> consent for{' '}
                                    <strong>{pendingChange.label}</strong>.
                                    <br /><br />
                                    This change will be logged for audit purposes and take effect immediately.
                                    {!pendingChange.value && (
                                        <>
                                            <br /><br />
                                            <strong>Note:</strong> Revoking consent will prevent future data sharing and notify affected parties.
                                        </>
                                    )}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelConsentChange} disabled={updating}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmConsentChange} disabled={updating}>
                            {updating ? 'Updating...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Research Information Dialog */}
            <Dialog open={showResearchInfo} onOpenChange={setShowResearchInfo}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Research Participation Information</DialogTitle>
                        <DialogDescription>
                            Learn how your data helps advance PANDAS/PANS research
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">What data is shared?</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Anonymized symptom patterns and severity scores</li>
                                <li>Treatment types and response patterns (no specific medications)</li>
                                <li>Age ranges and general demographic information</li>
                                <li>Timeline data (onset, flares, improvements)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">What is NOT shared?</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Names, addresses, or any identifying information</li>
                                <li>Specific medication names or dosages</li>
                                <li>Healthcare provider information</li>
                                <li>Photos or personal notes</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">How does this help?</h4>
                            <p className="text-sm text-muted-foreground">
                                Researchers use this anonymized data to identify patterns, understand treatment effectiveness,
                                and develop better diagnostic criteria. Your participation contributes to the growing body of
                                knowledge that helps all families affected by PANDAS/PANS.
                            </p>
                        </div>
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                All research data is handled according to strict privacy regulations and institutional review board guidelines.
                            </AlertDescription>
                        </Alert>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DataSharingPanel;