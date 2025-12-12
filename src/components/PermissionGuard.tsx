import React from 'react';
import { usePermissions } from '@/hooks/useRoleAccess';
import { Permission, UserRole } from '@/types/roles';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
    children: React.ReactNode;
    permissions?: Permission[];
    roles?: UserRole[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    fallback,
    showFallback = true
}) => {
    const permissionContext = usePermissions();

    // Check role-based access
    const hasRequiredRole = roles.length === 0 ||
        (permissionContext.role && roles.includes(permissionContext.role));

    // Check permission-based access
    const hasRequiredPermissions = permissions.length === 0 ||
        (requireAll
            ? permissionContext.hasAllPermissions(permissions)
            : permissionContext.hasAnyPermission(permissions)
        );

    const hasAccess = hasRequiredRole && hasRequiredPermissions;

    if (hasAccess) {
        return <>{children}</>;
    }

    if (!showFallback) {
        return null;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // Default fallback UI
    return (
        <Card className="mx-1 md:mx-0">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Access Restricted
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    You don't have permission to access this feature.
                    {permissionContext.role ?
                        ` Your current role is "${permissionContext.role}".` :
                        ' Please contact the family administrator for access.'
                    }
                </p>
            </CardContent>
        </Card>
    );
};

interface ConditionalRenderProps {
    children: React.ReactNode;
    permissions?: Permission[];
    roles?: UserRole[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    fallback = null
}) => {
    return (
        <PermissionGuard
            permissions={permissions}
            roles={roles}
            requireAll={requireAll}
            fallback={fallback}
            showFallback={false}
        >
            {children}
        </PermissionGuard>
    );
};

// Higher-order component for protecting entire components
export const withPermissions = <P extends object>(
    Component: React.ComponentType<P>,
    permissions: Permission[] = [],
    roles: UserRole[] = [],
    requireAll: boolean = false
) => {
    return (props: P) => (
        <PermissionGuard
            permissions={permissions}
            roles={roles}
            requireAll={requireAll}
        >
            <Component {...props} />
        </PermissionGuard>
    );
};