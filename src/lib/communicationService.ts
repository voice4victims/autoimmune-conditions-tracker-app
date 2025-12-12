import {
    CommunicationType,
    CommunicationPreferences,
    CommunicationRecord
} from '@/types/privacy';
import { privacyService } from './privacyService';

/**
 * Service for managing communication preferences and enforcement
 */
export class CommunicationService {
    private static instance: CommunicationService;

    public static getInstance(): CommunicationService {
        if (!CommunicationService.instance) {
            CommunicationService.instance = new CommunicationService();
        }
        return CommunicationService.instance;
    }

    /**
     * Process immediate marketing opt-out
     * Implements Property 12: Marketing opt-out is immediate
     */
    async processMarketingOptOut(userId: string): Promise<void> {
        try {
            // Log the immediate cessation
            await privacyService.logPrivacyAction(userId, 'update_privacy_settings', {
                resourceType: 'marketing_communications',
                resourceId: userId,
                details: 'Marketing communications immediately stopped due to user opt-out'
            });

            // In a real implementation, this would:
            // 1. Remove user from all marketing email lists
            // 2. Cancel scheduled marketing communications
            // 3. Update third-party marketing systems
            // 4. Notify marketing team of opt-out

            console.log(`Marketing communications immediately stopped for user ${userId}`);

            // Simulate immediate effect by updating marketing systems
            await this.updateMarketingSystems(userId, false);

        } catch (error) {
            console.error('Error processing marketing opt-out:', error);
            throw new Error('Failed to process marketing opt-out');
        }
    }

    /**
     * Process marketing opt-in
     */
    async processMarketingOptIn(userId: string): Promise<void> {
        try {
            // Log the opt-in
            await privacyService.logPrivacyAction(userId, 'update_privacy_settings', {
                resourceType: 'marketing_communications',
                resourceId: userId,
                details: 'User opted in to marketing communications'
            });

            // Update marketing systems
            await this.updateMarketingSystems(userId, true);

        } catch (error) {
            console.error('Error processing marketing opt-in:', error);
            throw new Error('Failed to process marketing opt-in');
        }
    }

    /**
     * Ensure essential communications continue regardless of marketing preferences
     * Implements Property 13: Essential communications continue regardless of marketing preferences
     */
    async sendEssentialCommunication(
        userId: string,
        communicationType: 'security_alerts' | 'medical_reminders',
        message: string,
        priority: 'high' | 'critical' = 'high'
    ): Promise<boolean> {
        try {
            // Get user's privacy settings
            const privacySettings = await privacyService.getPrivacySettings(userId);

            // Essential communications are always sent regardless of marketing preferences
            const canSend = this.canSendEssentialCommunication(
                communicationType,
                privacySettings.communications
            );

            if (!canSend) {
                console.warn(`Cannot send essential communication ${communicationType} to user ${userId}`);
                return false;
            }

            // Log the essential communication
            await privacyService.logPrivacyAction(userId, 'view_data', {
                resourceType: 'essential_communication',
                resourceId: userId,
                details: `Essential ${communicationType} sent: ${priority} priority`
            });

            // Send the communication (implementation would depend on communication channel)
            await this.sendCommunication(userId, communicationType, message, priority);

            return true;
        } catch (error) {
            console.error('Error sending essential communication:', error);
            return false;
        }
    }

    /**
     * Check if a communication type is allowed for a user
     */
    async canSendCommunication(
        userId: string,
        communicationType: CommunicationType
    ): Promise<boolean> {
        try {
            const privacySettings = await privacyService.getPrivacySettings(userId);

            // Essential communications are always allowed
            if (this.isEssentialCommunication(communicationType)) {
                return this.canSendEssentialCommunication(communicationType, privacySettings.communications);
            }

            // Check user's communication preferences
            return this.getCommunicationPreference(communicationType, privacySettings.communications);
        } catch (error) {
            console.error('Error checking communication permission:', error);
            return false;
        }
    }

    /**
     * Update communication preferences with propagation to all systems
     * Implements Property 14: Communication preference changes propagate within timeframe
     */
    async updateCommunicationPreferences(
        userId: string,
        updates: Partial<CommunicationPreferences>
    ): Promise<void> {
        try {
            // Update privacy settings
            await privacyService.updatePrivacySettings(userId, {
                communications: updates
            });

            // Propagate changes to all relevant systems
            await this.propagatePreferenceChanges(userId, updates);

            // Log the propagation
            await privacyService.logPrivacyAction(userId, 'update_privacy_settings', {
                resourceType: 'communication_preferences',
                resourceId: userId,
                details: `Communication preferences updated and propagated to all systems`
            });

        } catch (error) {
            console.error('Error updating communication preferences:', error);
            throw new Error('Failed to update communication preferences');
        }
    }

