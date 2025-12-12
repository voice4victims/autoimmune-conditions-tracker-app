export interface HIPAACompliance {
    // Administrative Safeguards
    securityOfficer: string;
    conductedSecurityEvaluation: boolean;
    assignedSecurityResponsibilities: boolean;
    informationAccessManagement: boolean;
    workforceTraining: boolean;
    informationSecurityIncidentProcedures: boolean;
    contingencyPlan: boolean;
    evaluationProcedures: boolean;
}

export interface AuditLog {
    id: string;
    user_id: string;
    action: HIPAAAction;
    resource_type: string;
    resource_id?: string;
    timestamp: Date;
    ip_address?: string;
    user_agent?: string;
    success: boolean;
    details?: string;
    phi_accessed?: boolean;
    patient_id?: string;
}

export type HIPAAAction =
    | 'login'
    | 'logout'
    | 'view_phi'
    | 'create_phi'
    | 'update_phi'
    | 'delete_phi'
    | 'export_phi'
    | 'share_phi'
    | 'access_denied'
    | 'password_change'
    | 'account_locked'
    | 'data_breach_detected'
    | 'unauthorized_access_attempt';

export interface DataRetentionPolicy {
    retention_period_years: number;
    automatic_deletion: boolean;
    deletion_notification: boolean;
    legal_hold_exceptions: string[];
}

export interface PrivacySettings {
    user_id: string;
    data_sharing_consent: boolean;
    marketing_consent: boolean;
    research_consent: boolean;
    minimum_necessary_standard: boolean;
    access_log_retention_days: number;
    created_at: Date;
    updated_at: Date;
}

export interface BreachNotification {
    id: string;
    incident_date: Date;
    discovery_date: Date;
    breach_type: 'unauthorized_access' | 'data_theft' | 'system_compromise' | 'human_error';
    affected_records: number;
    phi_involved: boolean;
    notification_required: boolean;
    notification_sent: boolean;
    mitigation_steps: string[];
    status: 'investigating' | 'contained' | 'resolved';
}

export interface BusinessAssociateAgreement {
    id: string;
    organization_name: string;
    contact_person: string;
    services_provided: string[];
    phi_access_level: 'full' | 'limited' | 'none';
    agreement_date: Date;
    expiration_date: Date;
    is_active: boolean;
    compliance_verified: boolean;
}

export const HIPAA_REQUIRED_SAFEGUARDS = {
    administrative: [
        'Security Officer Assignment',
        'Workforce Training',
        'Information Access Management',
        'Security Awareness and Training',
        'Security Incident Procedures',
        'Contingency Plan',
        'Evaluation Procedures'
    ],
    physical: [
        'Facility Access Controls',
        'Workstation Use Restrictions',
        'Device and Media Controls'
    ],
    technical: [
        'Access Control',
        'Audit Controls',
        'Integrity',
        'Person or Entity Authentication',
        'Transmission Security'
    ]
} as const;