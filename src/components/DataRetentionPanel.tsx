import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Trash2,
    Clock,
    Shield,
    AlertTriangle,
    Calendar,
    Database,
    FileX,
    Info,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { DataRetentionSettings, DeletionScope, DeletionRequest, LegalHold } from '@/types/privacy';
import { privacyService } from '@/lib/privacyService';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

interface DataRetentionPanelProps {
    dataRetention: DataRetentionSettings;
    onUpdate: (updates: Partial<DataRetentionSettings>) => Promise<void>;
    loading?: boolean;
}

interface DeletionRequestFormData {
    scope: DeletionScope;
    reason: string;
    childId?: string;
    startDate?: string;
    endDate?: string;
    dataTypes?: string[];
}

const DataRetentionPanel: React.FC<DataRetentionPanelProps> = ({
    dataRetention,
    onUpdate,
    loading = false
}) => {
    const { user } = useAuth();
    const { children } = useApp();
    const [localSettings, setLocalSettings] = useState<DataRetentionSettings>(dataRetention);
    const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
    const [showDeletionForm, setShowDeletionForm] = useState(false);
    const [deletionFormData, setDeletionFormData] = useState<DeletionRequestFormData>({
        scope: 'all_data',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load deletion requests on component mount
    useEffect(() => {
        loadDeletionRequests();
    }, [user?.uid]);

    // Update local settings when props change
    useEffect(() => {
        setLocalSettings(dataRetention);
    }, [dataRetention]);

    const loadDeletionRequests = async () => {
        if (!user?.uid) return;

        try {
            const requests = await privacyService.getDeletionRequests(user.uid);
            setDeletionRequests(requests);
        } catch (err) {
            console.error('Error loading deletion requests:', err);
            setError('Failed to load deletion requests');
        }
    };

    const handleSettingChange = async (key: keyof DataRetentionSettings, value: any) => {
        const updatedSettings = { ...localSettings, [key]: value };
        setLocalSettings(updatedSettings);

        try {
            await onUpdate(updatedSettings);
            setSuccess('Data retention settings updated successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update settings');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDeletionRequest = async () => {
        if (!user?.uid) return;

        setSubmitting(true);
        setError(null);

        try {
            const requestId = await privacyService.requestDataDeletion(
                user.uid,
                deletionFormData.scope,
                deletionFormData.reason
            );

            setSuccess('Data deletion request submitted successfully. You will receive confirmation within 30 days.');
            setShowDeletionForm(false);
            setDeletionFormData({ scope: 'all_data', reason: '' });
            await loadDeletionRequests();
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit deletion request');
        } finally {
            setSubmitting(false);
        }
    };

    const getRetentionPeriodText = (months: number) => {
        if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
        return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    };

    const getDeletionScopeDescription = (scope: DeletionScope) => {
        switch (scope) {
            case 'all_data':
                return 'All medical data, profiles, and account information';
            case 'child_specific':
                return 'Data for a specific child only';
            case 'date_range':
                return 'Data within a specific date range';
            case 'data_type_specific':
                return 'Specific types of data (symptoms, treatments, etc.)';
            default:
                return 'Unknown scope';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'scheduled':
                return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
            case 'in_progress':
                return <Badge variant="default"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            case 'blocked_legal_hold':
                return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Blocked</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const activeLegalHolds = localSettings.legalHolds.filter(hold => hold.isActive);
    const hasActiveLegalHolds = activeLegalHolds.length > 0;

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Automatic Data Retention */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Automatic Data Retention
                    </CardTitle>
                    <CardDescription>
                        Configure how long your medical data is automatically stored
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="automatic-deletion">Enable Automatic Deletion</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically delete data after the retention period expires
                            </p>
                        </div>
                        <Switch
                            id="automatic-deletion"
                            checked={localSettings.automaticDeletion}
                            onCheckedChange={(checked) => handleSettingChange('automaticDeletion', checked)}
                            disabled={loading || hasActiveLegalHolds}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="retention-period">Data Retention Period</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="retention-period"
                                type="number"
                                min="1"
                                max="120"
                                value={localSettings.retentionPeriod}
                                onChange={(e) => handleSettingChange('retentionPeriod', parseInt(e.target.value) || 84)}
                                className="w-24"
                                disabled={loading}
                            />
                            <span className="text-sm text-muted-foreground">months</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Current setting: {getRetentionPeriodText(localSettings.retentionPeriod)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="inactivity-deletion">Delete After Inactivity</Label>
                            <p className="text-sm text-muted-foreground">
                                Delete data if account is inactive for extended period
                            </p>
                        </div>
                        <Switch
                            id="inactivity-deletion"
                            checked={localSettings.deleteAfterInactivity}
                            onCheckedChange={(checked) => handleSettingChange('deleteAfterInactivity', checked)}
                            disabled={loading || hasActiveLegalHolds}
                        />
                    </div>

                    {localSettings.deleteAfterInactivity && (
                        <div className="space-y-2">
                            <Label htmlFor="inactivity-period">Inactivity Period</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="inactivity-period"
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={localSettings.inactivityPeriod}
                                    onChange={(e) => handleSettingChange('inactivityPeriod', parseInt(e.target.value) || 24)}
                                    className="w-24"
                                    disabled={loading}
                                />
                                <span className="text-sm text-muted-foreground">months</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Delete data after {getRetentionPeriodText(localSettings.inactivityPeriod)} of inactivity
                            </p>
                        </div>
                    )}

                    {hasActiveLegalHolds && (
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                Automatic deletion is disabled due to active legal holds. Data cannot be automatically deleted while legal holds are in place.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Legal Holds */}
            {activeLegalHolds.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Active Legal Holds
                        </CardTitle>
                        <CardDescription>
                            Legal holds prevent data deletion for compliance purposes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeLegalHolds.map((hold) => (
                                <div key={hold.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium">{hold.reason}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Applied on {hold.appliedAt.toLocaleDateString()}
                                                {hold.expiresAt && ` • Expires ${hold.expiresAt.toLocaleDateString()}`}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {hold.affectedDataTypes.map((type) => (
                                                    <Badge key={type} variant="outline" className="text-xs">
                                                        {type}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Badge variant="destructive">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Active Hold
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manual Data Deletion */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Manual Data Deletion
                    </CardTitle>
                    <CardDescription>
                        Request immediate deletion of specific data or your entire account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Data deletion requests are processed within 30 days. Some data may be retained for legal or regulatory compliance.
                            {hasActiveLegalHolds && ' Current legal holds may prevent some data from being deleted.'}
                        </AlertDescription>
                    </Alert>

                    <AlertDialog open={showDeletionForm} onOpenChange={setShowDeletionForm}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Request Data Deletion
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Request Data Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Please specify what data you would like to delete. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deletion-scope">Deletion Scope</Label>
                                    <Select
                                        value={deletionFormData.scope}
                                        onValueChange={(value: DeletionScope) =>
                                            setDeletionFormData(prev => ({ ...prev, scope: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_data">All Data</SelectItem>
                                            <SelectItem value="child_specific">Child-Specific Data</SelectItem>
                                            <SelectItem value="date_range">Date Range</SelectItem>
                                            <SelectItem value="data_type_specific">Specific Data Types</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        {getDeletionScopeDescription(deletionFormData.scope)}
                                    </p>
                                </div>

                                {deletionFormData.scope === 'child_specific' && children.length > 0 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="child-selection">Select Child</Label>
                                        <Select
                                            value={deletionFormData.childId || ''}
                                            onValueChange={(value) =>
                                                setDeletionFormData(prev => ({ ...prev, childId: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a child" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {children.map((child) => (
                                                    <SelectItem key={child.id} value={child.id}>
                                                        {child.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {deletionFormData.scope === 'date_range' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start-date">Start Date</Label>
                                            <Input
                                                id="start-date"
                                                type="date"
                                                value={deletionFormData.startDate || ''}
                                                onChange={(e) =>
                                                    setDeletionFormData(prev => ({ ...prev, startDate: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end-date">End Date</Label>
                                            <Input
                                                id="end-date"
                                                type="date"
                                                value={deletionFormData.endDate || ''}
                                                onChange={(e) =>
                                                    setDeletionFormData(prev => ({ ...prev, endDate: e.target.value }))
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="deletion-reason">Reason for Deletion (Required)</Label>
                                    <Textarea
                                        id="deletion-reason"
                                        placeholder="Please explain why you are requesting this data deletion..."
                                        value={deletionFormData.reason}
                                        onChange={(e) =>
                                            setDeletionFormData(prev => ({ ...prev, reason: e.target.value }))
                                        }
                                        rows={3}
                                    />
                                </div>

                                {hasActiveLegalHolds && (
                                    <Alert variant="destructive">
                                        <Shield className="h-4 w-4" />
                                        <AlertDescription>
                                            Some data may not be deleted due to active legal holds. You will be notified of any restrictions.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeletionRequest}
                                    disabled={!deletionFormData.reason.trim() || submitting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Submit Deletion Request
                                        </>
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            {/* Deletion Request History */}
            {deletionRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileX className="h-5 w-5" />
                            Deletion Request History
                        </CardTitle>
                        <CardDescription>
                            Track the status of your data deletion requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {deletionRequests.map((request) => (
                                <div key={request.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {getDeletionScopeDescription(request.deletionScope)}
                                                </p>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Requested on {request.requestedAt.toLocaleDateString()}
                                                {request.scheduledFor && ` • Scheduled for ${request.scheduledFor.toLocaleDateString()}`}
                                                {request.completedAt && ` • Completed on ${request.completedAt.toLocaleDateString()}`}
                                            </p>
                                            {request.reason && (
                                                <p className="text-sm text-muted-foreground">
                                                    Reason: {request.reason}
                                                </p>
                                            )}
                                            {request.legalHoldBlocked && (
                                                <Alert variant="destructive" className="mt-2">
                                                    <Shield className="h-4 w-4" />
                                                    <AlertDescription>
                                                        This deletion request is blocked by active legal holds.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Retention Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Data Retention Information
                    </CardTitle>
                    <CardDescription>
                        Understanding how your data is managed and stored
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">Current Retention Policy</h4>
                            <p className="text-sm text-muted-foreground">
                                Data is retained for {getRetentionPeriodText(localSettings.retentionPeriod)}
                                {localSettings.automaticDeletion ? ' and then automatically deleted' : ' (manual deletion required)'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Inactivity Policy</h4>
                            <p className="text-sm text-muted-foreground">
                                {localSettings.deleteAfterInactivity
                                    ? `Data deleted after ${getRetentionPeriodText(localSettings.inactivityPeriod)} of inactivity`
                                    : 'No automatic deletion for inactive accounts'
                                }
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="font-medium">Important Notes</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Some data may be retained longer for legal or regulatory compliance</li>
                            <li>Anonymized data used for research may be retained beyond personal data deletion</li>
                            <li>Audit logs and security records may have different retention periods</li>
                            <li>Data deletion requests are processed within 30 days of submission</li>
                            {hasActiveLegalHolds && (
                                <li className="text-destructive">Active legal holds may prevent deletion of some data</li>
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DataRetentionPanel;