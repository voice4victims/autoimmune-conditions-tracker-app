/**
 * OWASP A02:2025 - Security Misconfiguration Mitigations
 * 
 * This module addresses security misconfiguration risks by implementing
 * secure defaults, configuration validation, and security hardening measures.
 * 
 * Key Security Controls:
 * - Secure default configurations
 * - Debug information removal in production
 * - Security headers configuration
 * - CORS policy enforcement
 * - Environment-specific security settings
 * - Automated security configuration validation
 */

import { auditService } from '../auditService';

export interface SecurityConfiguration {
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    corsOrigins: string[];
    securityHeaders: SecurityHeaders;
    sessionConfig: SessionConfiguration;
    encryptionConfig: EncryptionConfiguration;
    auditConfig: AuditConfiguration;
}

export interface SecurityHeaders {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy: string;
}

export interface SessionConfiguration {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    domain?: string;
}

export interface EncryptionConfiguration {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
    iterations: number;
}

export interface AuditConfiguration {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    retentionDays: number;
    enableRealTimeAlerts: boolean;
    sensitiveDataMasking: boolean;
}

export interface SecurityValidationResult {
    isValid: boolean;
    issues: SecurityIssue[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityIssue {
    category: 'configuration' | 'headers' | 'cors' | 'encryption' | 'session' | 'debug';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    cwe?: string; // Common Weakness Enumeration ID
}

/**
 * Security Configuration Service
 * 
 * Manages security configurations and validates them against best practices
 * to prevent security misconfigurations.
 */
export class SecurityConfigurationService {
    private static instance: SecurityConfigurationService;
    private currentConfig: SecurityConfiguration;

    public static getInstance(): SecurityConfigurationService {
        if (!SecurityConfigurationService.instance) {
            SecurityConfigurationService.instance = new SecurityConfigurationService();
        }
        return SecurityConfigurationService.instance;
    }

    constructor() {
        this.currentConfig = this.getSecureDefaultConfiguration();
        this.initializeSecurityConfiguration();
    }

    /**
     * Get secure default configuration based on environment
     */
    private getSecureDefaultConfiguration(): SecurityConfiguration {
        const environment = this.detectEnvironment();
        const isProduction = environment === 'production';

        return {
            environment,
            debugMode: !isProduction,
            corsOrigins: this.getSecureCorsOrigins(environment),
            securityHeaders: this.getSecureHeaders(environment),
            sessionConfig: this.getSecureSessionConfig(environment),
            encryptionConfig: this.getSecureEncryptionConfig(),
            auditConfig: this.getSecureAuditConfig(environment)
        };
    }

    /**
     * Detect current environment
     */
    private detectEnvironment(): 'development' | 'staging' | 'production' {
        // Check various environment indicators
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;

            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
                return 'development';
            }

            if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            }
        }

