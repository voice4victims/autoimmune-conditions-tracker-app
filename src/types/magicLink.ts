export interface MagicLink {
    id: string;
    family_id: string;
    child_id: string;
    created_by: string;
    provider_name: string;
    provider_email?: string;
    access_token: string;
    expires_at: Date;
    permissions: MagicLinkPermission[];
    is_active: boolean;
    access_count: number;
    max_access_count?: number;
    last_accessed?: Date;
    created_at: Date;
    notes?: string;
}

export type MagicLinkPermission =
    | 'view_symptoms'
    | 'view_treatments'
    | 'view_vitals'
    | 'view_notes'
    | 'view_files'
    | 'view_analytics'
    | 'export_data';

export interface MagicLinkAccess {
    id: string;
    magic_link_id: string;
    accessed_at: Date;
    ip_address?: string;
    user_agent?: string;
    provider_info?: {
        name?: string;
        organization?: string;
    };
}

export interface MagicLinkConfig {
    provider_name: string;
    provider_email?: string;
    permissions: MagicLinkPermission[];
    expires_in_hours: number;
    max_access_count?: number;
    notes?: string;
}

export const MAGIC_LINK_PERMISSIONS = {
    view_symptoms: 'View symptom tracking data and severity ratings',
    view_treatments: 'View treatment history and medication records',
    view_vitals: 'View vital signs and health measurements',
    view_notes: 'View daily notes and observations',
    view_files: 'View uploaded files and lab results',
    view_analytics: 'View charts, trends, and analytics',
    export_data: 'Download and export medical data'
} as const;