import React from 'react';
import { usePermissions } from '@/hooks/useRoleAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/RoleSelector';
import { Shield, Users, Eye, Heart, CheckCircle, XCircle } from 'lucide-react';

export const RoleDashboard: React.FC = () => {
    const permissions = usePermissions();

    const permissionsList = [
        { key: 'read_data', label: 'View Data', description: 'View symptoms, treatments, and medical records' },
        { key: 'write_data', label: 'Add/Edit Data', description: 'Add new symptoms, treatments, and notes' },
        { key: 'delete_data', label: 'Delete Data', description: 'Remove symptoms, treatments, and records' },
        { key: 'manage_users', label: 'Manage Users', description: 'Edit user roles and remove access' },
        { key: 'invite_users', label: 'Invite Users', description: 'Send invitations to new family members' },
        { key: 'export_data', label: 'Export Data', description: 'Download reports and export medical data' },
        { key: 'manage_settings', label: 'Manage Settings', description: 'Change app settings and preferences' },
        { key: 'view_analytics', label: 'View Analytics', description: 'Access advanced charts and insights' }
    ];

    if (!permissions.role) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <XCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        No Access
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                        You don't have access to this family's data. Please contact the family administrator.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Your Access Level
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <RoleBadge role={permissions.role} size="lg" />
                        {permissions.isOwner && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Owner
                            </Badge>
                        )}
                    </div>

                    <div className="grid gap-3">
                        {permissionsList.map((perm) => {
                            const hasPermission = permissions.hasPermission(perm.key as any);
                            return (
                                <div key={perm.key} className="flex items-start gap-3 p-3 rounded-lg border">
                                    {hasPermission ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{perm.label}</div>
                                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {permissions.role === 'viewer' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Viewer Access</h4>
                        </div>
                        <p className="text-sm text-blue-800">
                            You have read-only access to this family's data. You can view all information but cannot make changes.
                        </p>
                    </CardContent>
                </Card>
            )}

            {permissions.role === 'caregiver' && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-900">Caregiver Access</h4>
                        </div>
                        <p className="text-sm text-green-800">
                            You can view and add data to help track the child's condition. Contact a parent or admin to delete data or manage users.
                        </p>
                    </CardContent>
                </Card>
            )}

            {permissions.role === 'parent' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Parent Access</h4>
                        </div>
                        <p className="text-sm text-blue-800">
                            You have full access to manage your child's data and can invite other family members to help with tracking.
                        </p>
                    </CardContent>
                </Card>
            )}

            {permissions.role === 'admin' && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-red-900">Administrator Access</h4>
                        </div>
                        <p className="text-sm text-red-800">
                            You have complete control over this family's data and user management. Use this access responsibly.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};