export interface PrivacySettings {
    id: string;
    userId: string;
    dataSharing: DataSharingPreferences;
    accessControl: AccessControlSettings;
    dataRetention: DataRetentionSettings;
    communications: CommunicationPreferences;
    childSpecific: Record<string, ChildPrivacySettings>;
    lastUpdated: Date;
    version: number;
}

export interface DataSharingPreferences {
    researchParticipation: boolean;
    anonymizedDataSharing: boolean;
    thirdPartyIntegrations: Record<string, boolean>;
    marketingConsent: boolean;
    consentHistory: ConsentRecord[];
}

export interface ConsentRecord {
    id: string;
    consentType: ConsentType;
    granted: boolean;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    version: string;
}

export type ConsentType =
    | 'research_participation'
    | 'anonymized_data_sharing'
    | 'marketing_consent'
    | 'third_party_integration'
    | 'data_processing';

export interface AccessControlSettings {
    familyMembers: FamilyMemberAccess[];
    healthcareProviders: ProviderAccess[];
    temporaryAccess: TemporaryAccess[];
}

export interface FamilyMemberAccess {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: FamilyRole;
    permissions: Permission[];
    grantedAt: Date;
    grantedBy: string;
    isActive: boolean;
    lastAccessed?: Date;
}

export interface ProviderAccess {
    id: string;
    providerId?: string;
    providerName: string;
    providerEmail?: string;
    organization?: string;
    permissions: Permission[];
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
    accessMethod: 'magic_link' | 'direct_access';
    lastAccessed?: Date;
}

export interface TemporaryAccess {
    id: string;
    grantedTo: string;
    grantedToName: string;
    grantedToEmail?: string;
    permissions: Permission[];
    grantedAt: Date;
    expiresAt: Date;
    isActive: boolean;
    accessCount: number;
    maxAccessCount?: number;
    purpose: string;
    lastAccessed?: Date;
}

export type FamilyRole = 'parent' | 'caregiver' | 'guardian' | 'viewer';

export type Permission =
    | 'view_symptoms'
    | 'edit_symptoms'
    | 'view_treatments'
    | 'edit_treatments'
    | 'view_vitals'
    | 'edit_vitals'
    | 'view_notes'
    | 'edit_notes'
    | 'view_files'
    | 'upload_files'
    | 'view_analytics'
    | 'manage_access'
    | 'export_data';

export interface DataRetentionSettings {
    automaticDeletion: boolean;
    retentionPeriod: number; // in months
    deleteAfterInactivity: boolean;
    inactivityPeriod: number; // in months
    legalHolds: LegalHold[];
}

export interface LegalHold {
    id: string;
    reason: string;
    appliedAt: Date;
    appliedBy: string;
    isActive: boolean;
    expiresAt?: Date;
    affectedDataTypes: string[];
}

export interface CommunicationPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
    medicalReminders: boolean;
    thirdPartyMarketing: boolean;
    communicationHistory: CommunicationRecord[];
}

export interface CommunicationRecord {
    id: string;
    type: CommunicationType;
    enabled: boolean;
    changedAt: Date;
    changedBy: string;
    reason?: string;
}

export type CommunicationType =
    | 'email_notifications'
    | 'sms_notifications'
    | 'marketing_emails'
    | 'security_alerts'
    | 'medical_reminders'
    | 'third_party_marketing';

export interface ChildPrivacySettings {
    childId: string;
    restrictedAccess: boolean;
    allowedUsers: string[];
    dataRetentionOverride?: Partial<DataRetentionSettings>;
    communicationRestrictions: CommunicationType[];
    inheritFromParent: boolean;
    customPermissions?: Record<string, Permission[]>;
}

export interface AccessLog {
    id: string;
    userId: string;
    accessorId: string;
    accessorName: string;
    accessorType: 'family_member' | 'healthcare_provider' | 'temporary_user' | 'system';
    action: PrivacyAction;
    resourceType: string;
    resourceId?: string;
    childId?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    result: AccessResult;
    details?: string;
    sessionId?: string;
}

