/**
 * Privacy Settings Infrastructure Demo
 * 
 * This module demonstrates the basic functionality of the privacy settings infrastructure.
 * It can be used for testing and validation during development.
 */

import {
    privacyService,
    auditService,
    PrivacyUtils,
    validatePrivacyInfrastructure,
    PRIVACY_SETTINGS_VERSION,
    DEFAULT_RETENTION_PERIOD
} from './index';

export class PrivacyInfrastructureDemo {
    /**
     * Demonstrate basic privacy service functionality
     */
    static async demonstratePrivacyService(): Promise<void> {
        console.log('🔒 Privacy Settings Infrastructure Demo');
        console.log('=====================================');

        const demoUserId = 'demo-user-' + Date.now();

        try {
            console.log('\n1. Creating default privacy settings...');
            const settings = await privacyService.getPrivacySettings(demoUserId);
            console.log('✓ Default settings created:', {
                userId: settings.userId,
                version: settings.version,
                dataSharing: settings.dataSharing.researchParticipation,
                communications: settings.communications.securityAlerts
            });

            console.log('\n2. Updating privacy settings...');
            await privacyService.updatePrivacySettings(demoUserId, {
                dataSharing: {
                    ...settings.dataSharing,
                    researchParticipation: true
                }
            });
            console.log('✓ Privacy settings updated successfully');

            console.log('\n3. Revoking consent...');
            await privacyService.revokeConsent(demoUserId, 'research_participation');
            console.log('✓ Research participation consent revoked');

            console.log('\n4. Requesting data deletion...');
            const deletionId = await privacyService.requestDataDeletion(
                demoUserId,
                'all_data',
                'Demo deletion request'
            );
            console.log('✓ Data deletion requested, ID:', deletionId);

            console.log('\n5. Granting temporary access...');
            const accessId = await privacyService.grantTemporaryAccess(demoUserId, {
                grantedTo: 'demo-provider',
                grantedToName: 'Demo Healthcare Provider',
                grantedToEmail: 'provider@demo.com',
                permissions: ['view_symptoms', 'view_treatments'],
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                purpose: 'Demo medical consultation'
            });
            console.log('✓ Temporary access granted, ID:', accessId);

        } catch (error) {
            console.error('❌ Error in privacy service demo:', error);
        }
    }

    /**
     * Demonstrate audit service functionality
     */
    static async demonstrateAuditService(): Promise<void> {
        console.log('\n📊 Audit Service Demo');
        console.log('====================');

        const demoUserId = 'demo-user-' + Date.now();

        try {
            console.log('\n1. Logging privacy actions...');
            await auditService.logPrivacyAction(demoUserId, 'view_data', {
                resourceType: 'symptoms',
                resourceId: 'demo-symptom-123',
                details: 'Demo: User viewed symptom data'
            });
            console.log('✓ Privacy action logged');

            console.log('\n2. Retrieving access logs...');
            const logs = await auditService.getAccessLogs(demoUserId);
            console.log('✓ Access logs retrieved, count:', logs.length);

            console.log('\n3. Generating audit report...');
            const report = await auditService.generateAuditReport(demoUserId, {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                endDate: new Date()
            });
            console.log('✓ Audit report generated:', {
                id: report.id,
                entriesCount: report.entries.length,
                format: report.format
            });

            console.log('\n4. Detecting suspicious activity...');
            const suspiciousActivity = await auditService.detectSuspiciousActivity(demoUserId);
            console.log('✓ Suspicious activity check completed, found:', suspiciousActivity.length, 'issues');

        } catch (error) {
            console.error('❌ Error in audit service demo:', error);
        }
    }

