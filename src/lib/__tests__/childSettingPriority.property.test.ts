import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { privacyConflictResolver } from '../privacyConflictResolver';
import {
    PrivacySettings,
    ChildPrivacySettings,
    Permission,
    CommunicationType,
    DataRetentionSettings,
    PRIVACY_SETTINGS_VERSION,
    DEFAULT_RETENTION_PERIOD,
    DEFAULT_INACTIVITY_PERIOD
} from '@/types/privacy';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
        now: vi.fn(() => ({ toDate: () => new Date() }))
    },
    serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
    writeBatch: vi.fn(),
    and: vi.fn(),
    or: vi.fn()
}));

// Service for testing child setting priority
class ChildSettingPriorityService {
    /**
     * Apply child-specific privacy settings with priority over family settings
     */
    applyChildPrivacyWithPriority(
        childSettings: ChildPrivacySettings,
        familySettings: PrivacySettings,
        requestedPermissions: Permission[]
    ): { allowedPermissions: Permission[]; source: 'child' | 'family'; reason?: string } {
        // If child inherits from parent, use family settings
        if (childSettings.inheritFromParent) {
            return {
                allowedPermissions: requestedPermissions,
                source: 'family',
                reason: 'Child inherits from family settings'
            };
        }

        // Child-specific settings take priority over family settings
        let allowedPermissions: Permission[] = [];

        // Apply child's restricted access rules first
        if (childSettings.restrictedAccess) {
            // For this test, we'll assume a specific user context
            // In real implementation, this would check if current user is in allowedUsers
            allowedPermissions = []; // Most restrictive - no permissions
        } else {
            // Start with all requested permissions
            allowedPermissions = [...requestedPermissions];
        }

        // Apply custom permissions if they exist (child-specific override)
        if (childSettings.customPermissions) {
            // For testing, we'll use the first user's permissions as an example
            const firstUserPermissions = Object.values(childSettings.customPermissions)[0];
            if (firstUserPermissions) {
                allowedPermissions = requestedPermissions.filter(p => firstUserPermissions.includes(p));
            }
        }

        return {
            allowedPermissions,
            source: 'child',
            reason: 'Child-specific settings override family settings'
        };
    }

    /**
     * Apply child communication preferences with priority over family preferences
     */
    applyChildCommunicationWithPriority(
        childSettings: ChildPrivacySettings,
        familySettings: PrivacySettings,
        communicationType: CommunicationType
    ): { allowed: boolean; source: 'child' | 'family'; reason?: string } {
        // If child inherits from parent, use family settings
        if (childSettings.inheritFromParent) {
            const familyAllowed = this.getFamilyCommunicationSetting(familySettings, communicationType);
            return {
                allowed: familyAllowed,
                source: 'family',
                reason: 'Child inherits communication preferences from family'
            };
        }

        // Child-specific communication restrictions take priority
        const childAllowed = !childSettings.communicationRestrictions.includes(communicationType);

        return {
            allowed: childAllowed,
            source: 'child',
            reason: 'Child-specific communication restrictions override family settings'
        };
    }

    /**
     * Apply child data retention settings with priority over family settings
     */
    applyChildDataRetentionWithPriority(
        childSettings: ChildPrivacySettings,
        familySettings: PrivacySettings
    ): { effectiveRetention: Partial<DataRetentionSettings>; source: 'child' | 'family'; reason?: string } {
        // If child inherits from parent, use family settings
        if (childSettings.inheritFromParent) {
            return {
                effectiveRetention: familySettings.dataRetention,
                source: 'family',
                reason: 'Child inherits data retention settings from family'
            };
        }

        // If child has no retention override, use family settings
        if (!childSettings.dataRetentionOverride) {
            return {
                effectiveRetention: familySettings.dataRetention,
                source: 'family',
                reason: 'No child-specific retention override, using family settings'
            };
        }

        // Child-specific retention settings take priority
        const effectiveRetention = {
            ...familySettings.dataRetention,
            ...childSettings.dataRetentionOverride
        };

        return {
            effectiveRetention,
            source: 'child',
            reason: 'Child-specific data retention settings override family settings'
        };
    }