export type PrivacyAction =
    | 'view_data'
    | 'edit_data'
    | 'export_data'
    | 'delete_data'
    | 'grant_access'
    | 'revoke_access'
    | 'update_privacy_settings'
    | 'consent_change'
    | 'login'
    | 'logout'
    | 'access_denied';

export type AccessResult = 'success' | 'denied' | 'error' | 'partial';

export interface AuditReport {
    id: string;
    userId: string;
    generatedAt: Date;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    filters: LogFilters;
    entries: AccessLog[];
    summary: AuditSummary;
    format: 'pdf' | 'csv' | 'json';
}

export interface LogFilters {
    startDate?: Date;
    endDate?: Date;
    accessorId?: string;
    action?: PrivacyAction;
    resourceType?: string;
    childId?: string;
    result?: AccessResult;
}

export interface AuditSummary {
    totalEntries: number;
    successfulAccess: number;
    deniedAccess: number;
    uniqueAccessors: number;
    mostAccessedResource: string;
    suspiciousActivity: SuspiciousActivity[];
}

export interface SuspiciousActivity {
    type: 'unusual_access_pattern' | 'multiple_failed_attempts' | 'off_hours_access' | 'bulk_data_access';
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
    relatedLogs: string[];
}

export interface DeletionRequest {
    id: string;
    userId: string;
    requestedAt: Date;
    requestedBy: string;
    deletionScope: DeletionScope;
    status: DeletionStatus;
    scheduledFor?: Date;
    completedAt?: Date;
    reason?: string;
    legalHoldBlocked: boolean;
    affectedRecords: string[];
}

export type DeletionScope =
    | 'all_data'
    | 'child_specific'
    | 'date_range'
    | 'data_type_specific';

export type DeletionStatus =
    | 'pending'
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'blocked_legal_hold';

// Service interfaces
export interface PrivacyServiceInterface {
    getPrivacySettings(userId: string): Promise<PrivacySettings>;
    updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void>;
    revokeConsent(userId: string, consentType: ConsentType): Promise<void>;
    requestDataDeletion(userId: string, deletionScope: DeletionScope, reason?: string): Promise<string>;
    getDeletionRequests(userId: string): Promise<DeletionRequest[]>;
    grantTemporaryAccess(userId: string, accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>): Promise<string>;
    revokeAccess(userId: string, accessId: string, accessType: 'family' | 'provider' | 'temporary'): Promise<void>;
}

export interface AuditServiceInterface {
    logPrivacyAction(userId: string, action: PrivacyAction, details: Partial<AccessLog>): Promise<void>;
    getAccessLogs(userId: string, filters?: LogFilters): Promise<AccessLog[]>;
    generateAuditReport(userId: string, dateRange: { startDate: Date; endDate: Date }, filters?: LogFilters): Promise<AuditReport>;
    detectSuspiciousActivity(userId: string): Promise<SuspiciousActivity[]>;
}

// Validation schemas and constants
export const PRIVACY_SETTINGS_VERSION = 1;

export const DEFAULT_RETENTION_PERIOD = 84; // 7 years in months
export const DEFAULT_INACTIVITY_PERIOD = 24; // 2 years in months

export const PERMISSION_GROUPS = {
    'view_only': ['view_symptoms', 'view_treatments', 'view_vitals', 'view_notes', 'view_files', 'view_analytics'] as Permission[],
    'basic_edit': ['view_symptoms', 'edit_symptoms', 'view_treatments', 'view_vitals', 'view_notes', 'edit_notes'] as Permission[],
    'full_access': ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data'] as Permission[],
    'admin': ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data', 'manage_access'] as Permission[]
} as const;

export const ROLE_PERMISSIONS: Record<FamilyRole, Permission[]> = {
    'parent': PERMISSION_GROUPS.admin,
    'guardian': PERMISSION_GROUPS.admin,
    'caregiver': PERMISSION_GROUPS.full_access,
    'viewer': PERMISSION_GROUPS.view_only
};