        // Check environment variables
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'development') return 'development';
        if (nodeEnv === 'staging') return 'staging';
        if (nodeEnv === 'production') return 'production';

        // Default to production for security (fail secure)
        return 'production';
    }

    /**
     * Get secure CORS origins based on environment
     */
    private getSecureCorsOrigins(environment: string): string[] {
        switch (environment) {
            case 'development':
                return [
                    'http://localhost:3000',
                    'http://localhost:8080',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:8080'
                ];

            case 'staging':
                return [
                    'https://staging.pandastracker.com',
                    'https://test.pandastracker.com'
                ];

            case 'production':
                return [
                    'https://pandastracker.com',
                    'https://www.pandastracker.com'
                ];

            default:
                return []; // Deny all origins by default
        }
    }

    /**
     * Get secure HTTP headers configuration
     */
    private getSecureHeaders(environment: string): SecurityHeaders {
        const isProduction = environment === 'production';

        return {
            contentSecurityPolicy: this.buildCSP(environment),
            strictTransportSecurity: isProduction
                ? 'max-age=31536000; includeSubDomains; preload'
                : 'max-age=3600',
            xFrameOptions: 'DENY',
            xContentTypeOptions: 'nosniff',
            referrerPolicy: 'strict-origin-when-cross-origin',
            permissionsPolicy: this.buildPermissionsPolicy()
        };
    }

    /**
     * Build Content Security Policy
     */
    private buildCSP(environment: string): string {
        const isProduction = environment === 'production';

        const cspDirectives = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'", // Required for React in development
                ...(isProduction ? [] : ["'unsafe-eval'"]), // Only allow eval in development
                'https://apis.google.com',
                'https://www.gstatic.com'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'", // Required for styled-components
                'https://fonts.googleapis.com'
            ],
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com'
            ],
            'img-src': [
                "'self'",
                'data:',
                'blob:',
                'https:'
            ],
            'connect-src': [
                "'self'",
                'https://api.ipify.org', // For IP detection
                'https://*.firebaseio.com',
                'https://*.googleapis.com',
                'https://*.google.com'
            ],
            'frame-src': ["'none'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': isProduction ? [] : undefined
        };

        return Object.entries(cspDirectives)
            .filter(([_, value]) => value !== undefined)
            .map(([directive, sources]) =>
                Array.isArray(sources) && sources.length > 0
                    ? `${directive} ${sources.join(' ')}`
                    : directive
            )
            .join('; ');
    }

    /**
     * Build Permissions Policy
     */
    private buildPermissionsPolicy(): string {
        const permissions = {
            'camera': '()',
            'microphone': '()',
            'geolocation': '()',
            'payment': '()',
            'usb': '()',
            'magnetometer': '()',
            'gyroscope': '()',
            'accelerometer': '()',
            'ambient-light-sensor': '()',
            'autoplay': '()',
            'encrypted-media': '()',
            'fullscreen': '(self)',
            'picture-in-picture': '()'
        };

        return Object.entries(permissions)
            .map(([permission, allowlist]) => `${permission}=${allowlist}`)
            .join(', ');
    }

    /**
     * Get secure session configuration
     */
    private getSecureSessionConfig(environment: string): SessionConfiguration {
        const isProduction = environment === 'production';

        return {
            secure: isProduction, // HTTPS only in production
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes (HIPAA compliance)
            domain: isProduction ? '.pandastracker.com' : undefined
        };
    }

    /**
     * Get secure encryption configuration
     */
    private getSecureEncryptionConfig(): EncryptionConfiguration {
        return {
            algorithm: 'AES-GCM',
            keyLength: 256,
            ivLength: 12,
            saltLength: 32,
            iterations: 100000 // PBKDF2 iterations
        };
    }

    /**
     * Get secure audit configuration
     */
    private getSecureAuditConfig(environment: string): AuditConfiguration {
        return {
            logLevel: environment === 'production' ? 'warn' : 'info',
            retentionDays: 2555, // 7 years for HIPAA compliance
            enableRealTimeAlerts: environment === 'production',
            sensitiveDataMasking: true
        };
    }

    /**
     * Initialize security configuration
     */
    private initializeSecurityConfiguration(): void {
        try {
            // Apply security headers if running in browser
            if (typeof window !== 'undefined') {
                this.applyClientSideSecurityMeasures();
            }

            // Remove debug information in production
            if (this.currentConfig.environment === 'production') {
                this.removeDebugInformation();
            }

            // Validate configuration
            const validation = this.validateConfiguration();
            if (!validation.isValid) {
                console.warn('Security configuration issues detected:', validation.issues);
            }

            // Log security configuration initialization
            this.logSecurityEvent('security_config_initialized', 'Security configuration initialized successfully');

        } catch (error) {
            console.error('Failed to initialize security configuration:', error);
            this.logSecurityEvent('security_config_error', `Failed to initialize security configuration: ${error}`);
        }
    }

    /**
     * Apply client-side security measures
     */
    private applyClientSideSecurityMeasures(): void {
        // Disable right-click context menu in production
        if (this.currentConfig.environment === 'production') {
            document.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        // Disable F12 and other developer shortcuts in production
        if (this.currentConfig.environment === 'production') {
            document.addEventListener('keydown', (e) => {
                // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
                if (e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    return false;
                }
            });
        }

        // Clear console in production
        if (this.currentConfig.environment === 'production') {
            setInterval(() => {
                console.clear();
            }, 1000);
        }

        // Add security-focused meta tags
        this.addSecurityMetaTags();
    }

    /**
     * Add security-focused meta tags
     */
    private addSecurityMetaTags(): void {
        const metaTags = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            { name: 'format-detection', content: 'telephone=no' },
            { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
            { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
            { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
        ];

        metaTags.forEach(tag => {
            const existingTag = document.querySelector(`meta[name="${tag.name}"], meta[http-equiv="${tag['http-equiv']}"]`);
            if (!existingTag) {
                const metaElement = document.createElement('meta');
                if (tag.name) metaElement.setAttribute('name', tag.name);
                if (tag['http-equiv']) metaElement.setAttribute('http-equiv', tag['http-equiv']);
                metaElement.setAttribute('content', tag.content);
                document.head.appendChild(metaElement);
            }
        });
    }

    /**
     * Remove debug information in production
     */
    private removeDebugInformation(): void {
        // Override console methods in production
        const noop = () => { };
        console.log = noop;
        console.debug = noop;
        console.info = noop;
        console.warn = noop;
        // Keep console.error for critical issues

        // Remove data attributes that might leak information
        document.querySelectorAll('[data-testid], [data-cy], [data-test]').forEach(element => {
            element.removeAttribute('data-testid');
            element.removeAttribute('data-cy');
            element.removeAttribute('data-test');
        });

        // Remove development-specific classes
        document.querySelectorAll('.dev-only, .debug-info').forEach(element => {
            element.remove();
        });
    }

    /**
     * Validate security configuration
     */
    public validateConfiguration(): SecurityValidationResult {
        const issues: SecurityIssue[] = [];
        const recommendations: string[] = [];

        // Check environment-specific configurations
        if (this.currentConfig.environment === 'production') {
            if (this.currentConfig.debugMode) {
                issues.push({
                    category: 'debug',
                    severity: 'high',
                    description: 'Debug mode is enabled in production',
                    recommendation: 'Disable debug mode in production environment',
                    cwe: 'CWE-489'
                });
            }

            if (!this.currentConfig.sessionConfig.secure) {
                issues.push({
                    category: 'session',
                    severity: 'high',
                    description: 'Session cookies are not marked as secure in production',
                    recommendation: 'Enable secure flag for session cookies in production',
                    cwe: 'CWE-614'
                });
            }
        }

        // Check CORS configuration
        if (this.currentConfig.corsOrigins.includes('*')) {
            issues.push({
                category: 'cors',
                severity: 'critical',
                description: 'CORS is configured to allow all origins',
                recommendation: 'Restrict CORS to specific trusted origins only',
                cwe: 'CWE-346'
            });
        }

        // Check encryption configuration
        if (this.currentConfig.encryptionConfig.keyLength < 256) {
            issues.push({
                category: 'encryption',
                severity: 'medium',
                description: 'Encryption key length is less than 256 bits',
                recommendation: 'Use at least 256-bit encryption keys',
                cwe: 'CWE-326'
            });
        }

        // Check session timeout
        if (this.currentConfig.sessionConfig.maxAge > 15 * 60 * 1000) {
            issues.push({
                category: 'session',
                severity: 'medium',
                description: 'Session timeout exceeds HIPAA compliance requirement (15 minutes)',
                recommendation: 'Set session timeout to 15 minutes or less for HIPAA compliance',
                cwe: 'CWE-613'
            });
        }

        // Generate recommendations
        if (issues.length === 0) {
            recommendations.push('Security configuration appears to be properly configured');
        } else {
            recommendations.push('Review and address the identified security configuration issues');
            recommendations.push('Implement automated security configuration validation in CI/CD pipeline');
            recommendations.push('Regularly audit security configurations for compliance');
        }

        // Determine risk level
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highIssues = issues.filter(i => i.severity === 'high').length;
        const mediumIssues = issues.filter(i => i.severity === 'medium').length;

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (criticalIssues > 0) riskLevel = 'critical';
        else if (highIssues > 0) riskLevel = 'high';
        else if (mediumIssues > 0) riskLevel = 'medium';

        return {
            isValid: issues.length === 0,
            issues,
            recommendations,
            riskLevel
        };
    }

    /**
     * Get current security configuration
     */
    public getCurrentConfiguration(): SecurityConfiguration {
        return { ...this.currentConfig };
    }

    /**
     * Update security configuration
     */
    public updateConfiguration(updates: Partial<SecurityConfiguration>): void {
        this.currentConfig = { ...this.currentConfig, ...updates };

        // Re-validate after update
        const validation = this.validateConfiguration();
        if (!validation.isValid) {
            console.warn('Security configuration validation failed after update:', validation.issues);
        }

        this.logSecurityEvent('security_config_updated', 'Security configuration updated');
    }

    /**
     * Generate security configuration report
     */
    public generateSecurityReport(): {
        configuration: SecurityConfiguration;
        validation: SecurityValidationResult;
        timestamp: Date;
        environment: string;
    } {
        return {
            configuration: this.getCurrentConfiguration(),
            validation: this.validateConfiguration(),
            timestamp: new Date(),
            environment: this.currentConfig.environment
        };
    }

    /**
     * Log security events
     */
    private async logSecurityEvent(event: string, details: string): Promise<void> {
        try {
            await auditService.logPrivacyAction('system', 'view_data', {
                resourceType: 'security_configuration',
                resourceId: event,
                details: `Security Configuration: ${details}`
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    /**
     * Automated security configuration validation (for CI/CD)
     */
    public static validateForCICD(): boolean {
        const service = SecurityConfigurationService.getInstance();
        const validation = service.validateConfiguration();

        if (!validation.isValid) {
            console.error('Security configuration validation failed:');
            validation.issues.forEach(issue => {
                console.error(`[${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
                console.error(`  Recommendation: ${issue.recommendation}`);
                if (issue.cwe) console.error(`  CWE: ${issue.cwe}`);
            });

            // Fail CI/CD pipeline if critical or high severity issues exist
            const criticalOrHighIssues = validation.issues.filter(
                i => i.severity === 'critical' || i.severity === 'high'
            );

            return criticalOrHighIssues.length === 0;
        }

        console.log('Security configuration validation passed');
        return true;
    }
}

// Export singleton instance
export const securityConfigurationService = SecurityConfigurationService.getInstance();

// Export validation function for CI/CD
export const validateSecurityConfiguration = SecurityConfigurationService.validateForCICD;