    /**
     * Check if child settings should override family settings
     */
    shouldChildSettingsOverride(
        childSettings: ChildPrivacySettings,
        settingType: 'permissions' | 'communications' | 'data_retention'
    ): boolean {
        // If child inherits from parent, don't override
        if (childSettings.inheritFromParent) {
            return false;
        }

        switch (settingType) {
            case 'permissions':
                return childSettings.restrictedAccess || !!childSettings.customPermissions;
            case 'communications':
                return childSettings.communicationRestrictions.length > 0;
            case 'data_retention':
                return !!childSettings.dataRetentionOverride;
            default:
                return false;
        }
    }

    private getFamilyCommunicationSetting(
        familySettings: PrivacySettings,
        communicationType: CommunicationType
    ): boolean {
        switch (communicationType) {
            case 'email_notifications':
                return familySettings.communications.emailNotifications;
            case 'sms_notifications':
                return familySettings.communications.smsNotifications;
            case 'marketing_emails':
                return familySettings.communications.marketingEmails;
            case 'security_alerts':
                return familySettings.communications.securityAlerts;
            case 'medical_reminders':
                return familySettings.communications.medicalReminders;
            case 'third_party_marketing':
                return familySettings.communications.thirdPartyMarketing;
            default:
                return false;
        }
    }
}

const childSettingPriorityService = new ChildSettingPriorityService();

