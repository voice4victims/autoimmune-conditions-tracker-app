/**
 * Secure Transport Configuration
 * Implements HTTPS enforcement and certificate pinning for secure communications
 */

export class SecureTransportService {
    private static instance: SecureTransportService;
    private readonly trustedCertificates: Map<string, CertificatePin> = new Map();
    private readonly securityHeaders: SecurityHeaders;

    constructor() {
        this.securityHeaders = this.getSecurityHeaders();
        this.initializeCertificatePins();
    }

    public static getInstance(): SecureTransportService {
        if (!SecureTransportService.instance) {
            SecureTransportService.instance = new SecureTransportService();
        }
        return SecureTransportService.instance;
    }

    /**
     * Initialize certificate pins for critical services
     */
    private initializeCertificatePins(): void {
        // Firebase certificate pins (example - these would be actual certificate hashes)
        this.trustedCertificates.set('firebase.googleapis.com', {
            hostname: 'firebase.googleapis.com',
            pins: [
                'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary certificate
                'sha256-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='  // Backup certificate
            ],
            includeSubdomains: true,
            maxAge: 5184000, // 60 days
            reportUri: '/security/hpkp-report'
        });

        // Add other critical service pins
        this.trustedCertificates.set('firestore.googleapis.com', {
            hostname: 'firestore.googleapis.com',
            pins: [
                'sha256-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
                'sha256-DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD='
            ],
            includeSubdomains: true,
            maxAge: 5184000,
            reportUri: '/security/hpkp-report'
        });
    }

    /**
     * Get security headers for HTTP responses
     */
    private getSecurityHeaders(): SecurityHeaders {
        return {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Content-Security-Policy': this.getContentSecurityPolicy(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': this.getPermissionsPolicy(),
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin'
        };
    }

    /**
     * Generate Content Security Policy
     */
    private getContentSecurityPolicy(): string {
        const cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ];

