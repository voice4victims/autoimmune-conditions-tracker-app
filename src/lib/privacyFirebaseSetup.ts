import {
    collection,
    doc,
    setDoc,
    getDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firebase Collections Setup for Privacy Settings
 * 
 * This module ensures that the necessary Firestore collections and initial
 * documents are properly configured for the privacy settings system.
 */

export interface FirebaseCollectionConfig {
    name: string;
    description: string;
    requiredIndexes: string[];
    sampleDocument?: any;
}

export const PRIVACY_COLLECTIONS: FirebaseCollectionConfig[] = [
    {
        name: 'privacy_settings',
        description: 'User privacy preferences and settings',
        requiredIndexes: [
            'userId',
            'lastUpdated',
            'version'
        ],
        sampleDocument: {
            userId: 'sample_user_id',
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
                retentionPeriod: 84,
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
            lastUpdated: Timestamp.now(),
            version: 1
        }
    },
    {
        name: 'privacy_audit_logs',
        description: 'Comprehensive audit logs for privacy-related actions',
        requiredIndexes: [
            'userId',
            'timestamp',
            'action',
            'accessorId',
            'resourceType',
            'result',
            'childId'
        ],
        sampleDocument: {
            userId: 'sample_user_id',
            accessorId: 'sample_accessor_id',
            accessorName: 'Sample User',
            accessorType: 'family_member',
            action: 'view_data',
            resourceType: 'symptoms',
            resourceId: 'sample_resource_id',
            childId: 'sample_child_id',
            timestamp: Timestamp.now(),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            result: 'success',
            details: 'Sample audit log entry',
            sessionId: 'sample_session_id'
        }
    },
    {
        name: 'deletion_requests',
        description: 'Data deletion requests and their status',
        requiredIndexes: [
            'userId',
            'requestedAt',
            'status',
            'scheduledFor'
        ],
        sampleDocument: {
            userId: 'sample_user_id',
            requestedAt: Timestamp.now(),
            requestedBy: 'sample_user_id',
            deletionScope: 'all_data',
            status: 'pending',
            scheduledFor: null,
            completedAt: null,
            reason: 'User requested account deletion',
            legalHoldBlocked: false,
            affectedRecords: []
        }
    },
    {
        name: 'temporary_access',
        description: 'Temporary access grants for healthcare providers',
        requiredIndexes: [
            'grantedTo',
            'grantedAt',
            'expiresAt',
            'isActive'
        ],
        sampleDocument: {
            grantedTo: 'sample_provider_id',
            grantedToName: 'Dr. Sample Provider',
            grantedToEmail: 'provider@example.com',
            permissions: ['view_symptoms', 'view_treatments'],
            grantedAt: Timestamp.now(),
            expiresAt: Timestamp.now(),
            isActive: true,
            accessCount: 0,
            maxAccessCount: 5,
            purpose: 'Medical consultation',
            lastAccessed: null
        }
    },
    {
        name: 'family_access',
        description: 'Family member access permissions (extends existing collection)',
        requiredIndexes: [
            'user_id',
            'family_id',
            'role',
            'is_active',
            'accepted_at'
        ]
    },
    {
        name: 'provider_access',
        description: 'Healthcare provider access permissions',
        requiredIndexes: [
            'providerId',
            'grantedAt',
            'expiresAt',
            'isActive',
            'accessMethod'
        ],
        sampleDocument: {
            providerId: 'sample_provider_id',
            providerName: 'Dr. Sample Provider',
            providerEmail: 'provider@example.com',
            organization: 'Sample Medical Center',
            permissions: ['view_symptoms', 'view_treatments', 'view_vitals'],
            grantedAt: Timestamp.now(),
            expiresAt: null,
            isActive: true,
            accessMethod: 'magic_link',
            lastAccessed: null
        }
    },
    {
        name: 'audit_failures',
        description: 'Log of audit logging failures for monitoring',
        requiredIndexes: [
            'timestamp',
            'severity'
        ],
        sampleDocument: {
            error: 'Sample audit failure',
            context: { userId: 'sample_user_id', action: 'view_data' },
            timestamp: Timestamp.now(),
            severity: 'critical'
        }
    }
];

export class PrivacyFirebaseSetup {
    /**
     * Initialize all required collections for privacy settings
     */
    static async initializeCollections(): Promise<void> {
        console.log('Initializing privacy settings Firebase collections...');

        for (const collectionConfig of PRIVACY_COLLECTIONS) {
            try {
                await this.ensureCollectionExists(collectionConfig);
                console.log(`✓ Collection '${collectionConfig.name}' initialized`);
            } catch (error) {
                console.error(`✗ Failed to initialize collection '${collectionConfig.name}':`, error);
            }
        }

        console.log('Privacy settings Firebase collections initialization complete');
    }

    /**
     * Ensure a collection exists by creating a sample document if needed
     */
    private static async ensureCollectionExists(config: FirebaseCollectionConfig): Promise<void> {
        if (!config.sampleDocument) {
            // Collection doesn't need initialization
            return;
        }

        const collectionRef = collection(db, config.name);
        const sampleDocRef = doc(collectionRef, '_sample_document');

        try {
            const docSnap = await getDoc(sampleDocRef);

            if (!docSnap.exists()) {
                // Create sample document to initialize collection
                await setDoc(sampleDocRef, {
                    ...config.sampleDocument,
                    _isSampleDocument: true,
                    _description: config.description,
                    _createdAt: Timestamp.now()
                });
            }
        } catch (error) {
            console.error(`Error ensuring collection ${config.name} exists:`, error);
            throw error;
        }
    }

    /**
     * Get required Firestore indexes for privacy collections
     * This information can be used to create firestore.indexes.json
     */
    static getRequiredIndexes(): any {
        const indexes = [];

        for (const collection of PRIVACY_COLLECTIONS) {
            // Single field indexes
            for (const field of collection.requiredIndexes) {
                indexes.push({
                    collectionGroup: collection.name,
                    queryScope: 'COLLECTION',
                    fields: [
                        {
                            fieldPath: field,
                            order: 'ASCENDING'
                        }
                    ]
                });
            }

            // Composite indexes for common query patterns
            if (collection.name === 'privacy_audit_logs') {
                // Common query: userId + timestamp
                indexes.push({
                    collectionGroup: collection.name,
                    queryScope: 'COLLECTION',
                    fields: [
                        { fieldPath: 'userId', order: 'ASCENDING' },
                        { fieldPath: 'timestamp', order: 'DESCENDING' }
                    ]
                });

                // Common query: userId + action + timestamp
                indexes.push({
                    collectionGroup: collection.name,
                    queryScope: 'COLLECTION',
                    fields: [
                        { fieldPath: 'userId', order: 'ASCENDING' },
                        { fieldPath: 'action', order: 'ASCENDING' },
                        { fieldPath: 'timestamp', order: 'DESCENDING' }
                    ]
                });

                // Common query: userId + resourceType + timestamp
                indexes.push({
                    collectionGroup: collection.name,
                    queryScope: 'COLLECTION',
                    fields: [
                        { fieldPath: 'userId', order: 'ASCENDING' },
                        { fieldPath: 'resourceType', order: 'ASCENDING' },
                        { fieldPath: 'timestamp', order: 'DESCENDING' }
                    ]
                });
            }

            if (collection.name === 'temporary_access') {
                // Common query: isActive + expiresAt
                indexes.push({
                    collectionGroup: collection.name,
                    queryScope: 'COLLECTION',
                    fields: [
                        { fieldPath: 'isActive', order: 'ASCENDING' },
                        { fieldPath: 'expiresAt', order: 'ASCENDING' }
                    ]
                });
            }
        }

        return {
            indexes,
            fieldOverrides: []
        };
    }

    /**
     * Generate firestore.indexes.json content
     */
    static generateFirestoreIndexesJson(): string {
        const indexConfig = this.getRequiredIndexes();
        return JSON.stringify(indexConfig, null, 2);
    }

    /**
     * Validate that all required collections are accessible
     */
    static async validateCollections(): Promise<boolean> {
        console.log('Validating privacy settings collections...');

        let allValid = true;

        for (const collectionConfig of PRIVACY_COLLECTIONS) {
            try {
                const collectionRef = collection(db, collectionConfig.name);
                // Try to access the collection (this will fail if permissions are wrong)
                await getDocs(collectionRef);
                console.log(`✓ Collection '${collectionConfig.name}' is accessible`);
            } catch (error) {
                console.error(`✗ Collection '${collectionConfig.name}' is not accessible:`, error);
                allValid = false;
            }
        }

        return allValid;
    }
}

// Auto-initialize collections in development
if (process.env.NODE_ENV === 'development') {
    PrivacyFirebaseSetup.initializeCollections().catch(console.error);
}