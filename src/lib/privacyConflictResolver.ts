import {
    PrivacySettings,
    ChildPrivacySettings,
    Permission,
    CommunicationType,
    DataRetentionSettings,
    CommunicationPreferences
} from '@/types/privacy';

/**
 * Service for resolving privacy conflicts between multiple children and family settings
 */
export class PrivacyConflictResolver {
    /**
     * Resolve privacy conflicts when an operation involves multiple children
     * Uses the most restrictive settings as per Property 10
     */
    resolveMultiChildPrivacyConflict(
        childIds: string[],
        privacySettings: PrivacySettings,
        requestedPermissions: Permission[]
    ): { allowedPermissions: Permission[]; restrictiveChildId?: string } {
        if (childIds.length === 0) {
            return { allowedPermissions: requestedPermissions };
        }

        if (childIds.length === 1) {
            const childId = childIds[0];
            const childSettings = privacySettings.childSpecific[childId];
            if (!childSettings) {
                return { allowedPermissions: requestedPermissions };
            }

            return {
                allowedPermissions: this.getEffectivePermissions(childSettings, requestedPermissions),
                restrictiveChildId: childId
            };
        }

        // Multiple children - find most restrictive settings
        let mostRestrictivePermissions = [...requestedPermissions];
        let mostRestrictiveChildId: string | undefined;

        for (const childId of childIds) {
            const childSettings = privacySettings.childSpecific[childId];
            if (!childSettings) {
                continue; // Child inherits family settings
            }

            const childPermissions = this.getEffectivePermissions(childSettings, requestedPermissions);

            // If this child is more restrictive, update the most restrictive permissions
            if (childPermissions.length < mostRestrictivePermissions.length) {
                mostRestrictivePermissions = childPermissions;
                mostRestrictiveChildId = childId;
            } else if (childPermissions.length === mostRestrictivePermissions.length) {
                // Same number of permissions, check if they're different (more restrictive combination)
                const intersection = childPermissions.filter(p => mostRestrictivePermissions.includes(p));
                if (intersection.length < mostRestrictivePermissions.length) {
                    mostRestrictivePermissions = intersection;
                    mostRestrictiveChildId = childId;
                }
            }
        }

        return {
            allowedPermissions: mostRestrictivePermissions,
            restrictiveChildId: mostRestrictiveChildId
        };
    }

    /**
     * Resolve conflict between child-specific and family-wide settings
     * Child-specific settings take priority as per Property 11
     */
    resolveChildVsFamilyConflict(
        childSettings: ChildPrivacySettings,
        familySettings: PrivacySettings,
        requestedPermissions: Permission[]
    ): { allowedPermissions: Permission[]; source: 'child' | 'family' } {
        // If child inherits from parent, use family settings
        if (childSettings.inheritFromParent) {
            return {
                allowedPermissions: requestedPermissions,
                source: 'family'
            };
        }

        // Child-specific settings override family settings
        return {
            allowedPermissions: this.getEffectivePermissions(childSettings, requestedPermissions),
            source: 'child'
        };
    }