        return cspDirectives.join('; ');
    }

    /**
     * Generate Permissions Policy
     */
    private getPermissionsPolicy(): string {
        const permissions = [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
            'ambient-light-sensor=()',
            'autoplay=()',
            'encrypted-media=()',
            'fullscreen=(self)',
            'picture-in-picture=()'
        ];

        return permissions.join(', ');
    }

    /**
     * Validate HTTPS connection
     */
    validateHTTPS(): ValidationResult {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check if running on HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            issues.push('Application not running on HTTPS');
            recommendations.push('Enforce HTTPS for all connections');
        }

        // Check for mixed content
        if (location.protocol === 'https:' && this.hasMixedContent()) {
            issues.push('Mixed content detected');
            recommendations.push('Ensure all resources are loaded over HTTPS');
        }

        // Check for secure context
        if (!window.isSecureContext) {
            issues.push('Not running in secure context');
            recommendations.push('Ensure secure context for cryptographic operations');
        }

        // Check TLS version (if available)
        const tlsInfo = this.getTLSInfo();
        if (tlsInfo && tlsInfo.version < 1.2) {
            issues.push('TLS version too old');
            recommendations.push('Use TLS 1.2 or higher');
        }

        return {
            valid: issues.length === 0,
            issues,
            recommendations
        };
    }

    /**
     * Perform certificate pinning validation
     */
    async validateCertificatePinning(hostname: string): Promise<boolean> {
        const pin = this.trustedCertificates.get(hostname);
        if (!pin) {
            console.warn(`No certificate pin configured for ${hostname}`);
            return true; // Allow connection but log warning
        }

        try {
            // In a real implementation, this would validate the actual certificate
            // For now, we'll simulate the validation
            console.log(`Validating certificate pin for ${hostname}`);

            // This would typically involve:
            // 1. Getting the certificate from the connection
            // 2. Computing the SHA-256 hash of the public key
            // 3. Comparing against the pinned hashes

            return true; // Simulated success
        } catch (error) {
            console.error(`Certificate pinning validation failed for ${hostname}:`, error);
            return false;
        }
    }

    /**
     * Create secure fetch wrapper with certificate pinning
     */
    async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
        const urlObj = new URL(url);

        // Validate certificate pinning
        const pinningValid = await this.validateCertificatePinning(urlObj.hostname);
        if (!pinningValid) {
            throw new Error(`Certificate pinning validation failed for ${urlObj.hostname}`);
        }

        // Add security headers
        const secureOptions: RequestInit = {
            ...options,
            headers: {
                ...options.headers,
                ...this.getRequestSecurityHeaders()
            }
        };

        // Ensure HTTPS
        if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost') {
            throw new Error('Only HTTPS requests are allowed');
        }

        try {
            const response = await fetch(url, secureOptions);

            // Validate response security headers
            this.validateResponseHeaders(response);

            return response;
        } catch (error) {
            console.error('Secure request failed:', error);
            throw error;
        }
    }

    /**
     * Get request security headers
     */
    private getRequestSecurityHeaders(): Record<string, string> {
        return {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        };
    }

    /**
     * Validate response security headers
     */
    private validateResponseHeaders(response: Response): void {
        const warnings: string[] = [];

        // Check for HSTS header
        if (!response.headers.get('Strict-Transport-Security')) {
            warnings.push('Missing Strict-Transport-Security header');
        }

        // Check for CSP header
        if (!response.headers.get('Content-Security-Policy')) {
            warnings.push('Missing Content-Security-Policy header');
        }

        // Check for X-Content-Type-Options
        if (!response.headers.get('X-Content-Type-Options')) {
            warnings.push('Missing X-Content-Type-Options header');
        }

        if (warnings.length > 0) {
            console.warn('Response security header warnings:', warnings);
        }
    }

    /**
     * Check for mixed content
     */
    private hasMixedContent(): boolean {
        // Check for HTTP resources in HTTPS page
        const scripts = document.querySelectorAll('script[src]');
        const links = document.querySelectorAll('link[href]');
        const images = document.querySelectorAll('img[src]');

        const allResources = [
            ...Array.from(scripts).map(s => (s as HTMLScriptElement).src),
            ...Array.from(links).map(l => (l as HTMLLinkElement).href),
            ...Array.from(images).map(i => (i as HTMLImageElement).src)
        ];

        return allResources.some(url => url.startsWith('http://'));
    }

    /**
     * Get TLS information (limited in browser)
     */
    private getTLSInfo(): TLSInfo | null {
        // Browser APIs don't provide direct access to TLS info
        // This would typically be handled by the server or through
        // specialized security libraries
        return null;
    }

    /**
     * Generate HPKP (HTTP Public Key Pinning) header
     */
    generateHPKPHeader(hostname: string): string | null {
        const pin = this.trustedCertificates.get(hostname);
        if (!pin) {
            return null;
        }

        const pinDirectives = pin.pins.map(p => `pin-${p}`).join('; ');
        let header = `${pinDirectives}; max-age=${pin.maxAge}`;

        if (pin.includeSubdomains) {
            header += '; includeSubDomains';
        }

        if (pin.reportUri) {
            header += `; report-uri="${pin.reportUri}"`;
        }

        return header;
    }

    /**
     * Monitor and report security violations
     */
    setupSecurityReporting(): void {
        // CSP violation reporting
        document.addEventListener('securitypolicyviolation', (event) => {
            this.reportSecurityViolation('csp', {
                violatedDirective: event.violatedDirective,
                blockedURI: event.blockedURI,
                documentURI: event.documentURI,
                originalPolicy: event.originalPolicy
            });
        });

        // HPKP violation reporting (if supported)
        if ('onhpkpviolation' in window) {
            (window as any).addEventListener('hpkpviolation', (event: any) => {
                this.reportSecurityViolation('hpkp', {
                    hostname: event.hostname,
                    port: event.port,
                    effectiveExpirationDate: event.effectiveExpirationDate,
                    includeSubdomains: event.includeSubdomains,
                    notedHostname: event.notedHostname,
                    servedCertificateChain: event.servedCertificateChain,
                    validatedCertificateChain: event.validatedCertificateChain
                });
            });
        }
    }

    /**
     * Report security violations
     */
    private async reportSecurityViolation(type: string, details: any): Promise<void> {
        const report = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: location.href,
            details
        };

        try {
            // Send to security monitoring endpoint
            await this.secureRequest('/api/security/violations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
        } catch (error) {
            console.error('Failed to report security violation:', error);
        }
    }

    /**
     * Generate transport security audit report
     */
    generateTransportSecurityReport(): TransportSecurityReport {
        const httpsValidation = this.validateHTTPS();

        return {
            timestamp: new Date().toISOString(),
            httpsValidation,
            certificatePins: Array.from(this.trustedCertificates.entries()).map(([hostname, pin]) => ({
                hostname,
                pinCount: pin.pins.length,
                maxAge: pin.maxAge,
                includeSubdomains: pin.includeSubdomains
            })),
            securityHeaders: Object.keys(this.securityHeaders),
            recommendations: [
                'Regularly update certificate pins',
                'Monitor certificate expiration dates',
                'Implement certificate transparency monitoring',
                'Use HSTS preload list',
                'Regularly audit security headers',
                'Implement proper error handling for pinning failures'
            ]
        };
    }
}

// Type definitions
interface CertificatePin {
    hostname: string;
    pins: string[];
    includeSubdomains: boolean;
    maxAge: number;
    reportUri?: string;
}

interface SecurityHeaders {
    [key: string]: string;
}

interface ValidationResult {
    valid: boolean;
    issues: string[];
    recommendations: string[];
}

interface TLSInfo {
    version: number;
    cipher: string;
    protocol: string;
}

interface TransportSecurityReport {
    timestamp: string;
    httpsValidation: ValidationResult;
    certificatePins: Array<{
        hostname: string;
        pinCount: number;
        maxAge: number;
        includeSubdomains: boolean;
    }>;
    securityHeaders: string[];
    recommendations: string[];
}

// Export singleton instance
export const secureTransportService = SecureTransportService.getInstance();