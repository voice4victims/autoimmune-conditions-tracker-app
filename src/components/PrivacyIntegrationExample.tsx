import React, { useState } from 'react';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
import { EnhancedPermissionGuard, EnhancedConditionalRender } from './EnhancedPermissionGuard';
import { privacyAwareDataService } from '@/lib/privacyAwareDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedApp } from '@/contexts/EnhancedAppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Shield,
    Eye,
    Edit,
    Trash2,
    Users,
    FileText,
    Activity,
    Heart,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

/**
 * Example component demonstrating the integration of privacy settings with role-based access control
 */
export const PrivacyIntegrationExample: React.FC = () => {
    const { user } = useAuth();
    const { childProfile, canAccessChildData } = useEnhancedApp();
    const permissionContext = useEnhancedPermissions();
    const [testResults, setTestResults] = useState<Record<string, boolean>>({});

    // Test different permission scenarios
    const testPermissions = async () => {
        if (!user || !childProfile?.id) return;

        const tests = {
            'View Symptoms': await canAccessChildData(childProfile.id, 'symptoms', 'view'),
            'Edit Symptoms': await canAccessChildData(childProfile.id, 'symptoms', 'edit'),
            'View Treatments': await canAccessChildData(childProfile.id, 'treatments', 'view'),
            'Edit Treatments': await canAccessChildData(childProfile.id, 'treatments', 'edit'),
            'View Notes': await canAccessChildData(childProfile.id, 'notes', 'view'),
            'Edit Notes': await canAccessChildData(childProfile.id, 'notes', 'edit'),
            'View Files': await canAccessChildData(childProfile.id, 'files', 'view'),
            'Upload Files': await canAccessChildData(childProfile.id, 'files', 'edit'),
            'Export Data': await permissionContext.canExportData(childProfile.id),
            'Manage Child': await permissionContext.canManageChild(childProfile.id),
        };

        setTestResults(tests);
    };

    if (!user || !childProfile) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Please select a child profile to view privacy integration examples.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Privacy & Permission Integration Demo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <h4 className="font-medium mb-2">Current User Context</h4>
                            <div className="space-y-1 text-sm">
                                <p>User: {user.email}</p>
                                <p>Role: {permissionContext.role || 'None'}</p>
                                <p>Is Owner: {permissionContext.isOwner ? 'Yes' : 'No'}</p>
                                <p>Child: {childProfile.name}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Permission Summary</h4>
                            <div className="space-y-1 text-sm">
                                <p>Privacy Permissions: {permissionContext.effectivePermissions.length}</p>
                                <p>Role Permissions: {permissionContext.rolePermissions.length}</p>
                                <p>Loading: {permissionContext.loading ? 'Yes' : 'No'}</p>
                                {permissionContext.error && (
                                    <p className="text-destructive">Error: {permissionContext.error}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button onClick={testPermissions} className="mb-4">
                        Test Permissions
                    </Button>

                    {Object.keys(testResults).length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            {Object.entries(testResults).map(([test, result]) => (
                                <Badge
                                    key={test}
                                    variant={result ? 'default' : 'secondary'}
                                    className="justify-center"
                                >
                                    {result ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                    {test}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="guards" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="guards">Permission Guards</TabsTrigger>
                    <TabsTrigger value="data">Data Access</TabsTrigger>
                    <TabsTrigger value="roles">Role Integration</TabsTrigger>
                    <TabsTrigger value="audit">Audit Logging</TabsTrigger>
                </TabsList>

                <TabsContent value="guards" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enhanced Permission Guards</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Basic privacy permission guard */}
                            <div>
                                <h4 className="font-medium mb-2">View Symptoms (Privacy Permission)</h4>
                                <EnhancedPermissionGuard
                                    privacyPermissions={['view_symptoms']}
                                    childId={childProfile.id}
                                    showPermissionDetails={true}
                                >
                                    <Alert>
                                        <Eye className="h-4 w-4" />
                                        <AlertDescription>
                                            You can view symptoms for this child.
                                        </AlertDescription>
                                    </Alert>
                                </EnhancedPermissionGuard>
                            </div>

                            {/* Combined privacy and role permission guard */}
                            <div>
                                <h4 className="font-medium mb-2">Edit Treatments (Privacy + Role)</h4>
                                <EnhancedPermissionGuard
                                    privacyPermissions={['edit_treatments']}
                                    rolePermissions={['write_data']}
                                    childId={childProfile.id}
                                    requireBoth={true}
                                    showPermissionDetails={true}
                                >
                                    <Alert>
                                        <Edit className="h-4 w-4" />
                                        <AlertDescription>
                                            You can edit treatments for this child.
                                        </AlertDescription>
                                    </Alert>
                                </EnhancedPermissionGuard>
                            </div>

                            {/* Data type specific guard */}
                            <div>
                                <h4 className="font-medium mb-2">Delete Notes (Data Type Specific)</h4>
                                <EnhancedPermissionGuard
                                    dataType="notes"
                                    dataAction="delete"
                                    childId={childProfile.id}
                                    showPermissionDetails={true}
                                >
                                    <Alert className="border-destructive">
                                        <Trash2 className="h-4 w-4" />
                                        <AlertDescription>
                                            You can delete notes for this child.
                                        </AlertDescription>
                                    </Alert>
                                </EnhancedPermissionGuard>
                            </div>

                            {/* Role-based guard */}
                            <div>
                                <h4 className="font-medium mb-2">Manage Users (Role-Based)</h4>
                                <EnhancedPermissionGuard
                                    rolePermissions={['manage_users']}
                                    roles={['admin', 'parent']}
                                    showPermissionDetails={true}
                                >
                                    <Alert>
                                        <Users className="h-4 w-4" />
                                        <AlertDescription>
                                            You can manage family members and access controls.
                                        </AlertDescription>
                                    </Alert>
                                </EnhancedPermissionGuard>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy-Aware Data Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Conditional rendering based on permissions */}
                            <div>
                                <h4 className="font-medium mb-2">Conditional Data Display</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <EnhancedConditionalRender
                                        privacyPermissions={['view_symptoms']}
                                        childId={childProfile.id}
                                    >
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Activity className="w-8 h-8 text-blue-500 mb-2" />
                                                <h5 className="font-medium">Symptoms Data</h5>
                                                <p className="text-sm text-muted-foreground">
                                                    Symptom tracking and analysis available
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </EnhancedConditionalRender>

                                    <EnhancedConditionalRender
                                        privacyPermissions={['view_vitals']}
                                        childId={childProfile.id}
                                    >
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Heart className="w-8 h-8 text-red-500 mb-2" />
                                                <h5 className="font-medium">Vital Signs</h5>
                                                <p className="text-sm text-muted-foreground">
                                                    Heart rate, temperature, and other vitals
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </EnhancedConditionalRender>

                                    <EnhancedConditionalRender
                                        privacyPermissions={['view_notes']}
                                        childId={childProfile.id}
                                    >
                                        <Card>
                                            <CardContent className="pt-6">
                                                <FileText className="w-8 h-8 text-green-500 mb-2" />
                                                <h5 className="font-medium">Notes & Observations</h5>
                                                <p className="text-sm text-muted-foreground">
                                                    Daily notes and observations
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </EnhancedConditionalRender>

                                    <EnhancedConditionalRender
                                        privacyPermissions={['export_data']}
                                        rolePermissions={['export_data']}
                                        requireBoth={true}
                                        childId={childProfile.id}
                                    >
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Shield className="w-8 h-8 text-purple-500 mb-2" />
                                                <h5 className="font-medium">Data Export</h5>
                                                <p className="text-sm text-muted-foreground">
                                                    Export all child data securely
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </EnhancedConditionalRender>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role-Based Access Integration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-2">Current Role Permissions</h4>
                                    <div className="space-y-1">
                                        {permissionContext.rolePermissions.map((permission) => (
                                            <Badge key={permission} variant="outline">
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Current Privacy Permissions</h4>
                                    <div className="space-y-1">
                                        {permissionContext.effectivePermissions.map((permission) => (
                                            <Badge key={permission} variant="outline">
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Permission Hierarchy Examples</h4>
                                <div className="space-y-2">
                                    <EnhancedPermissionGuard
                                        roles={['admin']}
                                        fallback={
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Admin role required for this action
                                                </AlertDescription>
                                            </Alert>
                                        }
                                    >
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Admin access granted - full system control
                                            </AlertDescription>
                                        </Alert>
                                    </EnhancedPermissionGuard>

                                    <EnhancedPermissionGuard
                                        roles={['parent', 'guardian']}
                                        fallback={
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Parent or Guardian role required
                                                </AlertDescription>
                                            </Alert>
                                        }
                                    >
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Parent/Guardian access - can manage child data
                                            </AlertDescription>
                                        </Alert>
                                    </EnhancedPermissionGuard>

                                    <EnhancedPermissionGuard
                                        roles={['caregiver']}
                                        fallback={
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Caregiver role required
                                                </AlertDescription>
                                            </Alert>
                                        }
                                    >
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                Caregiver access - can view and edit basic data
                                            </AlertDescription>
                                        </Alert>
                                    </EnhancedPermissionGuard>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audit Logging Integration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    All permission checks and data access attempts are automatically logged for HIPAA compliance.
                                    This includes successful access, denied access, and error conditions.
                                </AlertDescription>
                            </Alert>

                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Logged Activities Include:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Permission checks and results</li>
                                    <li>Data access attempts (view, edit, delete)</li>
                                    <li>Role changes and access grants/revocations</li>
                                    <li>Privacy setting modifications</li>
                                    <li>Data export and sharing activities</li>
                                    <li>Failed access attempts and security violations</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};