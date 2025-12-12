import React, { useState, useEffect } from 'react';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
import { Permission as PrivacyPermission } from '@/types/privacy';
import { Permission as RolePermission, UserRole } from '@/types/roles';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertCircle, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedPermissionGuardProps {
    children: React.ReactNode;

    // Privacy-based permissions
    privacyPermissions?: PrivacyPermission[];

    // Role-based permissions
    rolePermissions?: RolePermission[];
    roles?: UserRole[];

    // Data access control
    dataType?: string;
    dataAction?: 'view' | 'edit' | 'delete';
    childId?: string;
    targetUserId?: string;

    // Permission logic
    requireAll?: boolean;
    requireBoth?: boolean; // Require both privacy AND role permissions

    // UI customization
    fallback?: React.ReactNode;
    showFallback?: boolean;
    loadingComponent?: React.ReactNode;
    showPermissionDetails?: boolean;
    allowOverride?: boolean;

    // Callbacks
    onAccessDenied?: (reason: string) => void;
    onAccessGranted?: () => void;
}

export const EnhancedPermissionGuard: React.FC<EnhancedPermissionGuardProps> = ({
    children,
    privacyPermissions = [],
    rolePermissions = [],
    roles = [],
    dataType,
    dataAction = 'view',
    childId,
    targetUserId,
    requireAll = false,
    requireBoth = false,
    fallback,
    showFallback = true,
    loadingComponent,
    showPermissionDetails = false,
    allowOverride = false,
    onAccessDenied,
    onAccessGranted
}) => {
    const permissionContext = useEnhancedPermissions(targetUserId);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [accessReason, setAccessReason] = useState<string>('');
    const [showOverride, setShowOverride] = useState(false);
    const [overrideUsed, setOverrideUsed] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (permissionContext.loading) {
                return;
            }

            try {
                let hasPrivacyAccess = true;
                let hasRoleAccess = true;
                let hasDataAccess = true;
                let reason = '';

                // Check role-based access
                if (roles.length > 0) {
                    hasRoleAccess = permissionContext.role ? roles.includes(permissionContext.role) : false;
                    if (!hasRoleAccess) {
                        reason += `Required role: ${roles.join(' or ')}. Current role: ${permissionContext.role || 'none'}. `;
                    }
                }

                // Check role permissions
                if (rolePermissions.length > 0) {
                    hasRoleAccess = hasRoleAccess && (requireAll
                        ? rolePermissions.every(p => permissionContext.hasRolePermission(p))
                        : rolePermissions.some(p => permissionContext.hasRolePermission(p))
                    );

                    if (!hasRoleAccess) {
                        reason += `Required role permissions: ${rolePermissions.join(requireAll ? ' and ' : ' or ')}. `;
                    }
                }

                // Check privacy permissions
                if (privacyPermissions.length > 0) {
                    const privacyChecks = await Promise.all(
                        privacyPermissions.map(p => permissionContext.hasPrivacyPermission(p, childId))
                    );

                    hasPrivacyAccess = requireAll
                        ? privacyChecks.every(Boolean)
                        : privacyChecks.some(Boolean);

                    if (!hasPrivacyAccess) {
                        reason += `Required privacy permissions: ${privacyPermissions.join(requireAll ? ' and ' : ' or ')}. `;
                    }
                }

                // Check data access if specified
                if (dataType) {
                    hasDataAccess = await permissionContext.canAccessData(dataType, childId, dataAction);
                    if (!hasDataAccess) {
                        reason += `Cannot ${dataAction} ${dataType} data${childId ? ` for child ${childId}` : ''}. `;
                    }
                }

                // Determine final access
                let finalAccess: boolean;
                if (requireBoth) {
                    finalAccess = hasPrivacyAccess && hasRoleAccess && hasDataAccess;
                } else {
                    finalAccess = (privacyPermissions.length === 0 || hasPrivacyAccess) &&
                        (rolePermissions.length === 0 && roles.length === 0 || hasRoleAccess) &&
                        hasDataAccess;
                }

                setHasAccess(finalAccess || overrideUsed);
                setAccessReason(reason.trim());

                // Call callbacks
                if (finalAccess || overrideUsed) {
                    onAccessGranted?.();
                } else {
                    onAccessDenied?.(reason.trim());
                }

                // Log access attempt
                if (dataType) {
                    await permissionContext.logAccess(
                        finalAccess ? 'view_data' : 'access_denied',
                        dataType,
                        undefined,
                        childId
                    );
                }

            } catch (error) {
                console.error('Error checking enhanced permissions:', error);
                setHasAccess(false);
                setAccessReason('Error checking permissions');
                onAccessDenied?.('Error checking permissions');
            }
        };

        checkAccess();
    }, [
        permissionContext,
        privacyPermissions,
        rolePermissions,
        roles,
        dataType,
        dataAction,
        childId,
        requireAll,
        requireBoth,
        overrideUsed
    ]);

    // Show loading state
    if (permissionContext.loading || hasAccess === null) {
        if (loadingComponent) {
            return <>{loadingComponent}</>;
        }

        return (
            <Card className="mx-1 md:mx-0">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Checking permissions...</span>
                </CardContent>
            </Card>
        );
    }

    // Grant access
    if (hasAccess) {
        return <>{children}</>;
    }

    // Deny access
    if (!showFallback) {
        return null;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // Default enhanced fallback UI
    return (
        <Card className="mx-1 md:mx-0">
            <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center mb-6">
                    <div className="relative mb-4">
                        <Shield className="w-12 h-12 text-muted-foreground" />
                        <Lock className="w-6 h-6 text-destructive absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
                    </div>

                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        Access Restricted
                    </h3>

                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                        You don't have the required permissions to access this feature.
                        This restriction is based on privacy settings and role-based access controls.
                    </p>

                    {permissionContext.error && (
                        <Alert className="mb-4 max-w-md">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {permissionContext.error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {showPermissionDetails && (
                    <div className="space-y-4 max-w-md mx-auto">
                        <div className="text-left">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                                <Eye className="w-4 h-4 mr-2" />
                                Current Access Level
                            </h4>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Role: {permissionContext.role || 'None'}</p>
                                <p>Owner: {permissionContext.isOwner ? 'Yes' : 'No'}</p>
                                <p>Privacy Permissions: {permissionContext.effectivePermissions.length}</p>
                                <p>Role Permissions: {permissionContext.rolePermissions.length}</p>
                            </div>
                        </div>

                        {accessReason && (
                            <div className="text-left">
                                <h4 className="text-sm font-medium mb-2 flex items-center">
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Access Denied Because
                                </h4>
                                <p className="text-xs text-muted-foreground">{accessReason}</p>
                            </div>
                        )}

                        {(privacyPermissions.length > 0 || rolePermissions.length > 0) && (
                            <div className="text-left">
                                <h4 className="text-sm font-medium mb-2">Required Permissions</h4>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    {privacyPermissions.length > 0 && (
                                        <p>Privacy: {privacyPermissions.join(', ')}</p>
                                    )}
                                    {rolePermissions.length > 0 && (
                                        <p>Role: {rolePermissions.join(', ')}</p>
                                    )}
                                    {roles.length > 0 && (
                                        <p>Required Role: {roles.join(' or ')}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {allowOverride && !overrideUsed && (
                    <div className="mt-6 flex flex-col items-center space-y-2">
                        {!showOverride ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOverride(true)}
                                className="text-xs"
                            >
                                Request Access Override
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <Alert className="max-w-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        Override will be logged for audit purposes. Use only when necessary.
                                    </AlertDescription>
                                </Alert>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setOverrideUsed(true);
                                            setShowOverride(false);
                                        }}
                                        className="text-xs"
                                    >
                                        Confirm Override
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowOverride(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Conditional render component for enhanced permissions
interface EnhancedConditionalRenderProps extends Omit<EnhancedPermissionGuardProps, 'showFallback'> {
    fallback?: React.ReactNode;
}

export const EnhancedConditionalRender: React.FC<EnhancedConditionalRenderProps> = ({
    children,
    fallback = null,
    ...props
}) => {
    return (
        <EnhancedPermissionGuard
            {...props}
            fallback={fallback}
            showFallback={false}
        >
            {children}
        </EnhancedPermissionGuard>
    );
};

// Higher-order component for enhanced permission protection
export const withEnhancedPermissions = <P extends object>(
    Component: React.ComponentType<P>,
    guardProps: Omit<EnhancedPermissionGuardProps, 'children'>
) => {
    return (props: P) => (
        <EnhancedPermissionGuard {...guardProps}>
            <Component {...props} />
        </EnhancedPermissionGuard>
    );
};

// Hook for component-level permission checking
export const useComponentPermissions = (
    privacyPermissions: PrivacyPermission[] = [],
    rolePermissions: RolePermission[] = [],
    roles: UserRole[] = [],
    dataType?: string,
    childId?: string,
    targetUserId?: string
) => {
    const permissionContext = useEnhancedPermissions(targetUserId);
    const [canAccess, setCanAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = async () => {
            if (permissionContext.loading) return;

            try {
                let hasAccess = true;

                // Check roles
                if (roles.length > 0) {
                    hasAccess = hasAccess && (permissionContext.role ? roles.includes(permissionContext.role) : false);
                }

                // Check role permissions
                if (rolePermissions.length > 0) {
                    hasAccess = hasAccess && rolePermissions.some(p => permissionContext.hasRolePermission(p));
                }

                // Check privacy permissions
                if (privacyPermissions.length > 0) {
                    const privacyChecks = await Promise.all(
                        privacyPermissions.map(p => permissionContext.hasPrivacyPermission(p, childId))
                    );
                    hasAccess = hasAccess && privacyChecks.some(Boolean);
                }

                // Check data access
                if (dataType) {
                    hasAccess = hasAccess && await permissionContext.canAccessData(dataType, childId);
                }

                setCanAccess(hasAccess);
            } catch (error) {
                console.error('Error checking component permissions:', error);
                setCanAccess(false);
            }
        };

        checkAccess();
    }, [
        permissionContext,
        privacyPermissions,
        rolePermissions,
        roles,
        dataType,
        childId
    ]);

    return {
        canAccess,
        loading: permissionContext.loading || canAccess === null,
        permissionContext
    };
};