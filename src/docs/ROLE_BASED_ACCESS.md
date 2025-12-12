# Role-Based Access Control (RBAC) Implementation

## Overview

The PANDAS tracking application now includes a comprehensive role-based access control system that allows family administrators to manage who can access and modify their child's medical data.

## User Roles

### 1. Admin
- **Full access** to all features
- Can manage users, settings, and all data operations
- Typically the child's primary parent/guardian
- **Permissions**: All permissions available

### 2. Parent
- **Full data access** for tracking and management
- Can invite other family members
- Cannot manage user roles (except inviting)
- **Permissions**: read_data, write_data, delete_data, invite_users, export_data, view_analytics

### 3. Caregiver
- **Read and write access** to help with daily tracking
- Cannot delete data or manage users
- Ideal for babysitters, relatives, or healthcare aides
- **Permissions**: read_data, write_data, view_analytics

### 4. Viewer
- **Read-only access** to view data and reports
- Cannot make any changes to data
- Useful for extended family or healthcare providers who need to monitor progress
- **Permissions**: read_data

## Permissions System

### Available Permissions
- `read_data` - View symptoms, treatments, and medical records
- `write_data` - Add new symptoms, treatments, and notes
- `delete_data` - Remove symptoms, treatments, and records
- `manage_users` - Edit user roles and remove access
- `invite_users` - Send invitations to new family members
- `export_data` - Download reports and export medical data
- `manage_settings` - Change app settings and preferences
- `view_analytics` - Access advanced charts and insights

## Implementation Components

### Core Files

1. **`src/types/roles.ts`**
   - Defines user roles and permissions
   - Maps roles to their allowed permissions
   - TypeScript interfaces for type safety

2. **`src/hooks/useRoleAccess.ts`**
   - Custom hook for accessing user permissions
   - Provides helper functions for permission checks
   - Handles role context and owner detection

3. **`src/components/PermissionGuard.tsx`**
   - React component for protecting UI elements
   - Conditional rendering based on permissions
   - Fallback UI for unauthorized access

4. **`src/components/RoleSelector.tsx`**
   - UI component for selecting and displaying roles
   - Role badges with icons and descriptions
   - Permission preview functionality

5. **`src/lib/firebaseService.ts`** (Enhanced)
   - Firebase service functions for role management
   - User access control in database operations
   - Family invitation system with roles

### UI Components

1. **`src/components/RoleDashboard.tsx`**
   - Shows current user's role and permissions
   - Visual permission matrix
   - Role-specific guidance and warnings

2. **`src/components/FamilyAccessManager.tsx`**
   - Manage family member roles
   - Edit user permissions
   - Revoke access functionality

3. **`src/components/FamilyInviteForm.tsx`**
   - Send invitations with specific roles
   - Role selection during invitation
   - Permission-based invitation sending

## Usage Examples

### Protecting Components
```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

// Protect entire component
<PermissionGuard permissions={['write_data']}>
  <SymptomTracker />
</PermissionGuard>

// Conditional rendering
<ConditionalRender permissions={['delete_data']}>
  <DeleteButton />
</ConditionalRender>
```

### Using Permission Hooks
```tsx
import { usePermissions } from '@/hooks/useRoleAccess';

const MyComponent = () => {
  const { canWrite, canDelete, hasPermission } = usePermissions();
  
  return (
    <div>
      {canWrite && <AddButton />}
      {canDelete && <DeleteButton />}
      {hasPermission('view_analytics') && <AnalyticsChart />}
    </div>
  );
};
```

### Role-Based UI
```tsx
import { RoleBadge } from '@/components/RoleSelector';

<RoleBadge role="parent" size="md" />
```

## Security Features

### Database Security
- All Firebase operations check user permissions
- Family access validation on every request
- Soft delete for user access (deactivation)
- Audit trail for permission changes

### UI Security
- Permission guards prevent unauthorized UI access
- Disabled buttons for insufficient permissions
- Clear feedback when access is denied
- Role-based navigation and feature visibility

### Invitation System
- Time-limited invitation codes (7 days)
- Role assignment during invitation
- Secure invitation acceptance process
- Email-based invitation tracking

## Family Access Workflow

1. **Family Owner** (Admin) creates child profile
2. **Owner** invites family members with specific roles
3. **Invitees** receive invitation codes via email
4. **Invitees** accept invitations and gain role-based access
5. **Owner/Admin** can modify roles or revoke access as needed

## Database Schema

### family_access Collection
```typescript
{
  id: string;
  family_id: string;      // Owner's user ID
  user_id: string;        // Invited user's ID
  role: UserRole;         // admin, parent, caregiver, viewer
  invited_by: string;     // Who sent the invitation
  accepted_at: Timestamp; // When invitation was accepted
  is_active: boolean;     // Active status
}
```

### family_invitations Collection
```typescript
{
  id: string;
  family_id: string;      // Owner's user ID
  email: string;          // Invitee's email
  invitation_code: string; // Unique invitation code
  role: UserRole;         // Assigned role
  status: string;         // pending, accepted, expired
  expires_at: Timestamp;  // Expiration date
  created_at: Timestamp;  // Creation date
}
```

## Best Practices

### For Developers
1. Always use permission guards for sensitive operations
2. Check permissions on both client and server side
3. Provide clear feedback for permission denials
4. Use TypeScript for type safety with roles and permissions
5. Test all permission combinations thoroughly

### For Users
1. **Admins**: Regularly review family member access
2. **Parents**: Use appropriate roles for different family members
3. **Caregivers**: Understand your access limitations
4. **All Users**: Report any access issues immediately

## Migration Notes

- Existing users automatically become "admin" role
- Family access is backward compatible
- No data loss during role system implementation
- Gradual rollout of permission enforcement

## Future Enhancements

- Custom role creation
- Time-based access (temporary permissions)
- Advanced audit logging
- Integration with healthcare provider systems
- Bulk user management
- Role templates for common scenarios

This role-based access system provides secure, flexible family collaboration while maintaining data privacy and appropriate access controls for sensitive medical information.