    /**
     * Demonstrate utility functions
     */
    static demonstrateUtilities(): void {
        console.log('\n🛠️  Privacy Utilities Demo');
        console.log('=========================');

        try {
            console.log('\n1. Testing permission checking...');
            const hasPermission = PrivacyUtils.hasPermission(['view_symptoms', 'edit_symptoms'], 'view_symptoms');
            console.log('✓ Has view_symptoms permission:', hasPermission);

            console.log('\n2. Getting role permissions...');
            const parentPermissions = PrivacyUtils.getPermissionsForRole('parent');
            console.log('✓ Parent role permissions:', parentPermissions.slice(0, 3), '... (and more)');

            console.log('\n3. Checking consent requirements...');
            const consentRequired = PrivacyUtils.isConsentRequired('export_data');
            console.log('✓ Export data requires consent:', consentRequired);

            console.log('\n4. Validating privacy settings...');
            const validationErrors = PrivacyUtils.validatePrivacySettings({
                dataRetention: {
                    automaticDeletion: true,
                    retentionPeriod: 6, // Too short - should trigger error
                    deleteAfterInactivity: false,
                    inactivityPeriod: 24,
                    legalHolds: []
                }
            });
            console.log('✓ Validation errors found:', validationErrors.length);
            if (validationErrors.length > 0) {
                console.log('  Errors:', validationErrors);
            }

            console.log('\n5. Generating privacy summary...');
            const mockSettings = {
                id: 'demo',
                userId: 'demo-user',
                dataSharing: {
                    researchParticipation: true,
                    anonymizedDataSharing: false,
                    thirdPartyIntegrations: {},
                    marketingConsent: false,
                    consentHistory: []
                },
                accessControl: {
                    familyMembers: [],
                    healthcareProviders: [],
                    temporaryAccess: []
                },
                dataRetention: {
                    automaticDeletion: false,
                    retentionPeriod: DEFAULT_RETENTION_PERIOD,
                    deleteAfterInactivity: false,
                    inactivityPeriod: 24,
                    legalHolds: []
                },
                communications: {
                    emailNotifications: true,
                    smsNotifications: false,
                    marketingEmails: false,
                    securityAlerts: true,
                    medicalReminders: true,
                    thirdPartyMarketing: false,
                    communicationHistory: []
                },
                childSpecific: {},
                lastUpdated: new Date(),
                version: PRIVACY_SETTINGS_VERSION
            };

            const summary = PrivacyUtils.generatePrivacySettingsSummary(mockSettings);
            console.log('✓ Privacy settings summary:', summary);

        } catch (error) {
            console.error('❌ Error in utilities demo:', error);
        }
    }

    /**
     * Run infrastructure validation
     */
    static async demonstrateValidation(): Promise<void> {
        console.log('\n✅ Infrastructure Validation');
        console.log('============================');

        try {
            const validationReport = await validatePrivacyInfrastructure();
            console.log('\n📋 Validation Report:');
            console.log('Overall Status:', validationReport.overall ? '✅ PASS' : '❌ FAIL');
            console.log('Summary:', validationReport.summary);

            console.log('\nDetailed Results:');
            validationReport.results.forEach((result, index) => {
                const status = result.success ? '✅' : '❌';
                console.log(`  ${index + 1}. ${status} ${result.message}`);
                if (result.details) {
                    console.log('     Details:', result.details);
                }
            });

        } catch (error) {
            console.error('❌ Error in validation demo:', error);
        }
    }

    /**
     * Run complete demo
     */
    static async runCompleteDemo(): Promise<void> {
        console.log('🚀 Starting Privacy Settings Infrastructure Demo...\n');

        // Run validation first
        await this.demonstrateValidation();

        // Demonstrate utilities (no async operations)
        this.demonstrateUtilities();

        // Demonstrate services (with mocked Firebase)
        console.log('\n⚠️  Note: Service demos will use mocked Firebase operations in this environment');
        await this.demonstratePrivacyService();
        await this.demonstrateAuditService();

        console.log('\n🎉 Privacy Settings Infrastructure Demo Complete!');
        console.log('\nNext Steps:');
        console.log('- Integrate with Firebase in your application');
        console.log('- Create UI components using these services');
        console.log('- Configure Firestore security rules');
        console.log('- Set up proper error handling and monitoring');
    }
}

// Export demo function for easy use
export const runPrivacyDemo = PrivacyInfrastructureDemo.runCompleteDemo;