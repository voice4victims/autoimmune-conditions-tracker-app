import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserRole, ROLE_PERMISSIONS } from '@/types/roles';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Eye, Heart } from 'lucide-react';

interface RoleSelectorProps {
    value: UserRole | '';
    onValueChange: (role: UserRole) => void;
    disabled?: boolean;
    showDescription?: boolean;
}

const roleIcons = {
    admin: Shield,
    parent: Users,
    caregiver: Heart,
    viewer: Eye
};

const roleDescriptions = {
    admin: 'Full access to all features including user management and settings',
    parent: 'Can track symptoms, manage treatments, and invite other users',
    caregiver: 'Can view and add data but cannot delete or manage users',
    viewer: 'Read-only access to view data and reports'
};

const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    parent: 'bg-blue-100 text-blue-800 border-blue-200',
    caregiver: 'bg-green-100 text-green-800 border-green-200',
    viewer: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
    value,
    onValueChange,
    disabled = false,
    showDescription = true
}) => {
    const roles: UserRole[] = ['admin', 'parent', 'caregiver', 'viewer'];

    return (
        <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role) => {
                        const Icon = roleIcons[role];
                        return (
                            <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span className="capitalize">{role}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>

            {showDescription && value && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={roleColors[value as UserRole]}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                        {roleDescriptions[value as UserRole]}
                    </p>
                    <div className="text-xs text-muted-foreground">
                        <strong>Permissions:</strong> {ROLE_PERMISSIONS[value].join(', ').replace(/_/g, ' ')}
                    </div>
                </div>
            )}
        </div>
    );
};

interface RoleBadgeProps {
    role: UserRole;
    size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
    const Icon = roleIcons[role];
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-2 py-1',
        lg: 'text-base px-3 py-2'
    };

    return (
        <Badge className={`${roleColors[role]} ${sizeClasses[size]} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
    );
};