    /**
     * Resolve communication preference conflicts for multiple children
     */
    resolveMultiChildCommunicationConflict(
        childIds: string[],
        privacySettings: PrivacySettings,
        communicationType: CommunicationType
    ): { allowed: boolean; restrictiveChildId?: string } {
        if (childIds.length === 0) {
            return { allowed: true };
        }

        // Check each child's communication restrictions
        for (const childId of childIds) {
            const childSettings = privacySettings.childSpecific[childId];
            if (!childSettings) {
                continue; // Child inherits family settings
            }

            // If child inherits from parent, communication is allowed for this child
            if (childSettings.inheritFromParent) {
                continue;
            }

            // If this child has the communication type restricted, block it (most restrictive)
            if (childSettings.communicationRestrictions.includes(communicationType)) {
                return {
                    allowed: false,
                    restrictiveChildId: childId
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Resolve data retention conflicts for multiple children
     */
    resolveMultiChildDataRetentionConflict(
        childIds: string[],
        privacySettings: PrivacySettings
    ): { effectiveRetention: Partial<DataRetentionSettings>; restrictiveChildId?: string } {
        if (childIds.length === 0) {
            return { effectiveRetention: privacySettings.dataRetention };
        }

        let mostRestrictiveRetention = { ...privacySettings.dataRetention };
        let mostRestrictiveChildId: string | undefined;

        for (const childId of childIds) {
            const childSettings = privacySettings.childSpecific[childId];
            if (!childSettings?.dataRetentionOverride) {
                continue; // Child inherits family settings
            }

            const childRetention = childSettings.dataRetentionOverride;

            // Apply most restrictive retention period (shortest)
            if (childRetention.retentionPeriod !== undefined) {
                if (childRetention.retentionPeriod < mostRestrictiveRetention.retentionPeriod) {
                    mostRestrictiveRetention.retentionPeriod = childRetention.retentionPeriod;
                    mostRestrictiveChildId = childId;
                }
            }

            // Apply most restrictive inactivity period (shortest)
            if (childRetention.inactivityPeriod !== undefined) {
                if (childRetention.inactivityPeriod < mostRestrictiveRetention.inactivityPeriod) {
                    mostRestrictiveRetention.inactivityPeriod = childRetention.inactivityPeriod;
                    mostRestrictiveChildId = childId;
                }
            }

            // If any child requires automatic deletion, enable it
            if (childRetention.automaticDeletion === true) {
                mostRestrictiveRetention.automaticDeletion = true;
                mostRestrictiveChildId = childId;
            }

            // If any child requires deletion after inactivity, enable it
            if (childRetention.deleteAfterInactivity === true) {
                mostRestrictiveRetention.deleteAfterInactivity = true;
                mostRestrictiveChildId = childId;
            }
        }

        return {
            effectiveRetention: mostRestrictiveRetention,
            restrictiveChildId: mostRestrictiveChildId
        };
    }

    /**
     * Get effective permissions for a child based on their privacy settings
     */
    private getEffectivePermissions(
        childSettings: ChildPrivacySettings,
        requestedPermissions: Permission[]
    ): Permission[] {
        // If child inherits from parent, allow all requested permissions
        if (childSettings.inheritFromParent) {
            return requestedPermissions;
        }

        // If restricted access is enabled, check if user would be allowed
        // For this method, we assume the user is checking their own permissions
        if (childSettings.restrictedAccess) {
            // This would need userId parameter in real implementation
            // For now, return empty permissions as most restrictive
            return [];
        }

        // If custom permissions exist, use them
        if (childSettings.customPermissions) {
            // This would need userId parameter in real implementation
            // For now, return intersection of all custom permissions as most restrictive
            const allCustomPermissions = Object.values(childSettings.customPermissions).flat();
            return requestedPermissions.filter(p => allCustomPermissions.includes(p));
        }

        // Default: allow all requested permissions
        return requestedPermissions;
    }

    /**
     * Check if privacy settings conflict exists between multiple children
     */
    hasPrivacyConflict(childIds: string[], privacySettings: PrivacySettings): boolean {
        if (childIds.length <= 1) {
            return false;
        }

        const childSettingsList = childIds
            .map(id => privacySettings.childSpecific[id])
            .filter(Boolean);

        if (childSettingsList.length <= 1) {
            return false; // No conflict if only one child has specific settings
        }

        // Check for conflicts in access restrictions
        const hasRestrictedAccess = childSettingsList.some(s => s.restrictedAccess);
        const hasUnrestrictedAccess = childSettingsList.some(s => !s.restrictedAccess);

        if (hasRestrictedAccess && hasUnrestrictedAccess) {
            return true;
        }

        // Check for conflicts in communication restrictions
        const allRestrictions = childSettingsList.flatMap(s => s.communicationRestrictions);
        const uniqueRestrictions = [...new Set(allRestrictions)];

        if (uniqueRestrictions.length > 0 && childSettingsList.some(s => s.communicationRestrictions.length === 0)) {
            return true;
        }

        // Check for conflicts in data retention overrides
        const hasRetentionOverrides = childSettingsList.some(s => s.dataRetentionOverride);
        const hasNoRetentionOverrides = childSettingsList.some(s => !s.dataRetentionOverride);

        if (hasRetentionOverrides && hasNoRetentionOverrides) {
            return true;
        }

        return false;
    }
}

// Export singleton instance
export const privacyConflictResolver = new PrivacyConflictResolver();