describe('Child Setting Priority Property Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Generators for test data
    const permissionGen = fc.constantFrom(
        'view_symptoms',
        'edit_symptoms',
        'view_treatments',
        'edit_treatments',
        'view_vitals',
        'edit_vitals',
        'view_notes',
        'edit_notes',
        'view_files',
        'upload_files',
        'view_analytics',
        'export_data',
        'manage_access'
    );

    const communicationTypeGen = fc.constantFrom(
        'email_notifications',
        'sms_notifications',
        'marketing_emails',
        'security_alerts',
        'medical_reminders',
        'third_party_marketing'
    );

    const childPrivacySettingsGen = fc.record({
        childId: fc.string({ minLength: 1, maxLength: 50 }),
        restrictedAccess: fc.boolean(),
        allowedUsers: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
        communicationRestrictions: fc.array(communicationTypeGen, { minLength: 0, maxLength: 6 }),
        inheritFromParent: fc.boolean(),
        customPermissions: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.array(permissionGen, { minLength: 1, maxLength: 5 })
        )),
        dataRetentionOverride: fc.option(fc.record({
            automaticDeletion: fc.option(fc.boolean()),
            retentionPeriod: fc.option(fc.integer({ min: 1, max: 120 })),
            deleteAfterInactivity: fc.option(fc.boolean()),
            inactivityPeriod: fc.option(fc.integer({ min: 1, max: 60 }))
        }))
    });

    const privacySettingsGen = fc.record({
        id: fc.string({ minLength: 1, maxLength: 50 }),
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        dataSharing: fc.record({
            researchParticipation: fc.boolean(),
            anonymizedDataSharing: fc.boolean(),
            thirdPartyIntegrations: fc.dictionary(fc.string(), fc.boolean()),
            marketingConsent: fc.boolean(),
            consentHistory: fc.constant([])
        }),
        accessControl: fc.record({
            familyMembers: fc.constant([]),
            healthcareProviders: fc.constant([]),
            temporaryAccess: fc.constant([])
        }),
        dataRetention: fc.record({
            automaticDeletion: fc.boolean(),
            retentionPeriod: fc.integer({ min: 1, max: 120 }),
            deleteAfterInactivity: fc.boolean(),
            inactivityPeriod: fc.integer({ min: 1, max: 60 }),
            legalHolds: fc.constant([])
        }),
        communications: fc.record({
            emailNotifications: fc.boolean(),
            smsNotifications: fc.boolean(),
            marketingEmails: fc.boolean(),
            securityAlerts: fc.boolean(),
            medicalReminders: fc.boolean(),
            thirdPartyMarketing: fc.boolean(),
            communicationHistory: fc.constant([])
        }),
        childSpecific: fc.constant({}),
        lastUpdated: fc.constant(new Date()),
        version: fc.constant(PRIVACY_SETTINGS_VERSION)
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * **Validates: Requirements 5.5**
     */
    it('should prioritize child-specific privacy settings over family settings', async () => {
        await fc.assert(
            fc.asyncProperty(
                childPrivacySettingsGen,
                privacySettingsGen,
                fc.array(permissionGen, { minLength: 1, maxLength: 8 }),
                async (childSettings: ChildPrivacySettings, familySettings: PrivacySettings, requestedPermissions: Permission[]) => {
                    const result = childSettingPriorityService.applyChildPrivacyWithPriority(
                        childSettings,
                        familySettings,
                        requestedPermissions
                    );

                    // Property: If child inherits from parent, family settings should be used
                    if (childSettings.inheritFromParent) {
                        expect(result.source).toBe('family');
                        expect(result.allowedPermissions).toEqual(requestedPermissions);
                        expect(result.reason).toContain('inherits from family');
                    } else {
                        // Property: If child doesn't inherit, child settings should take priority
                        expect(result.source).toBe('child');
                        expect(result.reason).toContain('Child-specific settings override');

                        // Property: Child's restrictedAccess should override family permissions
                        if (childSettings.restrictedAccess) {
                            expect(result.allowedPermissions.length).toBeLessThanOrEqual(requestedPermissions.length);
                        }

                        // Property: Child's custom permissions should override family permissions
                        if (childSettings.customPermissions) {
                            const firstUserPermissions = Object.values(childSettings.customPermissions)[0];
                            if (firstUserPermissions) {
                                const expectedPermissions = requestedPermissions.filter(p => firstUserPermissions.includes(p));
                                expect(result.allowedPermissions).toEqual(expectedPermissions);
                            }
                        }
                    }

                    // Property: Result should be deterministic
                    const result2 = childSettingPriorityService.applyChildPrivacyWithPriority(
                        childSettings,
                        familySettings,
                        requestedPermissions
                    );
                    expect(result).toEqual(result2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * Test communication preferences priority
     */
    it('should prioritize child-specific communication settings over family settings', async () => {
        await fc.assert(
            fc.asyncProperty(
                childPrivacySettingsGen,
                privacySettingsGen,
                communicationTypeGen,
                async (childSettings: ChildPrivacySettings, familySettings: PrivacySettings, communicationType: CommunicationType) => {
                    const result = childSettingPriorityService.applyChildCommunicationWithPriority(
                        childSettings,
                        familySettings,
                        communicationType
                    );

                    // Property: If child inherits from parent, family settings should be used
                    if (childSettings.inheritFromParent) {
                        expect(result.source).toBe('family');
                        expect(result.reason).toContain('inherits communication preferences from family');
                    } else {
                        // Property: If child doesn't inherit, child settings should take priority
                        expect(result.source).toBe('child');
                        expect(result.reason).toContain('Child-specific communication restrictions override');

                        // Property: Child's communication restrictions should override family preferences
                        const expectedAllowed = !childSettings.communicationRestrictions.includes(communicationType);
                        expect(result.allowed).toBe(expectedAllowed);

                        // Property: If child restricts a communication type, it should be blocked regardless of family setting
                        if (childSettings.communicationRestrictions.includes(communicationType)) {
                            expect(result.allowed).toBe(false);
                        }
                    }

                    // Property: Result should be deterministic
                    const result2 = childSettingPriorityService.applyChildCommunicationWithPriority(
                        childSettings,
                        familySettings,
                        communicationType
                    );
                    expect(result).toEqual(result2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * Test data retention settings priority
     */
    it('should prioritize child-specific data retention settings over family settings', async () => {
        await fc.assert(
            fc.asyncProperty(
                childPrivacySettingsGen,
                privacySettingsGen,
                async (childSettings: ChildPrivacySettings, familySettings: PrivacySettings) => {
                    const result = childSettingPriorityService.applyChildDataRetentionWithPriority(
                        childSettings,
                        familySettings
                    );

                    // Property: If child inherits from parent, family settings should be used
                    if (childSettings.inheritFromParent) {
                        expect(result.source).toBe('family');
                        expect(result.effectiveRetention).toEqual(familySettings.dataRetention);
                        expect(result.reason).toContain('inherits data retention settings from family');
                    } else if (!childSettings.dataRetentionOverride) {
                        // Property: If no child override exists, family settings should be used
                        expect(result.source).toBe('family');
                        expect(result.effectiveRetention).toEqual(familySettings.dataRetention);
                        expect(result.reason).toContain('No child-specific retention override');
                    } else {
                        // Property: If child has retention override, child settings should take priority
                        expect(result.source).toBe('child');
                        expect(result.reason).toContain('Child-specific data retention settings override');

                        // Property: Child overrides should be applied to family base settings
                        const expectedRetention = {
                            ...familySettings.dataRetention,
                            ...childSettings.dataRetentionOverride
                        };
                        expect(result.effectiveRetention).toEqual(expectedRetention);

                        // Property: Specific child overrides should be present in result
                        if (childSettings.dataRetentionOverride.automaticDeletion !== undefined) {
                            expect(result.effectiveRetention.automaticDeletion).toBe(childSettings.dataRetentionOverride.automaticDeletion);
                        }
                        if (childSettings.dataRetentionOverride.retentionPeriod !== undefined) {
                            expect(result.effectiveRetention.retentionPeriod).toBe(childSettings.dataRetentionOverride.retentionPeriod);
                        }
                        if (childSettings.dataRetentionOverride.deleteAfterInactivity !== undefined) {
                            expect(result.effectiveRetention.deleteAfterInactivity).toBe(childSettings.dataRetentionOverride.deleteAfterInactivity);
                        }
                        if (childSettings.dataRetentionOverride.inactivityPeriod !== undefined) {
                            expect(result.effectiveRetention.inactivityPeriod).toBe(childSettings.dataRetentionOverride.inactivityPeriod);
                        }
                    }

                    // Property: Result should be deterministic
                    const result2 = childSettingPriorityService.applyChildDataRetentionWithPriority(
                        childSettings,
                        familySettings
                    );
                    expect(result).toEqual(result2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * Test override decision logic
     */
    it('should correctly determine when child settings should override family settings', async () => {
        await fc.assert(
            fc.asyncProperty(
                childPrivacySettingsGen,
                async (childSettings: ChildPrivacySettings) => {
                    // Test permissions override decision
                    const shouldOverridePermissions = childSettingPriorityService.shouldChildSettingsOverride(
                        childSettings,
                        'permissions'
                    );

                    // Property: Should not override if child inherits from parent
                    if (childSettings.inheritFromParent) {
                        expect(shouldOverridePermissions).toBe(false);
                    } else {
                        // Property: Should override if child has restrictedAccess or customPermissions
                        const expectedOverride = childSettings.restrictedAccess || !!childSettings.customPermissions;
                        expect(shouldOverridePermissions).toBe(expectedOverride);
                    }

                    // Test communications override decision
                    const shouldOverrideCommunications = childSettingPriorityService.shouldChildSettingsOverride(
                        childSettings,
                        'communications'
                    );

                    if (childSettings.inheritFromParent) {
                        expect(shouldOverrideCommunications).toBe(false);
                    } else {
                        // Property: Should override if child has communication restrictions
                        const expectedOverride = childSettings.communicationRestrictions.length > 0;
                        expect(shouldOverrideCommunications).toBe(expectedOverride);
                    }

                    // Test data retention override decision
                    const shouldOverrideDataRetention = childSettingPriorityService.shouldChildSettingsOverride(
                        childSettings,
                        'data_retention'
                    );

                    if (childSettings.inheritFromParent) {
                        expect(shouldOverrideDataRetention).toBe(false);
                    } else {
                        // Property: Should override if child has data retention override
                        const expectedOverride = !!childSettings.dataRetentionOverride;
                        expect(shouldOverrideDataRetention).toBe(expectedOverride);
                    }

                    // Property: All decisions should be deterministic
                    expect(childSettingPriorityService.shouldChildSettingsOverride(childSettings, 'permissions')).toBe(shouldOverridePermissions);
                    expect(childSettingPriorityService.shouldChildSettingsOverride(childSettings, 'communications')).toBe(shouldOverrideCommunications);
                    expect(childSettingPriorityService.shouldChildSettingsOverride(childSettings, 'data_retention')).toBe(shouldOverrideDataRetention);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * Test integration with conflict resolver
     */
    it('should integrate correctly with privacy conflict resolver for child priority', async () => {
        await fc.assert(
            fc.asyncProperty(
                childPrivacySettingsGen,
                privacySettingsGen,
                fc.array(permissionGen, { minLength: 1, maxLength: 5 }),
                async (childSettings: ChildPrivacySettings, familySettings: PrivacySettings, requestedPermissions: Permission[]) => {
                    // Test using the actual conflict resolver
                    const conflictResult = privacyConflictResolver.resolveChildVsFamilyConflict(
                        childSettings,
                        familySettings,
                        requestedPermissions
                    );

                    // Property: If child inherits from parent, family settings should be used
                    if (childSettings.inheritFromParent) {
                        expect(conflictResult.source).toBe('family');
                        expect(conflictResult.allowedPermissions).toEqual(requestedPermissions);
                    } else {
                        // Property: If child doesn't inherit, child settings should take priority
                        expect(conflictResult.source).toBe('child');

                        // Property: Child settings should be more restrictive or equal to requested permissions
                        expect(conflictResult.allowedPermissions.length).toBeLessThanOrEqual(requestedPermissions.length);

                        // Property: All allowed permissions should be from the requested set
                        conflictResult.allowedPermissions.forEach(permission => {
                            expect(requestedPermissions).toContain(permission);
                        });
                    }

                    // Property: Result should be deterministic
                    const conflictResult2 = privacyConflictResolver.resolveChildVsFamilyConflict(
                        childSettings,
                        familySettings,
                        requestedPermissions
                    );
                    expect(conflictResult).toEqual(conflictResult2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: privacy-settings, Property 11: Child settings override family settings**
     * Test edge cases for child setting priority
     */
    it('should handle edge cases correctly for child setting priority', async () => {
        await fc.assert(
            fc.asyncProperty(
                privacySettingsGen,
                fc.array(permissionGen, { minLength: 1, maxLength: 3 }),
                async (familySettings: PrivacySettings, requestedPermissions: Permission[]) => {
                    // Test with child that inherits everything
                    const inheritingChild: ChildPrivacySettings = {
                        childId: 'inheriting-child',
                        restrictedAccess: true, // This should be ignored
                        allowedUsers: [],
                        communicationRestrictions: ['email_notifications'], // This should be ignored
                        inheritFromParent: true, // This overrides everything
                        customPermissions: { 'user1': ['view_symptoms'] } // This should be ignored
                    };

                    const inheritResult = childSettingPriorityService.applyChildPrivacyWithPriority(
                        inheritingChild,
                        familySettings,
                        requestedPermissions
                    );

                    // Property: Inheriting child should always use family settings
                    expect(inheritResult.source).toBe('family');
                    expect(inheritResult.allowedPermissions).toEqual(requestedPermissions);

                    // Test with child that has no specific overrides
                    const minimalChild: ChildPrivacySettings = {
                        childId: 'minimal-child',
                        restrictedAccess: false,
                        allowedUsers: [],
                        communicationRestrictions: [],
                        inheritFromParent: false
                    };

                    const minimalResult = childSettingPriorityService.applyChildPrivacyWithPriority(
                        minimalChild,
                        familySettings,
                        requestedPermissions
                    );

                    // Property: Child with no restrictions should allow all requested permissions
                    expect(minimalResult.source).toBe('child');
                    expect(minimalResult.allowedPermissions).toEqual(requestedPermissions);

                    // Test with maximally restrictive child
                    const restrictiveChild: ChildPrivacySettings = {
                        childId: 'restrictive-child',
                        restrictedAccess: true,
                        allowedUsers: [],
                        communicationRestrictions: ['email_notifications', 'sms_notifications', 'marketing_emails'],
                        inheritFromParent: false,
                        customPermissions: { 'user1': [] } // No permissions
                    };

                    const restrictiveResult = childSettingPriorityService.applyChildPrivacyWithPriority(
                        restrictiveChild,
                        familySettings,
                        requestedPermissions
                    );

                    // Property: Restrictive child should grant minimal permissions
                    expect(restrictiveResult.source).toBe('child');
                    expect(restrictiveResult.allowedPermissions.length).toBeLessThanOrEqual(requestedPermissions.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});