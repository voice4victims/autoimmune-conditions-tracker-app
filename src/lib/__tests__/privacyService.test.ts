import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyService } from '../privacyService';
import { AuditService } from '../auditService';
import { PRIVACY_SETTINGS_VERSION, DEFAULT_RETENTION_PERIOD } from '../../types/privacy';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({
        exists: () => false,
        data: () => null
    }),
    getDocs: vi.fn().mockResolvedValue({
        docs: [],
        empty: true
    }),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ toDate: () => new Date() }),
        fromDate: (date: Date) => ({ toDate: () => date })
    },
    serverTimestamp: () => ({ toDate: () => new Date() }),
    writeBatch: vi.fn(),
    and: vi.fn(),
    or: vi.fn()
}));

describe('PrivacyService', () => {
    let privacyService: PrivacyService;
    const mockUserId = 'test-user-123';

    beforeEach(() => {
        privacyService = PrivacyService.getInstance();
        vi.clearAllMocks();
    });

    describe('getPrivacySettings', () => {
        it('should create default privacy settings for new user', async () => {
            const settings = await privacyService.getPrivacySettings(mockUserId);

            expect(settings).toBeDefined();
            expect(settings.userId).toBe(mockUserId);
            expect(settings.version).toBe(PRIVACY_SETTINGS_VERSION);
            expect(settings.dataRetention.retentionPeriod).toBe(DEFAULT_RETENTION_PERIOD);
            expect(settings.dataSharing.researchParticipation).toBe(false);
            expect(settings.communications.securityAlerts).toBe(true);
        });

        it('should have proper default communication settings', async () => {
            const settings = await privacyService.getPrivacySettings(mockUserId);

            expect(settings.communications.emailNotifications).toBe(true);
            expect(settings.communications.smsNotifications).toBe(false);
            expect(settings.communications.marketingEmails).toBe(false);
            expect(settings.communications.securityAlerts).toBe(true);
            expect(settings.communications.medicalReminders).toBe(true);
            expect(settings.communications.thirdPartyMarketing).toBe(false);
        });

        it('should have proper default data sharing settings', async () => {
            const settings = await privacyService.getPrivacySettings(mockUserId);

            expect(settings.dataSharing.researchParticipation).toBe(false);
            expect(settings.dataSharing.anonymizedDataSharing).toBe(false);
            expect(settings.dataSharing.marketingConsent).toBe(false);
            expect(settings.dataSharing.thirdPartyIntegrations).toEqual({});
            expect(settings.dataSharing.consentHistory).toEqual([]);
        });

        it('should have proper default access control settings', async () => {
            const settings = await privacyService.getPrivacySettings(mockUserId);

            expect(settings.accessControl.familyMembers).toEqual([]);
            expect(settings.accessControl.healthcareProviders).toEqual([]);
            expect(settings.accessControl.temporaryAccess).toEqual([]);
        });
    });

    describe('updatePrivacySettings', () => {
        it('should update privacy settings successfully', async () => {
            const updateData = {
                dataSharing: {
                    researchParticipation: true,
                    anonymizedDataSharing: false,
                    thirdPartyIntegrations: {},
                    marketingConsent: false,
                    consentHistory: []
                }
            };

            await expect(privacyService.updatePrivacySettings(mockUserId, updateData))
                .resolves.not.toThrow();
        });
    });

    describe('revokeConsent', () => {
        it('should revoke research participation consent', async () => {
            await expect(privacyService.revokeConsent(mockUserId, 'research_participation'))
                .resolves.not.toThrow();
        });

        it('should revoke marketing consent', async () => {
            await expect(privacyService.revokeConsent(mockUserId, 'marketing_consent'))
                .resolves.not.toThrow();
        });
    });

    describe('requestDataDeletion', () => {
        it('should create data deletion request', async () => {
            const deletionId = await privacyService.requestDataDeletion(
                mockUserId,
                'all_data',
                'User requested account deletion'
            );

            expect(deletionId).toBe('mock-doc-id');
        });
    });

    describe('grantTemporaryAccess', () => {
        it('should grant temporary access successfully', async () => {
            const accessConfig = {
                grantedTo: 'provider-123',
                grantedToName: 'Dr. Test Provider',
                grantedToEmail: 'provider@test.com',
                permissions: ['view_symptoms', 'view_treatments'] as const,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                purpose: 'Medical consultation'
            };

            const accessId = await privacyService.grantTemporaryAccess(mockUserId, accessConfig);
            expect(accessId).toBe('mock-doc-id');
        });
    });
});

describe('AuditService', () => {
    let auditService: AuditService;
    const mockUserId = 'test-user-123';

    beforeEach(() => {
        auditService = AuditService.getInstance();
        vi.clearAllMocks();
    });

    describe('logPrivacyAction', () => {
        it('should log privacy action successfully', async () => {
            await expect(auditService.logPrivacyAction(mockUserId, 'view_data', {
                resourceType: 'symptoms',
                resourceId: 'symptom-123',
                details: 'User viewed symptom data'
            })).resolves.not.toThrow();
        });
    });

    describe('getAccessLogs', () => {
        it('should retrieve access logs for user', async () => {
            const logs = await auditService.getAccessLogs(mockUserId);
            expect(Array.isArray(logs)).toBe(true);
        });

        it('should apply filters when provided', async () => {
            const filters = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                action: 'view_data' as const
            };

            const logs = await auditService.getAccessLogs(mockUserId, filters);
            expect(Array.isArray(logs)).toBe(true);
        });
    });

    describe('generateAuditReport', () => {
        it('should generate audit report successfully', async () => {
            const dateRange = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31')
            };

            const report = await auditService.generateAuditReport(mockUserId, dateRange);

            expect(report).toBeDefined();
            expect(report.userId).toBe(mockUserId);
            expect(report.dateRange).toEqual(dateRange);
            expect(report.entries).toBeDefined();
            expect(report.summary).toBeDefined();
        });
    });

    describe('detectSuspiciousActivity', () => {
        it('should detect suspicious activity', async () => {
            const suspiciousActivities = await auditService.detectSuspiciousActivity(mockUserId);
            expect(Array.isArray(suspiciousActivities)).toBe(true);
        });
    });
});