import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionCheck } from '@/hooks/useSecurePrivacy';
import { Permission } from '@/types/privacy';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivacyGuardProps {
    children: React.ReactNode;
    targetUserId: string;
    requiredPermission: Permission;
    childId?: string;
    fallback?: React.ReactNode;
    showAccessDenied?: boolean;
    onAccessDenied?: () => void;
}

/**
 * Privacy Guard Component
 * 
 * Protects components and routes based on privacy permissions.
 * Only renders children if the current user has the required permission.
 */
export const PrivacyGuard: React.FC<PrivacyGuardProps> = ({
    children,
    targetUserId,
    requiredPermission,
    childId,
    fallback,
    showAccessDenied = true,
    onAccessDenied
}) => {
    const { user, loading: authLoading } = useAuth();
    const { checkPermission } = usePermissionCheck();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user || authLoading) {
                setLoading(true);
                return;
            }

            try {
                const access = await checkPermission(targetUserId, requiredPermission, childId);
                setHasAccess(access);

                if (!access && onAccessDenied) {
                    onAccessDenied();
                }
            } catch (error) {
                console.error('Error checking access in PrivacyGuard:', error);
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, authLoading, targetUserId, requiredPermission, childId, checkPermission, onAccessDenied]);

    // Show loading state
    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Checking permissions...</span>
            </div>
        );
    }

    // Show access denied if no permission
    if (hasAccess === false) {
        if (fallback) {
            return <>{fallback}</>;
        }

        if (showAccessDenied) {
            return (
                <div className="p-6">
                    <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
                        <Lock className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                            <div>
                                <strong>Access Denied</strong>
                                <p className="mt-1 text-sm">
                                    You don't have permission to access this content.
                                    The required permission is: <code className="bg-muted px-1 py-0.5 rounded text-xs">{requiredPermission}</code>
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.history.back()}
                                className="ml-4"
                            >
                                Go Back
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return null;
    }

    // Render children if access is granted
    return <>{children}</>;
};

interface PrivacyProtectedProps {
    children: React.ReactNode;
    targetUserId: string;
    requiredPermissions: Permission[];
    childId?: string;
    requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
    fallback?: React.ReactNode;
}

/**
 * Privacy Protected Component
 * 
 * Protects components that require multiple permissions.
 */
export const PrivacyProtected: React.FC<PrivacyProtectedProps> = ({
    children,
    targetUserId,
    requiredPermissions,
    childId,
    requireAll = false,
    fallback
}) => {
    const { user, loading: authLoading } = useAuth();
    const { checkPermission } = usePermissionCheck();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user || authLoading) {
                setLoading(true);
                return;
            }

            try {
                const permissionChecks = await Promise.all(
                    requiredPermissions.map(permission =>
                        checkPermission(targetUserId, permission, childId)
                    )
                );

                const access = requireAll
                    ? permissionChecks.every(Boolean)
                    : permissionChecks.some(Boolean);

                setHasAccess(access);
            } catch (error) {
                console.error('Error checking access in PrivacyProtected:', error);
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, authLoading, targetUserId, requiredPermissions, childId, requireAll, checkPermission]);

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (hasAccess === false) {
        return fallback || null;
    }

    return <>{children}</>;
};

interface ConditionalPrivacyRenderProps {
    targetUserId: string;
    permission: Permission;
    childId?: string;
    children: (hasPermission: boolean, loading: boolean) => React.ReactNode;
}

/**
 * Conditional Privacy Render Component
 * 
 * Renders different content based on permission status using render props pattern.
 */
export const ConditionalPrivacyRender: React.FC<ConditionalPrivacyRenderProps> = ({
    targetUserId,
    permission,
    childId,
    children
}) => {
    const { user, loading: authLoading } = useAuth();
    const { checkPermission } = usePermissionCheck();
    const [hasPermission, setHasPermission] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user || authLoading) {
                setLoading(true);
                return;
            }

            try {
                const access = await checkPermission(targetUserId, permission, childId);
                setHasPermission(access);
            } catch (error) {
                console.error('Error checking permission in ConditionalPrivacyRender:', error);
                setHasPermission(false);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, authLoading, targetUserId, permission, childId, checkPermission]);

    return <>{children(hasPermission, loading || authLoading)}</>;
};

/**
 * Higher-Order Component for privacy protection
 */
export function withPrivacyGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    requiredPermission: Permission,
    options?: {
        fallback?: React.ReactNode;
        showAccessDenied?: boolean;
    }
) {
    return function PrivacyGuardedComponent(
        props: P & { targetUserId: string; childId?: string }
    ) {
        const { targetUserId, childId, ...restProps } = props;

        return (
            <PrivacyGuard
                targetUserId={targetUserId}
                requiredPermission={requiredPermission}
                childId={childId}
                fallback={options?.fallback}
                showAccessDenied={options?.showAccessDenied}
            >
                <WrappedComponent {...(restProps as P)} />
            </PrivacyGuard>
        );
    };
}

/**
 * Privacy Status Indicator Component
 */
interface PrivacyStatusProps {
    targetUserId: string;
    childId?: string;
    className?: string;
}

export const PrivacyStatus: React.FC<PrivacyStatusProps> = ({
    targetUserId,
    childId,
    className = ""
}) => {
    const { user } = useAuth();
    const { getPermissions } = usePermissionCheck();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPermissions = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const userPermissions = await getPermissions(targetUserId, childId);
                setPermissions(userPermissions);
            } catch (error) {
                console.error('Error loading permissions for status:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPermissions();
    }, [user, targetUserId, childId, getPermissions]);

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
        );
    }

    const isOwner = user?.uid === targetUserId;
    const hasFullAccess = permissions.includes('manage_access');
    const hasEditAccess = permissions.some(p => p.startsWith('edit_'));
    const hasViewAccess = permissions.length > 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Shield className={`h-3 w-3 ${isOwner || hasFullAccess ? 'text-green-500' :
                    hasEditAccess ? 'text-yellow-500' :
                        hasViewAccess ? 'text-blue-500' : 'text-gray-400'
                }`} />
            <span className="text-xs text-muted-foreground">
                {isOwner ? 'Owner' :
                    hasFullAccess ? 'Full Access' :
                        hasEditAccess ? 'Edit Access' :
                            hasViewAccess ? 'View Access' : 'No Access'}
            </span>
        </div>
    );
};