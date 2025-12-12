#!/usr/bin/env node

/**
 * Security Configuration Validation Script
 * Addresses OWASP A02:2025 - Security Misconfiguration
 * 
 * This script validates security configurations and removes debug information
 * from production builds to prevent information disclosure.
 */

const fs = require('fs');
const path = require('path');

class SecurityConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Main validation function
     */
    async validate() {
        console.log('🔒 Starting Security Configuration Validation...');
        console.log(`Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

        // Remove debug information from production builds
        this.removeDebugInformation();

        // Validate Firebase configuration
        this.validateFirebaseConfig();

        // Validate Vite configuration
        this.validateViteConfig();

        // Validate environment variables
        this.validateEnvironmentVariables();

        // Check for default accounts and services
        this.checkDefaultAccounts();

        // Validate CORS and security headers
        this.validateSecurityHeaders();

        // Report results
        this.reportResults();

        return this.errors.length === 0;
    }

    /**
     * Remove debug information and console logs from production builds
     */
    removeDebugInformation() {
        console.log('🧹 Removing debug information...');

        if (!this.isProduction) {
            this.warnings.push('Debug information removal skipped in development mode');
            return;
        }

        // Find all TypeScript and JavaScript files
        const sourceFiles = this.findSourceFiles(['src', 'lib']);

        sourceFiles.forEach(filePath => {
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                let modified = false;

                // Remove console.log statements (but keep console.error and console.warn)
                const originalContent = content;
                content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
                content = content.replace(/console\.debug\([^)]*\);?\s*/g, '');
                content = content.replace(/console\.info\([^)]*\);?\s*/g, '');

                // Remove TODO and FIXME comments
                content = content.replace(/\/\*\s*(TODO|FIXME|DEBUG)[\s\S]*?\*\//g, '');
                content = content.replace(/\/\/\s*(TODO|FIXME|DEBUG).*$/gm, '');

                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content);
                    modified = true;
                }

                if (modified) {
                    console.log(`  ✓ Cleaned debug information from ${filePath}`);
                }
            } catch (error) {
                this.errors.push(`Failed to clean debug information from ${filePath}: ${error.message}`);
            }
        });
    }

    /**
     * Validate Firebase configuration
     */
    validateFirebaseConfig() {
        console.log('🔥 Validating Firebase configuration...');

        try {
            const firebaseConfigPath = path.join(process.cwd(), 'src', 'lib', 'firebase.ts');

            if (!fs.existsSync(firebaseConfigPath)) {
                this.errors.push('Firebase configuration file not found');
                return;
            }

            const content = fs.readFileSync(firebaseConfigPath, 'utf8');

            // Check for hardcoded API keys (should use environment variables)
            if (content.includes('apiKey:') && content.includes('"') && !content.includes('import.meta.env')) {
                this.errors.push('Firebase API key appears to be hardcoded. Use environment variables.');
            }

            // Check for proper security rules reference
            if (!content.includes('auth') || !content.includes('firestore')) {
                this.warnings.push('Ensure Firebase Auth and Firestore are properly configured');
            }

            // Validate that sensitive configuration is not exposed
            if (content.includes('measurementId') && this.isProduction) {
                this.warnings.push('Consider removing Analytics measurement ID in production if not needed');
            }

            console.log('  ✓ Firebase configuration validated');

        } catch (error) {
            this.errors.push(`Firebase configuration validation failed: ${error.message}`);
        }
    }

    /**
     * Validate Vite configuration
     */
    validateViteConfig() {
        console.log('⚡ Validating Vite configuration...');

        try {
            const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');

            if (!fs.existsSync(viteConfigPath)) {
                this.warnings.push('Vite configuration file not found');
                return;
            }

            const content = fs.readFileSync(viteConfigPath, 'utf8');

            // Check for proper HTTPS configuration in production
            if (this.isProduction && !content.includes('https:')) {
                this.warnings.push('Consider enabling HTTPS in production Vite configuration');
            }

            // Check for source map configuration
            if (this.isProduction && content.includes('sourcemap: true')) {
                this.warnings.push('Source maps should be disabled in production for security');
            }

            // Check for proper build optimization
            if (!content.includes('minify') && this.isProduction) {
                this.warnings.push('Ensure minification is enabled for production builds');
            }

            console.log('  ✓ Vite configuration validated');

        } catch (error) {
            this.errors.push(`Vite configuration validation failed: ${error.message}`);
        }
    }

    /**
     * Validate environment variables
     */
    validateEnvironmentVariables() {
        console.log('🌍 Validating environment variables...');

        const requiredEnvVars = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_AUTH_DOMAIN',
            'VITE_FIREBASE_PROJECT_ID'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            this.errors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Check for default or example values
        const dangerousValues = ['your-api-key', 'example.com', 'test-project'];

        requiredEnvVars.forEach(varName => {
            const value = process.env[varName];
            if (value && dangerousValues.some(dangerous => value.includes(dangerous))) {
                this.errors.push(`Environment variable ${varName} appears to contain default/example value`);
            }
        });

        console.log('  ✓ Environment variables validated');
    }

    /**
     * Check for default accounts and services
     */
    checkDefaultAccounts() {
        console.log('👤 Checking for default accounts...');

        // Check for default Firebase security rules
        const securityRulesPath = path.join(process.cwd(), 'firestore.rules');

        if (fs.existsSync(securityRulesPath)) {
            const rules = fs.readFileSync(securityRulesPath, 'utf8');

            if (rules.includes('allow read, write: if true')) {
                this.errors.push('Default Firebase security rules detected - all access allowed');
            }

            if (!rules.includes('request.auth')) {
                this.warnings.push('Firebase security rules may not properly check authentication');
            }
        } else {
            this.warnings.push('Firebase security rules file not found');
        }

        console.log('  ✓ Default accounts check completed');
    }

    /**
     * Validate security headers and CORS configuration
     */
    validateSecurityHeaders() {
        console.log('🛡️ Validating security headers...');

        // Check for security headers in public folder
        const headersFile = path.join(process.cwd(), 'public', '_headers');

        if (fs.existsSync(headersFile)) {
            const headers = fs.readFileSync(headersFile, 'utf8');

            const requiredHeaders = [
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Referrer-Policy',
                'Content-Security-Policy'
            ];

            const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

            if (missingHeaders.length > 0) {
                this.warnings.push(`Missing security headers: ${missingHeaders.join(', ')}`);
            }

            // Check for overly permissive CORS
            if (headers.includes('Access-Control-Allow-Origin: *')) {
                this.warnings.push('CORS configuration allows all origins - consider restricting');
            }

        } else {
            this.warnings.push('Security headers file (_headers) not found in public folder');
        }

        console.log('  ✓ Security headers validated');
    }

    /**
     * Find source files recursively
     */
    findSourceFiles(directories) {
        const files = [];

        directories.forEach(dir => {
            const fullPath = path.join(process.cwd(), dir);

            if (fs.existsSync(fullPath)) {
                this.walkDirectory(fullPath, files);
            }
        });

        return files.filter(file => /\.(ts|tsx|js|jsx)$/.test(file));
    }

    /**
     * Walk directory recursively
     */
    walkDirectory(dir, files) {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                this.walkDirectory(fullPath, files);
            } else if (stat.isFile()) {
                files.push(fullPath);
            }
        });
    }

    /**
     * Report validation results
     */
    reportResults() {
        console.log('\n📊 Security Configuration Validation Results:');

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All security configurations are valid!');
            return;
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS (must be fixed):');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS (should be addressed):');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        console.log(`\nSummary: ${this.errors.length} errors, ${this.warnings.length} warnings`);

        if (this.errors.length > 0) {
            console.log('\n🚨 Security validation failed. Please fix the errors above.');
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new SecurityConfigValidator();
    validator.validate().catch(error => {
        console.error('Security validation failed:', error);
        process.exit(1);
    });
}

module.exports = SecurityConfigValidator;