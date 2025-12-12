#!/usr/bin/env node

/**
 * PANDAS Autoimmune Tracker - Deployment Validation Script
 * 
 * This script performs comprehensive validation checks to ensure
 * the application is ready for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'error': '❌ ERROR',
            'warning': '⚠️  WARNING',
            'success': '✅ PASSED',
            'info': 'ℹ️  INFO'
        }[type];

        console.log(`[${timestamp}] ${prefix}: ${message}`);
    }

    addError(message) {
        this.errors.push(message);
        this.log(message, 'error');
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(message, 'warning');
    }

    addPassed(message) {
        this.passed.push(message);
        this.log(message, 'success');
    }

    checkFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.addPassed(`${description} exists: ${filePath}`);
            return true;
        } else {
            this.addError(`${description} missing: ${filePath}`);
            return false;
        }
    }

    checkPackageJson() {
        this.log('Validating package.json configuration...', 'info');

        if (!this.checkFileExists('package.json', 'Package configuration')) {
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

            // Check required scripts
            const requiredScripts = ['dev', 'build', 'preview', 'lint', 'test'];
            requiredScripts.forEach(script => {
                if (packageJson.scripts && packageJson.scripts[script]) {
                    this.addPassed(`Script '${script}' is configured`);
                } else {
                    this.addError(`Required script '${script}' is missing`);
                }
            });

            // Check critical dependencies
            const criticalDeps = [
                'react', 'react-dom', 'firebase', 'vite',
                '@radix-ui/react-dialog', 'tailwindcss', 'typescript'
            ];

            criticalDeps.forEach(dep => {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    this.addPassed(`Critical dependency '${dep}' is present`);
                } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
                    this.addPassed(`Critical dependency '${dep}' is present (dev)`);
                } else {
                    this.addError(`Critical dependency '${dep}' is missing`);
                }
            });

        } catch (error) {
            this.addError(`Failed to parse package.json: ${error.message}`);
        }
    }

    checkConfigurationFiles() {
        this.log('Validating configuration files...', 'info');

        const configFiles = [
            { path: 'vite.config.ts', description: 'Vite configuration' },
            { path: 'tsconfig.json', description: 'TypeScript configuration' },
            { path: 'tailwind.config.ts', description: 'Tailwind CSS configuration' },
            { path: 'eslint.config.js', description: 'ESLint configuration' },
            { path: 'postcss.config.js', description: 'PostCSS configuration' }
        ];

        configFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });
    }

    checkSourceStructure() {
        this.log('Validating source code structure...', 'info');

        const requiredDirs = [
            { path: 'src', description: 'Source directory' },
            { path: 'src/components', description: 'Components directory' },
            { path: 'src/contexts', description: 'Contexts directory' },
            { path: 'src/hooks', description: 'Hooks directory' },
            { path: 'src/lib', description: 'Library directory' },
            { path: 'src/types', description: 'Types directory' }
        ];

        requiredDirs.forEach(({ path: dirPath, description }) => {
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                this.addPassed(`${description} exists: ${dirPath}`);
            } else {
                this.addError(`${description} missing: ${dirPath}`);
            }
        });

        const requiredFiles = [
            { path: 'src/main.tsx', description: 'Main entry point' },
            { path: 'src/App.tsx', description: 'App component' },
            { path: 'src/index.css', description: 'Global styles' },
            { path: 'src/lib/firebase.ts', description: 'Firebase configuration' }
        ];

        requiredFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });
    }

    checkFirebaseConfiguration() {
        this.log('Validating Firebase configuration...', 'info');

        if (!this.checkFileExists('src/lib/firebase.ts', 'Firebase configuration')) {
            return;
        }

        try {
            const firebaseConfig = fs.readFileSync('src/lib/firebase.ts', 'utf8');

            // Check for required Firebase services
            const requiredServices = [
                'initializeApp',
                'getAuth',
                'getFirestore',
                'getStorage'
            ];

            requiredServices.forEach(service => {
                if (firebaseConfig.includes(service)) {
                    this.addPassed(`Firebase service '${service}' is configured`);
                } else {
                    this.addError(`Firebase service '${service}' is missing`);
                }
            });

            // Check for hardcoded credentials (security issue)
            if (firebaseConfig.includes('AIzaSy') && !firebaseConfig.includes('import.meta.env')) {
                this.addWarning('Firebase configuration appears to use hardcoded credentials. Consider using environment variables.');
            } else {
                this.addPassed('Firebase configuration properly uses environment variables or is configured correctly');
            }

        } catch (error) {
            this.addError(`Failed to read Firebase configuration: ${error.message}`);
        }
    }

    checkSecurityFiles() {
        this.log('Validating security configuration...', 'info');

        const securityFiles = [
            { path: 'security/incident-response-procedures.md', description: 'Incident response procedures' },
            { path: 'security/pre-deployment-security-checklist.md', description: 'Security checklist' },
            { path: 'security/security-monitoring-config.json', description: 'Security monitoring config' },
            { path: 'security/supply-chain-config.json', description: 'Supply chain security config' },
            { path: 'SECURITY.md', description: 'Security policy' }
        ];

        securityFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });
    }

    checkPrivacyImplementation() {
        this.log('Validating privacy implementation...', 'info');

        const privacyFiles = [
            { path: 'src/types/privacy.ts', description: 'Privacy type definitions' },
            { path: 'src/lib/privacyService.ts', description: 'Privacy service' },
            { path: 'src/lib/securePrivacyService.ts', description: 'Secure privacy service' },
            { path: 'src/contexts/PrivacyContext.tsx', description: 'Privacy context' }
        ];

        privacyFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });

        // Check for privacy components
        const privacyComponents = [
            'src/components/PrivacySettings.tsx',
            'src/components/PrivacyGuard.tsx'
        ];

        privacyComponents.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                this.addPassed(`Privacy component exists: ${filePath}`);
            } else {
                this.addWarning(`Privacy component missing: ${filePath}`);
            }
        });
    }

    checkPublicAssets() {
        this.log('Validating public assets...', 'info');

        const publicFiles = [
            { path: 'public/manifest.json', description: 'PWA manifest' },
            { path: 'public/sw.js', description: 'Service worker' },
            { path: 'public/robots.txt', description: 'Robots.txt' },
            { path: 'public/_headers', description: 'Security headers' },
            { path: 'public/_redirects', description: 'Redirect rules' }
        ];

        publicFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });

        // Validate manifest.json
        if (fs.existsSync('public/manifest.json')) {
            try {
                const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

                const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
                requiredFields.forEach(field => {
                    if (manifest[field]) {
                        this.addPassed(`PWA manifest has required field: ${field}`);
                    } else {
                        this.addError(`PWA manifest missing required field: ${field}`);
                    }
                });
            } catch (error) {
                this.addError(`Failed to parse PWA manifest: ${error.message}`);
            }
        }
    }

    checkDocumentation() {
        this.log('Validating documentation...', 'info');

        const docFiles = [
            { path: 'README.md', description: 'Project README' },
            { path: 'PANDAS_TRACKER_GUIDE.md', description: 'User guide' },
            { path: 'DEPLOYMENT_CHECKLIST.md', description: 'Deployment checklist' }
        ];

        docFiles.forEach(({ path: filePath, description }) => {
            this.checkFileExists(filePath, description);
        });
    }

    checkBuildOutput() {
        this.log('Checking build output...', 'info');

        if (fs.existsSync('dist')) {
            this.addPassed('Build output directory exists');

            // Check for essential build files
            const buildFiles = ['dist/index.html', 'dist/assets'];
            buildFiles.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    this.addPassed(`Build file exists: ${filePath}`);
                } else {
                    this.addWarning(`Build file missing: ${filePath} (run 'npm run build' first)`);
                }
            });
        } else {
            this.addWarning('Build output directory missing (run \'npm run build\' first)');
        }
    }

    checkEnvironmentTemplate() {
        this.log('Validating environment configuration...', 'info');

        // Check if there's an environment template or example
        const envFiles = ['.env.example', '.env.template', '.env.local'];
        let hasEnvConfig = false;

        envFiles.forEach(envFile => {
            if (fs.existsSync(envFile)) {
                this.addPassed(`Environment configuration found: ${envFile}`);
                hasEnvConfig = true;
            }
        });

        if (!hasEnvConfig) {
            this.addWarning('No environment configuration template found. Consider adding .env.example');
        }
    }

    generateReport() {
        this.log('\n=== DEPLOYMENT VALIDATION REPORT ===', 'info');

        console.log(`\n✅ PASSED: ${this.passed.length}`);
        console.log(`⚠️  WARNINGS: ${this.warnings.length}`);
        console.log(`❌ ERRORS: ${this.errors.length}`);

        if (this.errors.length > 0) {
            console.log('\n❌ CRITICAL ISSUES FOUND:');
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }

        const isReady = this.errors.length === 0;

        console.log('\n=== DEPLOYMENT STATUS ===');
        if (isReady) {
            console.log('🚀 STATUS: READY FOR DEPLOYMENT');
            console.log('✅ All critical checks passed. The application is ready for production deployment.');
        } else {
            console.log('🚫 STATUS: NOT READY FOR DEPLOYMENT');
            console.log(`❌ ${this.errors.length} critical issue(s) must be resolved before deployment.`);
        }

        if (this.warnings.length > 0) {
            console.log(`⚠️  ${this.warnings.length} warning(s) should be addressed for optimal deployment.`);
        }

        return isReady;
    }

    async run() {
        console.log('🔍 Starting PANDAS Autoimmune Tracker deployment validation...\n');

        // Run all validation checks
        this.checkPackageJson();
        this.checkConfigurationFiles();
        this.checkSourceStructure();
        this.checkFirebaseConfiguration();
        this.checkSecurityFiles();
        this.checkPrivacyImplementation();
        this.checkPublicAssets();
        this.checkDocumentation();
        this.checkBuildOutput();
        this.checkEnvironmentTemplate();

        // Generate final report
        const isReady = this.generateReport();

        // Exit with appropriate code
        process.exit(isReady ? 0 : 1);
    }
}

// Run validation if this script is executed directly
const validator = new DeploymentValidator();
validator.run().catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
});

export default DeploymentValidator;