    /**
     * Get communication preference value
     */
    private getCommunicationPreference(
        type: CommunicationType,
        communications: CommunicationPreferences
    ): boolean {
        switch (type) {
            case 'email_notifications':
                return communications.emailNotifications;
            case 'sms_notifications':
                return communications.smsNotifications;
            case 'marketing_emails':
                return communications.marketingEmails;
            case 'security_alerts':
                return communications.securityAlerts;
            case 'medical_reminders':
                return communications.medicalReminders;
            case 'third_party_marketing':
                return communications.thirdPartyMarketing;
            default:
                return false;
        }
    }

    /**
     * Check if communication type is essential
     */
    private isEssentialCommunication(type: CommunicationType): boolean {
        return type === 'security_alerts' || type === 'medical_reminders';
    }

    /**
     * Check if essential communication can be sent
     */
    private canSendEssentialCommunication(
        type: 'security_alerts' | 'medical_reminders',
        communications: CommunicationPreferences
    ): boolean {
        // Essential communications should always be enabled and cannot be disabled
        switch (type) {
            case 'security_alerts':
                return communications.securityAlerts; // Should always be true
            case 'medical_reminders':
                return communications.medicalReminders; // Should always be true
            default:
                return false;
        }
    }

    /**
     * Send communication (mock implementation)
     */
    private async sendCommunication(
        userId: string,
        type: CommunicationType,
        message: string,
        priority: 'high' | 'critical' = 'high'
    ): Promise<void> {
        // Mock implementation - in real app this would integrate with email/SMS services
        console.log(`Sending ${type} to user ${userId}: ${message} (Priority: ${priority})`);

        // Simulate sending delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Update marketing systems (mock implementation)
     */
    private async updateMarketingSystems(userId: string, optedIn: boolean): Promise<void> {
        // Mock implementation - in real app this would:
        // 1. Update email marketing platform (e.g., Mailchimp, SendGrid)
        // 2. Update CRM system
        // 3. Update third-party marketing partners
        // 4. Update internal marketing database

        console.log(`Updated marketing systems for user ${userId}: ${optedIn ? 'opted in' : 'opted out'}`);

        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    /**
     * Propagate preference changes to all systems
     */
    private async propagatePreferenceChanges(
        userId: string,
        updates: Partial<CommunicationPreferences>
    ): Promise<void> {
        // Mock implementation - in real app this would update:
        // 1. Email service providers
        // 2. SMS gateways
        // 3. Push notification services
        // 4. Third-party integrations
        // 5. Internal notification systems

        const updatePromises: Promise<void>[] = [];

        // Update email systems
        if ('emailNotifications' in updates || 'marketingEmails' in updates) {
            updatePromises.push(this.updateEmailSystems(userId, updates));
        }

        // Update SMS systems
        if ('smsNotifications' in updates) {
            updatePromises.push(this.updateSMSSystems(userId, updates));
        }

        // Update third-party systems
        if ('thirdPartyMarketing' in updates) {
            updatePromises.push(this.updateThirdPartySystems(userId, updates));
        }

        // Wait for all updates to complete (within 24 hours as per requirements)
        await Promise.all(updatePromises);

        console.log(`Propagated communication preference changes for user ${userId}`);
    }

    /**
     * Update email systems
     */
    private async updateEmailSystems(
        userId: string,
        updates: Partial<CommunicationPreferences>
    ): Promise<void> {
        console.log(`Updating email systems for user ${userId}`, updates);
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    /**
     * Update SMS systems
     */
    private async updateSMSSystems(
        userId: string,
        updates: Partial<CommunicationPreferences>
    ): Promise<void> {
        console.log(`Updating SMS systems for user ${userId}`, updates);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Update third-party systems
     */
    private async updateThirdPartySystems(
        userId: string,
        updates: Partial<CommunicationPreferences>
    ): Promise<void> {
        console.log(`Updating third-party systems for user ${userId}`, updates);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    /**
     * Validate communication preferences
     */
    validateCommunicationPreferences(preferences: Partial<CommunicationPreferences>): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Essential communications cannot be disabled
        if (preferences.securityAlerts === false) {
            errors.push('Security alerts cannot be disabled');
        }

        if (preferences.medicalReminders === false) {
            errors.push('Medical reminders cannot be disabled');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export singleton instance
export const communicationService = CommunicationService.getInstance();