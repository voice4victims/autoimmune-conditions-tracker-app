/**
 * Privacy Settings Infrastructure Validation
 * 
 * This module provides validation functions to ensure the privacy settings
 * infrastructure is properly configured and working.
 */

import { privacyService, auditService, PrivacyUtils } from './index';
import { PRIVACY_SETTINGS_VERSION, DEFAULT_RETENTION_PERIOD } from '../../types/privacy';

export interface ValidationResult {
    success: boolean;
    message: string;
    details?: any;
}

export class PrivacyInfrastructureValidator {
    /**
     * Validate that all privacy services are properly instantiated
     */
    static validateServices(): ValidationResult {
        try {
            // Check privacy service
            if (!privacyService) {
                return {
                    success: false,
                    message: 'Privacy service is not available'
                };
            }

            // Check audit service
            if (!auditService) {
                return {
                    success: false,
                    message: 'Audit service is not available'
                };
            }

            // Check utility functions
            if (!PrivacyUtils) {
                return {
                    success: false,
                    message: 'Privacy utilities are not available'
                };
            }

            return {
                success: true,
                message: 'All privacy services are properly instantiated'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error validating privacy services',
                details: error
            };
        }
    }

    /**
     * Validate privacy settings constants
     */
    static validateConstants(): ValidationResult {
        try {
            if (typeof PRIVACY_SETTINGS_VERSION !== 'number' || PRIVACY_SETTINGS_VERSION < 1) {
                return {
                    success: false,
                    message: 'Invalid privacy settings version'
                };
            }

            if (typeof DEFAULT_RETENTION_PERIOD !== 'number' || DEFAULT_RETENTION_PERIOD < 12) {
                return {
                    success: false,
                    message: 'Invalid default retention period (must be at least 12 months for medical data)'
                };
            }

            return {
                success: true,
                message: 'All privacy constants are valid',
                details: {
                    version: PRIVACY_SETTINGS_VERSION,
                    retentionPeriod: DEFAULT_RETENTION_PERIOD
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error validating privacy constants',
                details: error
            };
        }
    }

    /**
     * Validate utility functions
     */
    static validateUtilities(): ValidationResult {
        try {
            // Test permission checking
            const hasPermission = PrivacyUtils.hasPermission(['view_symptoms'], 'view_symptoms');
            if (!hasPermission) {
                return {
                    success: false,
                    message: 'Permission checking utility is not working correctly'
                };
            }

            // Test role permissions
            const parentPermissions = PrivacyUtils.getPermissionsForRole('parent');
            if (!Array.isArray(parentPermissions) || parentPermissions.length === 0) {
                return {
                    success: false,
                    message: 'Role permission utility is not working correctly'
                };
            }

            // Test consent requirement checking
            const consentRequired = PrivacyUtils.isConsentRequired('export_data');
            if (!consentRequired) {
                return {
                    success: false,
                    message: 'Consent requirement checking is not working correctly'
                };
            }

            return {
                success: true,
                message: 'All privacy utilities are working correctly'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error validating privacy utilities',
                details: error
            };
        }
    }

    /**
     * Run all validation checks
     */
    static async runAllValidations(): Promise<ValidationResult[]> {
        const results: ValidationResult[] = [];

        results.push(this.validateServices());
        results.push(this.validateConstants());
        results.push(this.validateUtilities());

        return results;
    }

    /**
     * Generate a validation report
     */
    static async generateValidationReport(): Promise<{
        overall: boolean;
        results: ValidationResult[];
        summary: string;
    }> {
        const results = await this.runAllValidations();
        const overall = results.every(result => result.success);

        const passedCount = results.filter(result => result.success).length;
        const totalCount = results.length;

        const summary = overall
            ? `All ${totalCount} validation checks passed successfully`
            : `${passedCount}/${totalCount} validation checks passed`;

        return {
            overall,
            results,
            summary
        };
    }
}

// Export validation function for easy use
export const validatePrivacyInfrastructure = PrivacyInfrastructureValidator.generateValidationReport;