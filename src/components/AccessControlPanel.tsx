import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
    Users,
    UserPlus,
    Stethoscope,
    Clock,
    Shield,
    Edit2,
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
    Mail,
    User,
    Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { privacyService } from '@/lib/privacyService';
import {
    AccessControlSettings,
    FamilyMemberAccess,
    ProviderAccess,
    TemporaryAccess,
    Permission,
    FamilyRole,
    PERMISSION_GROUPS,
    ROLE_PERMISSIONS
} from '@/types/privacy';
import { toast } from 'sonner';

interface AccessControlPanelProps {
    accessControl: AccessControlSettings;
    onUpdate: (updates: Partial<AccessControlSettings>) => Promise<void>;
    loading?: boolean;
}

interface NewFamilyMemberForm {
    name: string;
    email: string;
    role: FamilyRole;
    permissions: Permission[];
}

interface NewProviderForm {
    providerName: string;
    providerEmail: string;
    organization: string;
    permissions: Permission[];
    expiresAt: string;
    accessMethod: 'magic_link' | 'direct_access';
}

interface NewTemporaryAccessForm {
    grantedTo: string;
    grantedToName: string;
    grantedToEmail: string;
    permissions: Permission[];
    expiresAt: string;
    maxAccessCount: number;
    purpose: string;
}

