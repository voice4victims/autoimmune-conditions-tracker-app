import {
    collection,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
    PrivacySettings,
    PrivacyServiceInterface,
    ConsentType,
    DeletionScope,
    TemporaryAccess,
    AccessLog,
    PrivacyAction,
    ConsentRecord,
    DeletionRequest,
    PRIVACY_SETTINGS_VERSION,
    DEFAULT_RETENTION_PERIOD,
    DEFAULT_INACTIVITY_PERIOD,
    DataSharingPreferences,
    AccessControlSettings,
    DataRetentionSettings,
    CommunicationPreferences
} from '@/types/privacy';

export class PrivacyService implements PrivacyServiceInterface {
    private static instance: PrivacyService;

    public static getInstance(): PrivacyService {
        if (!PrivacyService.instance) {
            PrivacyService.instance = new PrivacyService();
        }
        return PrivacyService.instance;
    }

    async getPrivacySettings(userId: string): Promise<PrivacySettings> {
        try {
            const privacyDoc = doc(db, 'privacy_settings', userId);
            const docSnap = await getDoc(privacyDoc);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    userId: data.userId,
                    dataSharing: data.dataSharing,
                    accessControl: data.accessControl,
                    dataRetention: data.dataRetention,
                    communications: data.communications,
                    childSpecific: data.childSpecific || {},
                    lastUpdated: data.lastUpdated.toDate(),
                    version: data.version || PRIVACY_SETTINGS_VERSION
                };
            } else {
                // Create default privacy settings
                const defaultSettings = this.createDefaultPrivacySettings(userId);
                await this.savePrivacySettings(defaultSettings);
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error getting privacy settings:', error);
            throw new Error('Failed to retrieve privacy settings');
        }
    }

    async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
        try {
            const privacyDoc = doc(db, 'privacy_settings', userId);
            const cleanSettings = Object.fromEntries(
                Object.entries(settings).filter(([_, v]) => v !== undefined)
            );
            const updateData = {
                ...cleanSettings,
                lastUpdated: serverTimestamp(),
                version: PRIVACY_SETTINGS_VERSION
            };

            await setDoc(privacyDoc, updateData, { merge: true });

            // Log the privacy settings change
            await this.logPrivacyAction(userId, 'update_privacy_settings', {
                resourceType: 'privacy_settings',
                resourceId: userId,
                details: 'Privacy settings updated'
            });
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            throw new Error('Failed to update privacy settings');
        }
    }

    async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
        try {
            const currentSettings = await this.getPrivacySettings(userId);
            const consentRecord: ConsentRecord = {
                id: crypto.randomUUID(),
                consentType,
                granted: false,
                timestamp: new Date(),
                ipAddress: await this.getClientIP(),
                userAgent: navigator.userAgent,
                version: PRIVACY_SETTINGS_VERSION.toString()
            };

            // Update the specific consent setting
            const updatedDataSharing: DataSharingPreferences = {
                ...currentSettings.dataSharing,
                consentHistory: [...currentSettings.dataSharing.consentHistory, consentRecord]
            };

            switch (consentType) {
                case 'research_participation':
                    updatedDataSharing.researchParticipation = false;
                    break;
                case 'anonymized_data_sharing':
                    updatedDataSharing.anonymizedDataSharing = false;
                    break;
                case 'marketing_consent':
                    updatedDataSharing.marketingConsent = false;
                    break;
                case 'third_party_integration':
                    // Revoke all third-party integrations
                    Object.keys(updatedDataSharing.thirdPartyIntegrations).forEach(key => {
                        updatedDataSharing.thirdPartyIntegrations[key] = false;
                    });
                    break;
            }

            await this.updatePrivacySettings(userId, {
                dataSharing: updatedDataSharing
            });

            // Log consent revocation
            await this.logPrivacyAction(userId, 'consent_change', {
                resourceType: 'consent',
                details: `Consent revoked for ${consentType}`
            });

            // Trigger immediate data sharing cessation
            await this.processConsentRevocation(userId, consentType);
        } catch (error) {
            console.error('Error revoking consent:', error);
            throw new Error('Failed to revoke consent');
        }
    }

    async requestDataDeletion(userId: string, deletionScope: DeletionScope, reason?: string): Promise<string> {
        try {
            const deletionRequest: Omit<DeletionRequest, 'id'> = {
                userId,
                requestedAt: new Date(),
                requestedBy: userId,
                deletionScope,
                status: 'pending',
                reason,
                legalHoldBlocked: false,
                affectedRecords: []
            };

            // Check for legal holds
            const currentSettings = await this.getPrivacySettings(userId);
            const activeLegalHolds = currentSettings.dataRetention.legalHolds.filter(hold => hold.isActive);

            if (activeLegalHolds.length > 0) {
                deletionRequest.status = 'blocked_legal_hold';
                deletionRequest.legalHoldBlocked = true;
            } else {
                // Schedule deletion for 30 days from now (as per requirements)
                const scheduledDate = new Date();
                scheduledDate.setDate(scheduledDate.getDate() + 30);
                deletionRequest.scheduledFor = scheduledDate;
                deletionRequest.status = 'scheduled';
            }

            const docRef = await addDoc(collection(db, 'deletion_requests'), {
                ...deletionRequest,
                requestedAt: Timestamp.fromDate(deletionRequest.requestedAt),
                scheduledFor: deletionRequest.scheduledFor ? Timestamp.fromDate(deletionRequest.scheduledFor) : null
            });

            // Log deletion request
            await this.logPrivacyAction(userId, 'delete_data', {
                resourceType: 'deletion_request',
                resourceId: docRef.id,
                details: `Data deletion requested: ${deletionScope}`
            });

            return docRef.id;
        } catch (error) {
            console.error('Error requesting data deletion:', error);
            throw new Error('Failed to request data deletion');
        }
    }

    async grantTemporaryAccess(
        userId: string,
        accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>
    ): Promise<string> {
        try {
            const temporaryAccess: Omit<TemporaryAccess, 'id'> = {
                ...accessConfig,
                grantedAt: new Date(),
                isActive: true,
                accessCount: 0
            };

            const docRef = await addDoc(collection(db, 'temporary_access'), {
                ...temporaryAccess,
                grantedAt: Timestamp.fromDate(temporaryAccess.grantedAt),
                expiresAt: Timestamp.fromDate(temporaryAccess.expiresAt)
            });

            // Log access grant
            await this.logPrivacyAction(userId, 'grant_access', {
                resourceType: 'temporary_access',
                resourceId: docRef.id,
                details: `Temporary access granted to ${accessConfig.grantedToName}`
            });

            return docRef.id;
        } catch (error) {
            console.error('Error granting temporary access:', error);
            throw new Error('Failed to grant temporary access');
        }
    }

    async revokeAccess(userId: string, accessId: string, accessType: 'family' | 'provider' | 'temporary'): Promise<void> {
        try {
            const collectionName = this.getAccessCollectionName(accessType);
            const accessRef = doc(db, collectionName, accessId);
            const accessSnap = await getDoc(accessRef);

            if (!accessSnap.exists()) {
                throw new Error(`Access record ${accessId} not found in ${collectionName}`);
            }

            await updateDoc(accessRef, {
                isActive: false,
                revokedAt: serverTimestamp(),
                revokedBy: userId
            });

            // Log access revocation
            await this.logPrivacyAction(userId, 'revoke_access', {
                resourceType: accessType + '_access',
                resourceId: accessId,
                details: `${accessType} access revoked`
            });
        } catch (error) {
            console.error('Error revoking access:', error);
            throw new Error('Failed to revoke access');
        }
    }

    // Private helper methods
    private createDefaultPrivacySettings(userId: string): PrivacySettings {
        return {
            id: userId,
            userId,
            dataSharing: {
                researchParticipation: false,
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
                inactivityPeriod: DEFAULT_INACTIVITY_PERIOD,
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
    }

    private async savePrivacySettings(settings: PrivacySettings): Promise<void> {
        const privacyDoc = doc(db, 'privacy_settings', settings.userId);
        await setDoc(privacyDoc, {
            ...settings,
            lastUpdated: Timestamp.fromDate(settings.lastUpdated)
        });
    }

    async logPrivacyAction(userId: string, action: PrivacyAction, details: Partial<AccessLog>): Promise<void> {
        try {
            const logEntry: Record<string, any> = {
                userId,
                accessorId: userId,
                accessorName: 'User',
                accessorType: 'system',
                action,
                resourceType: details.resourceType || 'unknown',
                resourceId: details.resourceId || 'unknown',
                timestamp: new Date(),
                ipAddress: await this.getClientIP() || 'unknown',
                userAgent: navigator.userAgent,
                result: 'success',
                sessionId: this.generateSessionId()
            };
            if (details.childId) logEntry.childId = details.childId;
            if (details.details) logEntry.details = details.details;

            await addDoc(collection(db, 'privacy_audit_logs'), {
                ...logEntry,
                timestamp: Timestamp.fromDate(logEntry.timestamp)
            });
        } catch (error) {
            console.error('Failed to log privacy action:', error);
            // Don't throw here as logging failure shouldn't break the main operation
        }
    }

    private async getClientIP(): Promise<string | undefined> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return undefined;
        }
    }

    private generateSessionId(): string {
        return crypto.randomUUID();
    }

    private getAccessCollectionName(accessType: 'family' | 'provider' | 'temporary'): string {
        switch (accessType) {
            case 'family':
                return 'family_access';
            case 'provider':
                return 'provider_access';
            case 'temporary':
                return 'temporary_access';
            default:
                throw new Error('Invalid access type');
        }
    }

    private async processConsentRevocation(userId: string, consentType: ConsentType): Promise<void> {
        // Implement immediate cessation of data sharing based on consent type
        switch (consentType) {
            case 'research_participation':
                await this.stopResearchDataSharing(userId);
                break;
            case 'anonymized_data_sharing':
                await this.stopAnonymizedDataSharing(userId);
                break;
            case 'marketing_consent':
                await this.stopMarketingCommunications(userId);
                break;
            case 'third_party_integration':
                await this.revokeThirdPartyAccess(userId);
                break;
        }
    }

    private async stopResearchDataSharing(userId: string): Promise<void> {
        // Implementation would depend on research data sharing mechanisms
        console.log(`Stopping research data sharing for user ${userId}`);
    }

    private async stopAnonymizedDataSharing(userId: string): Promise<void> {
        // Implementation would depend on anonymized data sharing mechanisms
        console.log(`Stopping anonymized data sharing for user ${userId}`);
    }

    private async stopMarketingCommunications(userId: string): Promise<void> {
        // Implementation would integrate with communication systems
        console.log(`Stopping marketing communications for user ${userId}`);
    }

    private async revokeThirdPartyAccess(userId: string): Promise<void> {
        // Implementation would revoke all third-party API access
        console.log(`Revoking third-party access for user ${userId}`);
    }

    // Data deletion methods
    async getDeletionRequests(userId: string): Promise<DeletionRequest[]> {
        try {
            const deletionQuery = query(
                collection(db, 'deletion_requests'),
                where('userId', '==', userId),
                orderBy('requestedAt', 'desc')
            );

            const querySnapshot = await getDocs(deletionQuery);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    requestedAt: data.requestedAt.toDate(),
                    requestedBy: data.requestedBy,
                    deletionScope: data.deletionScope,
                    status: data.status,
                    scheduledFor: data.scheduledFor?.toDate(),
                    completedAt: data.completedAt?.toDate(),
                    reason: data.reason,
                    legalHoldBlocked: data.legalHoldBlocked,
                    affectedRecords: data.affectedRecords || []
                };
            });
        } catch (error) {
            console.error('Error getting deletion requests:', error);
            throw new Error('Failed to retrieve deletion requests');
        }
    }

    async processScheduledDeletions(): Promise<void> {
        try {
            const now = new Date();
            const scheduledQuery = query(
                collection(db, 'deletion_requests'),
                where('status', '==', 'scheduled'),
                where('scheduledFor', '<=', Timestamp.fromDate(now))
            );

            const scheduledDeletions = await getDocs(scheduledQuery);
            const batch = writeBatch(db);

            for (const deletionDoc of scheduledDeletions.docs) {
                const deletion = deletionDoc.data() as any;

                // Check for legal holds before processing
                const currentSettings = await this.getPrivacySettings(deletion.userId);
                const activeLegalHolds = currentSettings.dataRetention.legalHolds.filter(hold => hold.isActive);

                if (activeLegalHolds.length > 0) {
                    // Block deletion due to legal holds
                    batch.update(deletionDoc.ref, {
                        status: 'blocked_legal_hold',
                        legalHoldBlocked: true
                    });
                } else {
                    // Process deletion
                    batch.update(deletionDoc.ref, {
                        status: 'in_progress'
                    });

                    // Execute the actual data deletion based on scope
                    await this.executeDataDeletion(deletion.userId, deletion.deletionScope, deletion.id);

                    // Mark as completed
                    batch.update(deletionDoc.ref, {
                        status: 'completed',
                        completedAt: serverTimestamp()
                    });
                }
            }

            await batch.commit();
        } catch (error) {
            console.error('Error processing scheduled deletions:', error);
        }
    }

    async processAutomaticDataDeletion(): Promise<void> {
        try {
            // Get all users with automatic deletion enabled
            const privacyQuery = query(
                collection(db, 'privacy_settings'),
                where('dataRetention.automaticDeletion', '==', true)
            );

            const privacySettings = await getDocs(privacyQuery);

            for (const settingsDoc of privacySettings.docs) {
                const settings = settingsDoc.data();
                const userId = settings.userId;
                const retentionPeriod = settings.dataRetention.retentionPeriod;
                const deleteAfterInactivity = settings.dataRetention.deleteAfterInactivity;
                const inactivityPeriod = settings.dataRetention.inactivityPeriod;

                // Check for legal holds
                const activeLegalHolds = settings.dataRetention.legalHolds?.filter((hold: any) => hold.isActive) || [];
                if (activeLegalHolds.length > 0) {
                    continue; // Skip users with active legal holds
                }

                // Calculate deletion dates
                const now = new Date();
                const retentionCutoff = new Date();
                retentionCutoff.setMonth(retentionCutoff.getMonth() - retentionPeriod);

                let shouldDelete = false;
                let deletionReason = '';

                // Check retention period
                const userCreatedAt = await this.getUserCreatedDate(userId);
                if (userCreatedAt && userCreatedAt < retentionCutoff) {
                    shouldDelete = true;
                    deletionReason = `Automatic deletion after ${retentionPeriod} month retention period`;
                }

                // Check inactivity period
                if (deleteAfterInactivity && !shouldDelete) {
                    const lastActivity = await this.getUserLastActivity(userId);
                    const inactivityCutoff = new Date();
                    inactivityCutoff.setMonth(inactivityCutoff.getMonth() - inactivityPeriod);

                    if (lastActivity && lastActivity < inactivityCutoff) {
                        shouldDelete = true;
                        deletionReason = `Automatic deletion after ${inactivityPeriod} months of inactivity`;
                    }
                }

                if (shouldDelete) {
                    // Create automatic deletion request
                    await this.requestDataDeletion(userId, 'all_data', deletionReason);
                }
            }
        } catch (error) {
            console.error('Error processing automatic data deletion:', error);
        }
    }

    private async executeDataDeletion(userId: string, scope: DeletionScope, requestId: string): Promise<void> {
        try {
            const batch = writeBatch(db);
            const affectedRecords: string[] = [];

            switch (scope) {
                case 'all_data':
                    // Delete all user data across collections
                    const collections = [
                        'symptoms', 'treatments', 'vitals', 'notes', 'files',
                        'medical_visits', 'providers', 'children', 'family_access',
                        'provider_access', 'temporary_access'
                    ];

                    for (const collectionName of collections) {
                        const userDataQuery = query(
                            collection(db, collectionName),
                            where('userId', '==', userId)
                        );
                        const userDataDocs = await getDocs(userDataQuery);

                        userDataDocs.docs.forEach(doc => {
                            batch.delete(doc.ref);
                            affectedRecords.push(`${collectionName}:${doc.id}`);
                        });
                    }

                    // Delete privacy settings last
                    const privacyDoc = doc(db, 'privacy_settings', userId);
                    batch.delete(privacyDoc);
                    affectedRecords.push(`privacy_settings:${userId}`);
                    break;

                case 'child_specific':
                    // Implementation would delete data for specific child
                    // This would require additional parameters in the deletion request
                    break;

                case 'date_range':
                    // Implementation would delete data within date range
                    // This would require additional parameters in the deletion request
                    break;

                case 'data_type_specific':
                    // Implementation would delete specific data types
                    // This would require additional parameters in the deletion request
                    break;
            }

            // Update deletion request with affected records
            const deletionDoc = doc(db, 'deletion_requests', requestId);
            batch.update(deletionDoc, {
                affectedRecords
            });

            await batch.commit();

            // Log the deletion
            await this.logPrivacyAction(userId, 'delete_data', {
                resourceType: 'data_deletion',
                resourceId: requestId,
                details: `Data deletion executed: ${scope}, ${affectedRecords.length} records affected`
            });
        } catch (error) {
            console.error('Error executing data deletion:', error);

            // Mark deletion as failed
            const deletionDoc = doc(db, 'deletion_requests', requestId);
            await updateDoc(deletionDoc, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw error;
        }
    }

    private async getUserCreatedDate(userId: string): Promise<Date | null> {
        try {
            // This would typically come from the user's auth record or profile
            // For now, we'll use the privacy settings creation date as a proxy
            const privacyDoc = doc(db, 'privacy_settings', userId);
            const docSnap = await getDoc(privacyDoc);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.createdAt?.toDate() || data.lastUpdated?.toDate() || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting user created date:', error);
            return null;
        }
    }

    private async getUserLastActivity(userId: string): Promise<Date | null> {
        try {
            // Get the most recent activity from audit logs
            const activityQuery = query(
                collection(db, 'privacy_audit_logs'),
                where('userId', '==', userId),
                where('action', 'in', ['view_data', 'edit_data', 'login']),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const activityDocs = await getDocs(activityQuery);
            if (activityDocs.docs.length > 0) {
                return activityDocs.docs[0].data().timestamp.toDate();
            }
            return null;
        } catch (error) {
            console.error('Error getting user last activity:', error);
            return null;
        }
    }

    // Automatic expiration handling
    async processExpiredAccess(): Promise<void> {
        try {
            // Process expired temporary access
            const tempAccessQuery = query(
                collection(db, 'temporary_access'),
                where('isActive', '==', true),
                where('expiresAt', '<=', Timestamp.now())
            );

            const expiredTempAccess = await getDocs(tempAccessQuery);
            const batch = writeBatch(db);

            expiredTempAccess.docs.forEach(doc => {
                batch.update(doc.ref, {
                    isActive: false,
                    expiredAt: serverTimestamp()
                });
            });

            // Process expired provider access
            const providerAccessQuery = query(
                collection(db, 'provider_access'),
                where('isActive', '==', true),
                where('expiresAt', '<=', Timestamp.now())
            );

            const expiredProviderAccess = await getDocs(providerAccessQuery);

            expiredProviderAccess.docs.forEach(doc => {
                batch.update(doc.ref, {
                    isActive: false,
                    expiredAt: serverTimestamp()
                });
            });

            await batch.commit();

            // Log the automatic expiration
            for (const doc of expiredTempAccess.docs) {
                const data = doc.data();
                await this.logPrivacyAction(data.userId, 'revoke_access', {
                    resourceType: 'temporary_access',
                    resourceId: doc.id,
                    details: 'Temporary access automatically expired'
                });
            }

            for (const doc of expiredProviderAccess.docs) {
                const data = doc.data();
                await this.logPrivacyAction(data.userId, 'revoke_access', {
                    resourceType: 'provider_access',
                    resourceId: doc.id,
                    details: 'Provider access automatically expired'
                });
            }
        } catch (error) {
            console.error('Error processing expired access:', error);
        }
    }

    // Check and update access control settings with expired items
    async updateAccessControlWithExpiration(userId: string): Promise<AccessControlSettings> {
        const settings = await this.getPrivacySettings(userId);
        const now = new Date();

        // Mark expired temporary access as inactive
        const updatedTemporaryAccess = settings.accessControl.temporaryAccess.map(temp => ({
            ...temp,
            isActive: temp.isActive && temp.expiresAt > now
        }));

        // Mark expired provider access as inactive
        const updatedProviders = settings.accessControl.healthcareProviders.map(provider => ({
            ...provider,
            isActive: provider.isActive && (!provider.expiresAt || provider.expiresAt > now)
        }));

        const updatedAccessControl: AccessControlSettings = {
            ...settings.accessControl,
            temporaryAccess: updatedTemporaryAccess,
            healthcareProviders: updatedProviders
        };

        // Update if there were changes
        const hasChanges =
            updatedTemporaryAccess.some((temp, index) =>
                temp.isActive !== settings.accessControl.temporaryAccess[index].isActive
            ) ||
            updatedProviders.some((provider, index) =>
                provider.isActive !== settings.accessControl.healthcareProviders[index].isActive
            );

        if (hasChanges) {
            await this.updatePrivacySettings(userId, { accessControl: updatedAccessControl });
        }

        return updatedAccessControl;
    }
}

// Export singleton instance
export const privacyService = PrivacyService.getInstance();