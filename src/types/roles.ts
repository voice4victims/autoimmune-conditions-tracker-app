export type UserRole = 'admin' | 'parent' | 'caregiver' | 'viewer';

export type Permission =
    | 'read_data'
    | 'write_data'
    | 'delete_data'
    | 'manage_users'
    | 'invite_users'
    | 'export_data'
    | 'manage_settings'
    | 'view_analytics';

export interface RolePermissions {
    [key: string]: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
    admin: [
        'read_data',
        'write_data',
        'delete_data',
        'manage_users',
        'invite_users',
        'export_data',
        'manage_settings',
        'view_analytics'
    ],
    parent: [
        'read_data',
        'write_data',
        'delete_data',
        'invite_users',
        'export_data',
        'view_analytics'
    ],
    caregiver: [
        'read_data',
        'write_data',
        'view_analytics'
    ],
    viewer: [
        'read_data'
    ]
};

export interface FamilyAccess {
    id: string;
    family_id: string;
    user_id: string;
    role: UserRole;
    invited_by: string;
    accepted_at: Date;
    is_active: boolean;
}

export interface UserPermissionContext {
    role: UserRole | null;
    permissions: Permission[];
    familyId: string | null;
    isOwner: boolean;
}