const AccessControlPanel: React.FC<AccessControlPanelProps> = ({
    accessControl,
    onUpdate,
    loading = false
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('family');
    const [showAddFamily, setShowAddFamily] = useState(false);
    const [showAddProvider, setShowAddProvider] = useState(false);
    const [showAddTemporary, setShowAddTemporary] = useState(false);
    const [editingAccess, setEditingAccess] = useState<string | null>(null);

    // Form states
    const [familyForm, setFamilyForm] = useState<NewFamilyMemberForm>({
        name: '',
        email: '',
        role: 'viewer',
        permissions: ROLE_PERMISSIONS.viewer
    });

    const [providerForm, setProviderForm] = useState<NewProviderForm>({
        providerName: '',
        providerEmail: '',
        organization: '',
        permissions: PERMISSION_GROUPS.view_only,
        expiresAt: '',
        accessMethod: 'magic_link'
    });

    const [temporaryForm, setTemporaryForm] = useState<NewTemporaryAccessForm>({
        grantedTo: '',
        grantedToName: '',
        grantedToEmail: '',
        permissions: PERMISSION_GROUPS.view_only,
        expiresAt: '',
        maxAccessCount: 5,
        purpose: ''
    });

    // Set default expiration dates
    useEffect(() => {
        const defaultProviderExpiry = new Date();
        defaultProviderExpiry.setMonth(defaultProviderExpiry.getMonth() + 3);

        const defaultTemporaryExpiry = new Date();
        defaultTemporaryExpiry.setDate(defaultTemporaryExpiry.getDate() + 7);

        setProviderForm(prev => ({
            ...prev,
            expiresAt: defaultProviderExpiry.toISOString().split('T')[0]
        }));

        setTemporaryForm(prev => ({
            ...prev,
            expiresAt: defaultTemporaryExpiry.toISOString().split('T')[0]
        }));
    }, []);

    // Handle role change for family members
    const handleRoleChange = (role: FamilyRole) => {
        setFamilyForm(prev => ({
            ...prev,
            role,
            permissions: ROLE_PERMISSIONS[role]
        }));
    };

    // Add family member
    const handleAddFamilyMember = async () => {
        if (!familyForm.name || !familyForm.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const newMember: FamilyMemberAccess = {
                id: crypto.randomUUID(),
                userId: '', // Will be populated when user accepts invitation
                name: familyForm.name,
                email: familyForm.email,
                role: familyForm.role,
                permissions: familyForm.permissions,
                grantedAt: new Date(),
                grantedBy: user?.uid || '',
                isActive: true
            };

            const updatedFamilyMembers = [...accessControl.familyMembers, newMember];
            await onUpdate({
                familyMembers: updatedFamilyMembers
            });

            setFamilyForm({
                name: '',
                email: '',
                role: 'viewer',
                permissions: ROLE_PERMISSIONS.viewer
            });
            setShowAddFamily(false);
            toast.success(`Family member access granted to ${familyForm.name}`);
        } catch (error) {
            console.error('Error adding family member:', error);
            toast.error('Failed to add family member');
        }
    };

    // Add healthcare provider
    const handleAddProvider = async () => {
        if (!providerForm.providerName || !providerForm.providerEmail) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const newProvider: ProviderAccess = {
                id: crypto.randomUUID(),
                providerName: providerForm.providerName,
                providerEmail: providerForm.providerEmail,
                organization: providerForm.organization,
                permissions: providerForm.permissions,
                grantedAt: new Date(),
                expiresAt: new Date(providerForm.expiresAt),
                isActive: true,
                accessMethod: providerForm.accessMethod
            };

            const updatedProviders = [...accessControl.healthcareProviders, newProvider];
            await onUpdate({
                healthcareProviders: updatedProviders
            });

            setProviderForm({
                providerName: '',
                providerEmail: '',
                organization: '',
                permissions: PERMISSION_GROUPS.view_only,
                expiresAt: '',
                accessMethod: 'magic_link'
            });
            setShowAddProvider(false);
            toast.success(`Provider access granted to ${providerForm.providerName}`);
        } catch (error) {
            console.error('Error adding provider:', error);
            toast.error('Failed to add provider');
        }
    };

    // Add temporary access
    const handleAddTemporaryAccess = async () => {
        if (!temporaryForm.grantedToName || !temporaryForm.grantedToEmail || !temporaryForm.purpose) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const newTemporaryAccess: TemporaryAccess = {
                id: crypto.randomUUID(),
                grantedTo: temporaryForm.grantedTo,
                grantedToName: temporaryForm.grantedToName,
                grantedToEmail: temporaryForm.grantedToEmail,
                permissions: temporaryForm.permissions,
                grantedAt: new Date(),
                expiresAt: new Date(temporaryForm.expiresAt),
                isActive: true,
                accessCount: 0,
                maxAccessCount: temporaryForm.maxAccessCount,
                purpose: temporaryForm.purpose
            };

            const updatedTemporaryAccess = [...accessControl.temporaryAccess, newTemporaryAccess];
            await onUpdate({
                temporaryAccess: updatedTemporaryAccess
            });

            setTemporaryForm({
                grantedTo: '',
                grantedToName: '',
                grantedToEmail: '',
                permissions: PERMISSION_GROUPS.view_only,
                expiresAt: '',
                maxAccessCount: 5,
                purpose: ''
            });
            setShowAddTemporary(false);
            toast.success(`Temporary access granted to ${temporaryForm.grantedToName}`);
        } catch (error) {
            console.error('Error adding temporary access:', error);
            toast.error('Failed to add temporary access');
        }
    };

    // Revoke access
    const handleRevokeAccess = async (accessId: string, accessType: 'family' | 'provider' | 'temporary', name: string) => {
        try {
            let updatedAccessControl = { ...accessControl };

            switch (accessType) {
                case 'family':
                    updatedAccessControl.familyMembers = accessControl.familyMembers.map(member =>
                        member.id === accessId ? { ...member, isActive: false } : member
                    );
                    break;
                case 'provider':
                    updatedAccessControl.healthcareProviders = accessControl.healthcareProviders.map(provider =>
                        provider.id === accessId ? { ...provider, isActive: false } : provider
                    );
                    break;
                case 'temporary':
                    updatedAccessControl.temporaryAccess = accessControl.temporaryAccess.map(temp =>
                        temp.id === accessId ? { ...temp, isActive: false } : temp
                    );
                    break;
            }

            await onUpdate(updatedAccessControl);
            toast.success(`Access revoked for ${name}`);
        } catch (error) {
            console.error('Error revoking access:', error);
            toast.error('Failed to revoke access');
        }
    };

    // Check if access is expired
    const isExpired = (expiresAt?: Date) => {
        if (!expiresAt) return false;
        return new Date() > expiresAt;
    };

    // Get status badge
    const getStatusBadge = (isActive: boolean, expiresAt?: Date) => {
        if (!isActive) {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        if (isExpired(expiresAt)) {
            return <Badge variant="secondary">Expired</Badge>;
        }
        return <Badge variant="default">Active</Badge>;
    };

    // Permission selector component
    const PermissionSelector: React.FC<{
        permissions: Permission[];
        onChange: (permissions: Permission[]) => void;
        disabled?: boolean;
    }> = ({ permissions, onChange, disabled = false }) => (
        <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-2">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => (
                    <div key={groupName} className="flex items-center space-x-2">
                        <Switch
                            checked={groupPermissions.every(p => permissions.includes(p))}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    onChange([...new Set([...permissions, ...groupPermissions])]);
                                } else {
                                    onChange(permissions.filter(p => !groupPermissions.includes(p)));
                                }
                            }}
                            disabled={disabled}
                        />
                        <Label className="text-sm capitalize">
                            {groupName.replace('_', ' ')} ({groupPermissions.length} permissions)
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Access Control Management
                    </CardTitle>
                    <CardDescription>
                        Manage who can access your family's medical data and their permission levels.
                        All access changes are logged for security and compliance.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="family" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Family Members
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Healthcare Providers
                    </TabsTrigger>
                    <TabsTrigger value="temporary" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Temporary Access
                    </TabsTrigger>
                </TabsList>

                {/* Family Members Tab */}
                <TabsContent value="family" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Family Members</CardTitle>
                                <CardDescription>
                                    Manage access for family members and caregivers
                                </CardDescription>
                            </div>
                            <Dialog open={showAddFamily} onOpenChange={setShowAddFamily}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Family Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Family Member</DialogTitle>
                                        <DialogDescription>
                                            Grant access to a family member or caregiver
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={familyForm.name}
                                                onChange={(e) => setFamilyForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={familyForm.email}
                                                onChange={(e) => setFamilyForm(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="role">Role</Label>
                                            <Select value={familyForm.role} onValueChange={handleRoleChange}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="parent">Parent - Full access</SelectItem>
                                                    <SelectItem value="guardian">Guardian - Full access</SelectItem>
                                                    <SelectItem value="caregiver">Caregiver - Edit access</SelectItem>
                                                    <SelectItem value="viewer">Viewer - Read only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <PermissionSelector
                                            permissions={familyForm.permissions}
                                            onChange={(permissions) => setFamilyForm(prev => ({ ...prev, permissions }))}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAddFamily(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddFamilyMember} disabled={loading}>
                                            Add Family Member
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {accessControl.familyMembers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No family members have been granted access yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {accessControl.familyMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <User className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Role: {member.role} • Granted: {member.grantedAt.toLocaleDateString()}
                                                        {member.lastAccessed && (
                                                            <span> • Last accessed: {member.lastAccessed.toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(member.isActive)}
                                                <Badge variant="outline" className="capitalize">
                                                    {member.role}
                                                </Badge>
                                                {member.isActive && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Revoke Family Access</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to revoke access for {member.name}?
                                                                    They will no longer be able to view or manage your family's medical data.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRevokeAccess(member.id, 'family', member.name)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Revoke Access
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Healthcare Providers Tab */}
                <TabsContent value="providers" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Healthcare Providers</CardTitle>
                                <CardDescription>
                                    Manage access for doctors, nurses, and other healthcare professionals
                                </CardDescription>
                            </div>
                            <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add Provider
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Add Healthcare Provider</DialogTitle>
                                        <DialogDescription>
                                            Grant access to a healthcare provider or medical professional
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="providerName">Provider Name</Label>
                                                <Input
                                                    id="providerName"
                                                    value={providerForm.providerName}
                                                    onChange={(e) => setProviderForm(prev => ({ ...prev, providerName: e.target.value }))}
                                                    placeholder="Dr. Smith"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="providerEmail">Email</Label>
                                                <Input
                                                    id="providerEmail"
                                                    type="email"
                                                    value={providerForm.providerEmail}
                                                    onChange={(e) => setProviderForm(prev => ({ ...prev, providerEmail: e.target.value }))}
                                                    placeholder="doctor@hospital.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="organization">Organization</Label>
                                            <Input
                                                id="organization"
                                                value={providerForm.organization}
                                                onChange={(e) => setProviderForm(prev => ({ ...prev, organization: e.target.value }))}
                                                placeholder="Hospital or clinic name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="expiresAt">Expires On</Label>
                                                <Input
                                                    id="expiresAt"
                                                    type="date"
                                                    value={providerForm.expiresAt}
                                                    onChange={(e) => setProviderForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="accessMethod">Access Method</Label>
                                                <Select
                                                    value={providerForm.accessMethod}
                                                    onValueChange={(value: 'magic_link' | 'direct_access') =>
                                                        setProviderForm(prev => ({ ...prev, accessMethod: value }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="magic_link">Magic Link</SelectItem>
                                                        <SelectItem value="direct_access">Direct Access</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <PermissionSelector
                                            permissions={providerForm.permissions}
                                            onChange={(permissions) => setProviderForm(prev => ({ ...prev, permissions }))}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAddProvider(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddProvider} disabled={loading}>
                                            Add Provider
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {accessControl.healthcareProviders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No healthcare providers have been granted access yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {accessControl.healthcareProviders.map((provider) => (
                                        <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Stethoscope className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{provider.providerName}</div>
                                                    <div className="text-sm text-muted-foreground">{provider.providerEmail}</div>
                                                    {provider.organization && (
                                                        <div className="text-sm text-muted-foreground">{provider.organization}</div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        Granted: {provider.grantedAt.toLocaleDateString()}
                                                        {provider.expiresAt && (
                                                            <span> • Expires: {provider.expiresAt.toLocaleDateString()}</span>
                                                        )}
                                                        {provider.lastAccessed && (
                                                            <span> • Last accessed: {provider.lastAccessed.toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(provider.isActive, provider.expiresAt)}
                                                <Badge variant="outline" className="capitalize">
                                                    {provider.accessMethod.replace('_', ' ')}
                                                </Badge>
                                                {provider.isActive && !isExpired(provider.expiresAt) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Revoke Provider Access</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to revoke access for {provider.providerName}?
                                                                    They will no longer be able to view your family's medical data.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRevokeAccess(provider.id, 'provider', provider.providerName)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Revoke Access
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Temporary Access Tab */}
                <TabsContent value="temporary" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Temporary Access</CardTitle>
                                <CardDescription>
                                    Grant time-limited access for specific purposes
                                </CardDescription>
                            </div>
                            <Dialog open={showAddTemporary} onOpenChange={setShowAddTemporary}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Clock className="h-4 w-4 mr-2" />
                                        Grant Temporary Access
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Grant Temporary Access</DialogTitle>
                                        <DialogDescription>
                                            Provide time-limited access for consultations, second opinions, or emergencies
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="grantedToName">Name</Label>
                                                <Input
                                                    id="grantedToName"
                                                    value={temporaryForm.grantedToName}
                                                    onChange={(e) => setTemporaryForm(prev => ({ ...prev, grantedToName: e.target.value }))}
                                                    placeholder="Full name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="grantedToEmail">Email</Label>
                                                <Input
                                                    id="grantedToEmail"
                                                    type="email"
                                                    value={temporaryForm.grantedToEmail}
                                                    onChange={(e) => setTemporaryForm(prev => ({ ...prev, grantedToEmail: e.target.value }))}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="purpose">Purpose</Label>
                                            <Textarea
                                                id="purpose"
                                                value={temporaryForm.purpose}
                                                onChange={(e) => setTemporaryForm(prev => ({ ...prev, purpose: e.target.value }))}
                                                placeholder="Describe the purpose of this access (e.g., second opinion consultation, emergency review)"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="tempExpiresAt">Expires On</Label>
                                                <Input
                                                    id="tempExpiresAt"
                                                    type="date"
                                                    value={temporaryForm.expiresAt}
                                                    onChange={(e) => setTemporaryForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="maxAccessCount">Max Access Count</Label>
                                                <Input
                                                    id="maxAccessCount"
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={temporaryForm.maxAccessCount}
                                                    onChange={(e) => setTemporaryForm(prev => ({ ...prev, maxAccessCount: parseInt(e.target.value) || 1 }))}
                                                />
                                            </div>
                                        </div>
                                        <PermissionSelector
                                            permissions={temporaryForm.permissions}
                                            onChange={(permissions) => setTemporaryForm(prev => ({ ...prev, permissions }))}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAddTemporary(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddTemporaryAccess} disabled={loading}>
                                            Grant Access
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {accessControl.temporaryAccess.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No temporary access has been granted yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {accessControl.temporaryAccess.map((temp) => (
                                        <div key={temp.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Clock className="h-8 w-8 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{temp.grantedToName}</div>
                                                    <div className="text-sm text-muted-foreground">{temp.grantedToEmail}</div>
                                                    <div className="text-sm text-muted-foreground">{temp.purpose}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Granted: {temp.grantedAt.toLocaleDateString()} •
                                                        Expires: {temp.expiresAt.toLocaleDateString()} •
                                                        Used: {temp.accessCount}/{temp.maxAccessCount || '∞'}
                                                        {temp.lastAccessed && (
                                                            <span> • Last accessed: {temp.lastAccessed.toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(temp.isActive, temp.expiresAt)}
                                                {temp.isActive && !isExpired(temp.expiresAt) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Revoke Temporary Access</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to revoke temporary access for {temp.grantedToName}?
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRevokeAccess(temp.id, 'temporary', temp.grantedToName)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Revoke Access
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Summary Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {accessControl.familyMembers.filter(m => m.isActive).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Family Members</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {accessControl.healthcareProviders.filter(p => p.isActive && !isExpired(p.expiresAt)).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Providers</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {accessControl.temporaryAccess.filter(t => t.isActive && !isExpired(t.expiresAt)).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Temporary Access</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    All access changes are immediately effective and logged for security purposes.
                    Revoked access cannot be restored - you'll need to grant new access if needed.
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default AccessControlPanel;