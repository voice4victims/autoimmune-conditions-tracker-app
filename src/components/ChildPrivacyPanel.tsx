import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Baby,
    Shield,
    Users,
    AlertTriangle,
    Clock,
    Settings,
    Info,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    ChildPrivacySettings,
    Permission,
    CommunicationType,
    DataRetentionSettings,
    PERMISSION_GROUPS
} from '@/types/privacy';
import { privacyService } from '@/lib/privacyService';

interface ChildPrivacyPanelProps {
    childSpecific: Record<string, ChildPrivacySettings>;
    onUpdate: (updates: Record<string, ChildPrivacySettings>) => Promise<void>;
    loading?: boolean;
}

interface ConflictResolution {
    childId: string;
    childName: string;
    conflictType: 'access_level' | 'retention_policy' | 'communication';
    currentSetting: any;
    recommendedSetting: any;
    reason: string;
}

interface AgeTransferCandidate {
    childId: string;
    childName: string;
    age: number;
    dateOfBirth: string;
    transferDate: Date;
    currentSettings: ChildPrivacySettings;
}

const ChildPrivacyPanel: React.FC<ChildPrivacyPanelProps> = ({
    childSpecific,
    onUpdate,
    loading = false
}) => {
    const { children } = useApp();
    const { user } = useAuth();
    const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
    const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
    const [ageTransferCandidates, setAgeTransferCandidates] = useState<AgeTransferCandidate[]>([]);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [processingTransfer, setProcessingTransfer] = useState(false);

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string): number => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    // Check for age-based transfer candidates (18+ years old)
    const checkAgeTransferCandidates = () => {
        const candidates: AgeTransferCandidate[] = [];

        children.forEach(child => {
            if (child.dateOfBirth) {
                const age = calculateAge(child.dateOfBirth);
                if (age >= 18) {
                    const childSettings = childSpecific[child.id];
                    if (childSettings && !childSettings.inheritFromParent) {
                        // Child already has independent settings, no transfer needed
                        return;
                    }

                    const transferDate = new Date(child.dateOfBirth);
                    transferDate.setFullYear(transferDate.getFullYear() + 18);

                    candidates.push({
                        childId: child.id,
                        childName: child.name,
                        age,
                        dateOfBirth: child.dateOfBirth,
                        transferDate,
                        currentSettings: childSettings || getDefaultChildSettings(child.id)
                    });
                }
            }
        });

        setAgeTransferCandidates(candidates);
    };

    // Detect privacy conflicts between children
    const detectPrivacyConflicts = () => {
        const detectedConflicts: ConflictResolution[] = [];

        // Check for conflicting access levels when data involves multiple children
        const childrenWithSettings = children.filter(child => childSpecific[child.id]);

        if (childrenWithSettings.length > 1) {
            // Find the most restrictive access level
            let mostRestrictiveLevel = 'full_access';
            let mostRestrictiveChild = '';

            childrenWithSettings.forEach(child => {
                const settings = childSpecific[child.id];
                if (settings.restrictedAccess) {
                    if (mostRestrictiveLevel !== 'restricted') {
                        mostRestrictiveLevel = 'restricted';
                        mostRestrictiveChild = child.name;
                    }
                }
            });

            // Check if any child has conflicting settings
            childrenWithSettings.forEach(child => {
                const settings = childSpecific[child.id];
                if (mostRestrictiveLevel === 'restricted' && !settings.restrictedAccess) {
                    detectedConflicts.push({
                        childId: child.id,
                        childName: child.name,
                        conflictType: 'access_level',
                        currentSetting: 'full_access',
                        recommendedSetting: 'restricted',
                        reason: `${mostRestrictiveChild} has restricted access settings that should apply to shared data`
                    });
                }
            });
        }

        setConflicts(detectedConflicts);
    };

    // Get default child privacy settings
    const getDefaultChildSettings = (childId: string): ChildPrivacySettings => ({
        childId,
        restrictedAccess: false,
        allowedUsers: [],
        communicationRestrictions: [],
        inheritFromParent: true
    });

    // Handle child settings update
    const handleChildSettingsUpdate = async (childId: string, updates: Partial<ChildPrivacySettings>) => {
        const currentSettings = childSpecific[childId] || getDefaultChildSettings(childId);
        const updatedSettings = { ...currentSettings, ...updates };

        const newChildSpecific = {
            ...childSpecific,
            [childId]: updatedSettings
        };

        await onUpdate(newChildSpecific);

        // Re-check for conflicts after update
        detectPrivacyConflicts();
    };

    // Handle age-based transfer
    const handleAgeTransfer = async (candidate: AgeTransferCandidate) => {
        setProcessingTransfer(true);

        try {
            // Create independent privacy settings for the child
            const independentSettings: ChildPrivacySettings = {
                ...candidate.currentSettings,
                inheritFromParent: false,
                restrictedAccess: false, // Default to less restrictive for adults
                allowedUsers: [user?.uid || ''], // Allow the child (now adult) full access
                communicationRestrictions: [] // Remove communication restrictions
            };

            await handleChildSettingsUpdate(candidate.childId, independentSettings);

            // Log the transfer
            await privacyService.logPrivacyAction(user?.uid || '', 'update_privacy_settings', {
                resourceType: 'child_privacy_transfer',
                resourceId: candidate.childId,
                details: `Privacy control transferred to adult child: ${candidate.childName}`
            });

            // Remove from candidates list
            setAgeTransferCandidates(prev => prev.filter(c => c.childId !== candidate.childId));

        } catch (error) {
            console.error('Error processing age transfer:', error);
        } finally {
            setProcessingTransfer(false);
        }
    };

    // Resolve privacy conflicts
    const resolveConflict = async (conflict: ConflictResolution) => {
        await handleChildSettingsUpdate(conflict.childId, {
            restrictedAccess: conflict.recommendedSetting === 'restricted'
        });

        setConflicts(prev => prev.filter(c => c.childId !== conflict.childId));
    };

    // Toggle child expansion
    const toggleChildExpansion = (childId: string) => {
        setExpandedChildren(prev => {
            const newSet = new Set(prev);
            if (newSet.has(childId)) {
                newSet.delete(childId);
            } else {
                newSet.add(childId);
            }
            return newSet;
        });
    };

    // Get permission group name
    const getPermissionGroupName = (permissions: Permission[]): string => {
        for (const [groupName, groupPermissions] of Object.entries(PERMISSION_GROUPS)) {
            if (permissions.length === groupPermissions.length &&
                permissions.every(p => groupPermissions.includes(p))) {
                return groupName.replace('_', ' ').toUpperCase();
            }
        }
        return 'CUSTOM';
    };

    useEffect(() => {
        checkAgeTransferCandidates();
        detectPrivacyConflicts();
    }, [children, childSpecific]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Baby className="h-5 w-5" />
                        Child-Specific Privacy Controls
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Loading child privacy settings...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (children.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Baby className="h-5 w-5" />
                        Child-Specific Privacy Controls
                    </CardTitle>
                    <CardDescription>
                        Set individual privacy preferences for each child's medical data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            No child profiles found. Add a child profile to manage their privacy settings.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Baby className="h-5 w-5" />
                        Child-Specific Privacy Controls
                    </CardTitle>
                    <CardDescription>
                        Set individual privacy preferences for each child's medical data.
                        Child-specific settings override family-wide settings when conflicts occur.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Age Transfer Notifications */}
            {ageTransferCandidates.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                            <Clock className="h-5 w-5" />
                            Privacy Control Transfer Available
                        </CardTitle>
                        <CardDescription className="text-orange-700">
                            Some children have reached the age of majority and can take control of their privacy settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ageTransferCandidates.map(candidate => (
                                <div key={candidate.childId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div>
                                        <p className="font-medium">{candidate.childName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Age: {candidate.age} | Eligible since: {candidate.transferDate.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleAgeTransfer(candidate)}
                                        disabled={processingTransfer}
                                        size="sm"
                                    >
                                        Transfer Control
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowTransferDialog(true)}
                            className="mt-3"
                        >
                            Learn More About Privacy Transfer
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Privacy Conflicts */}
            {conflicts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-5 w-5" />
                            Privacy Setting Conflicts Detected
                        </CardTitle>
                        <CardDescription className="text-red-700">
                            Some children have conflicting privacy settings that may affect shared data access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {conflicts.map(conflict => (
                                <div key={conflict.childId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div>
                                        <p className="font-medium">{conflict.childName}</p>
                                        <p className="text-sm text-muted-foreground">{conflict.reason}</p>
                                    </div>
                                    <Button
                                        onClick={() => resolveConflict(conflict)}
                                        size="sm"
                                        variant="destructive"
                                    >
                                        Apply Most Restrictive
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowConflictDialog(true)}
                            className="mt-3"
                        >
                            Learn More About Conflict Resolution
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Child Privacy Settings */}
            <div className="space-y-4">
                {children.map(child => {
                    const childSettings = childSpecific[child.id] || getDefaultChildSettings(child.id);
                    const isExpanded = expandedChildren.has(child.id);
                    const childAge = child.dateOfBirth ? calculateAge(child.dateOfBirth) : null;
                    const isAdult = childAge !== null && childAge >= 18;

                    return (
                        <Card key={child.id} className={isAdult ? 'border-blue-200' : ''}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleChildExpansion(child.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {child.name}
                                                {isAdult && (
                                                    <Badge variant="secondary">Adult</Badge>
                                                )}
                                                {childSettings.restrictedAccess && (
                                                    <Badge variant="destructive">Restricted</Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription>
                                                {childAge !== null && `Age: ${childAge} | `}
                                                {childSettings.inheritFromParent ? 'Inherits from family settings' : 'Custom privacy settings'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={!childSettings.inheritFromParent}
                                            onCheckedChange={(checked) =>
                                                handleChildSettingsUpdate(child.id, { inheritFromParent: !checked })
                                            }
                                            disabled={loading}
                                        />
                                        <Label className="text-sm">Custom Settings</Label>
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="space-y-6">
                                    {childSettings.inheritFromParent ? (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                This child inherits privacy settings from family-wide preferences.
                                                Enable "Custom Settings" to configure individual privacy controls.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            {/* Access Control */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    <h4 className="font-medium">Access Control</h4>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label>Restricted Access Mode</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Limit who can access this child's data
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={childSettings.restrictedAccess}
                                                        onCheckedChange={(checked) =>
                                                            handleChildSettingsUpdate(child.id, { restrictedAccess: checked })
                                                        }
                                                        disabled={loading}
                                                    />
                                                </div>

                                                {childSettings.restrictedAccess && (
                                                    <div className="ml-4 p-4 bg-muted rounded-lg space-y-3">
                                                        <Label>Allowed Users</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Only these users can access this child's data when restricted mode is enabled.
                                                        </p>
                                                        {/* This would integrate with the family member management system */}
                                                        <Alert>
                                                            <Info className="h-4 w-4" />
                                                            <AlertDescription>
                                                                User selection interface would be implemented here,
                                                                integrating with the family member access system.
                                                            </AlertDescription>
                                                        </Alert>
                                                    </div>
                                                )}
                                            </div>

                                            <Separator />

                                            {/* Data Retention Override */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Settings className="h-4 w-4" />
                                                    <h4 className="font-medium">Data Retention Override</h4>
                                                </div>

                                                <Alert>
                                                    <Info className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Child-specific data retention settings would override family-wide policies.
                                                        This feature integrates with the main data retention system.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>

                                            <Separator />

                                            {/* Communication Restrictions */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    <h4 className="font-medium">Communication Restrictions</h4>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label>Restricted Communication Types</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Prevent certain types of communications about this child's data.
                                                    </p>

                                                    {(['marketing_emails', 'third_party_marketing', 'sms_notifications'] as CommunicationType[]).map(commType => (
                                                        <div key={commType} className="flex items-center justify-between">
                                                            <Label className="text-sm">
                                                                {commType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </Label>
                                                            <Switch
                                                                checked={childSettings.communicationRestrictions.includes(commType)}
                                                                onCheckedChange={(checked) => {
                                                                    const restrictions = checked
                                                                        ? [...childSettings.communicationRestrictions, commType]
                                                                        : childSettings.communicationRestrictions.filter(r => r !== commType);
                                                                    handleChildSettingsUpdate(child.id, { communicationRestrictions: restrictions });
                                                                }}
                                                                disabled={loading}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Privacy Transfer Information Dialog */}
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Privacy Control Transfer</DialogTitle>
                        <DialogDescription>
                            Understanding age-based privacy control transfer
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            When a child reaches the age of majority (18 years), they become legally entitled
                            to control their own medical privacy settings. This system automatically detects
                            when children reach this age and offers to transfer privacy control.
                        </p>
                        <div className="space-y-2">
                            <h4 className="font-medium">What happens during transfer:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>The child gains independent privacy settings</li>
                                <li>Restrictive access controls are removed by default</li>
                                <li>Communication restrictions are lifted</li>
                                <li>The child can modify their own privacy preferences</li>
                                <li>Parents retain access unless explicitly revoked</li>
                            </ul>
                        </div>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                This transfer is permanent and aligns with legal requirements for medical privacy.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowTransferDialog(false)}>
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Conflict Resolution Information Dialog */}
            <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Privacy Conflict Resolution</DialogTitle>
                        <DialogDescription>
                            How the system handles conflicting privacy settings
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            When data involves multiple children with different privacy settings,
                            conflicts can arise. The system follows these rules:
                        </p>
                        <div className="space-y-2">
                            <h4 className="font-medium">Conflict Resolution Rules:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li><strong>Most Restrictive Wins:</strong> When children have different access levels, the most restrictive setting applies to shared data</li>
                                <li><strong>Child Settings Override Family:</strong> Individual child settings take precedence over family-wide settings</li>
                                <li><strong>Explicit Consent Required:</strong> Access to restricted data requires explicit permission from all affected children (or their guardians)</li>
                                <li><strong>Audit Trail Maintained:</strong> All conflict resolutions are logged for transparency</li>
                            </ul>
                        </div>
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Resolving conflicts by applying the most restrictive settings ensures maximum privacy protection.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowConflictDialog(false)}>
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChildPrivacyPanel;