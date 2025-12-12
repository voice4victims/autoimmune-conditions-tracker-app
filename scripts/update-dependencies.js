#!/usr/bin/env node

/**
 * Automated dependency update and security patching script
 * Implements secure dependency update process for supply chain security
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
    // Critical dependencies that require manual review
    criticalDependencies: ['firebase', 'crypto-js', 'zod'],

    // Maximum allowed vulnerability severity for auto-fix
    maxAutoFixSeverity: 'high',

    // Backup directory for rollback
    backupDir: '.dependency-backups',

    // Notification settings
    notifications: {
        slack: process.env.SLACK_WEBHOOK_URL,
        email: process.env.SECURITY_EMAIL
    }
};

class DependencyUpdater {
    constructor() {
        this.packageJsonPath = path.join(process.cwd(), 'package.json');
        this.packageLockPath = path.join(process.cwd(), 'package-lock.json');
        this.backupPath = path.join(process.cwd(), CONFIG.backupDir);
    }

    async run() {
        console.log('🔍 Starting dependency security update process...');

        try {
            // Create backup
            await this.createBackup();

            // Audit current dependencies
            const auditResults = await this.auditDependencies();

            // Process vulnerabilities
            const updatePlan = await this.createUpdatePlan(auditResults);

            // Apply updates
            await this.applyUpdates(updatePlan);

            // Verify updates
            await this.verifyUpdates();

            // Generate report
            await this.generateReport(updatePlan);

            console.log('✅ Dependency update process completed successfully');

        } catch (error) {
            console.error('❌ Dependency update process failed:', error.message);
            await this.rollback();
            process.exit(1);
        }
    }

    async createBackup() {
        console.log('📦 Creating backup of current dependencies...');

        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupSubDir = path.join(this.backupPath, timestamp);
        fs.mkdirSync(backupSubDir);

        // Backup package files
        fs.copyFileSync(this.packageJsonPath, path.join(backupSubDir, 'package.json'));
        fs.copyFileSync(this.packageLockPath, path.join(backupSubDir, 'package-lock.json'));

        console.log(`✅ Backup created at ${backupSubDir}`);
    }

    async auditDependencies() {
        console.log('🔍 Auditing dependencies for vulnerabilities...');

        try {
            const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
            const auditResults = JSON.parse(auditOutput);

            console.log(`Found ${auditResults.metadata.vulnerabilities.total} total vulnerabilities`);
            console.log(`- Critical: ${auditResults.metadata.vulnerabilities.critical}`);
            console.log(`- High: ${auditResults.metadata.vulnerabilities.high}`);
            console.log(`- Moderate: ${auditResults.metadata.vulnerabilities.moderate}`);
            console.log(`- Low: ${auditResults.metadata.vulnerabilities.low}`);

            return auditResults;

        } catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities are found
            if (error.stdout) {
                return JSON.parse(error.stdout);
            }
            throw error;
        }
    }

    async createUpdatePlan(auditResults) {
        console.log('📋 Creating update plan...');

        const updatePlan = {
            automatic: [],
            manualReview: [],
            blocked: []
        };

        if (auditResults.vulnerabilities) {
            for (const [packageName, vulnerability] of Object.entries(auditResults.vulnerabilities)) {
                const isCriticalDep = CONFIG.criticalDependencies.includes(packageName);
                const severity = vulnerability.severity;

                if (isCriticalDep) {
                    updatePlan.manualReview.push({
                        package: packageName,
                        vulnerability,
                        reason: 'Critical dependency requires manual review'
                    });
                } else if (severity === 'critical' || severity === 'high') {
                    if (this.canAutoFix(vulnerability)) {
                        updatePlan.automatic.push({
                            package: packageName,
                            vulnerability,
                            action: 'auto-fix'
                        });
                    } else {
                        updatePlan.manualReview.push({
                            package: packageName,
                            vulnerability,
                            reason: 'High/Critical severity requires review'
                        });
                    }
                } else {
                    updatePlan.automatic.push({
                        package: packageName,
                        vulnerability,
                        action: 'auto-fix'
                    });
                }
            }
        }

        console.log(`📊 Update plan created:`);
        console.log(`- Automatic updates: ${updatePlan.automatic.length}`);
        console.log(`- Manual review required: ${updatePlan.manualReview.length}`);
        console.log(`- Blocked updates: ${updatePlan.blocked.length}`);

        return updatePlan;
    }

    canAutoFix(vulnerability) {
        // Check if vulnerability can be automatically fixed
        return vulnerability.fixAvailable &&
            vulnerability.fixAvailable !== false &&
            vulnerability.severity !== 'critical';
    }

    async applyUpdates(updatePlan) {
        console.log('🔧 Applying automatic updates...');

        if (updatePlan.automatic.length === 0) {
            console.log('No automatic updates to apply');
            return;
        }

        try {
            // Apply npm audit fix for automatic updates
            execSync('npm audit fix --only=prod', { stdio: 'inherit' });

            // Verify package-lock.json integrity
            execSync('npm ci --dry-run', { stdio: 'inherit' });

            console.log('✅ Automatic updates applied successfully');

        } catch (error) {
            throw new Error(`Failed to apply automatic updates: ${error.message}`);
        }
    }

    async verifyUpdates() {
        console.log('🧪 Verifying updates...');

        try {
            // Run tests to ensure updates don't break functionality
            console.log('Running tests...');
            execSync('npm test', { stdio: 'inherit' });

            // Run build to ensure no build issues
            console.log('Testing build...');
            execSync('npm run build', { stdio: 'inherit' });

            // Re-audit to check if vulnerabilities were fixed
            console.log('Re-auditing dependencies...');
            const postUpdateAudit = await this.auditDependencies();

            console.log('✅ Updates verified successfully');
            return postUpdateAudit;

        } catch (error) {
            throw new Error(`Update verification failed: ${error.message}`);
        }
    }

    async generateReport(updatePlan) {
        console.log('📄 Generating update report...');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                automaticUpdates: updatePlan.automatic.length,
                manualReviewRequired: updatePlan.manualReview.length,
                blockedUpdates: updatePlan.blocked.length
            },
            details: updatePlan,
            recommendations: this.generateRecommendations(updatePlan)
        };

        // Save report
        const reportPath = path.join(process.cwd(), 'security', 'dependency-update-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Send notifications if configured
        await this.sendNotifications(report);

        console.log(`📄 Report saved to ${reportPath}`);
    }

    generateRecommendations(updatePlan) {
        const recommendations = [];

        if (updatePlan.manualReview.length > 0) {
            recommendations.push({
                type: 'manual_review',
                priority: 'high',
                message: `${updatePlan.manualReview.length} dependencies require manual security review`,
                action: 'Review and update critical dependencies manually'
            });
        }

        if (updatePlan.blocked.length > 0) {
            recommendations.push({
                type: 'blocked_updates',
                priority: 'medium',
                message: `${updatePlan.blocked.length} updates were blocked by policy`,
                action: 'Review blocked updates and update policies if needed'
            });
        }

        recommendations.push({
            type: 'monitoring',
            priority: 'low',
            message: 'Continue monitoring for new vulnerabilities',
            action: 'Schedule next security scan'
        });

        return recommendations;
    }

    async sendNotifications(report) {
        if (CONFIG.notifications.slack && report.summary.manualReviewRequired > 0) {
            console.log('📢 Sending Slack notification...');
            // Implementation would send Slack webhook notification
        }

        if (CONFIG.notifications.email && report.summary.automaticUpdates > 0) {
            console.log('📧 Sending email notification...');
            // Implementation would send email notification
        }
    }

    async rollback() {
        console.log('🔄 Rolling back changes...');

        try {
            // Find most recent backup
            const backups = fs.readdirSync(this.backupPath)
                .filter(dir => fs.statSync(path.join(this.backupPath, dir)).isDirectory())
                .sort()
                .reverse();

            if (backups.length === 0) {
                throw new Error('No backups found for rollback');
            }

            const latestBackup = path.join(this.backupPath, backups[0]);

            // Restore package files
            fs.copyFileSync(path.join(latestBackup, 'package.json'), this.packageJsonPath);
            fs.copyFileSync(path.join(latestBackup, 'package-lock.json'), this.packageLockPath);

            // Reinstall dependencies
            execSync('npm ci', { stdio: 'inherit' });

            console.log('✅ Rollback completed successfully');

        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
        }
    }
}

// Run the updater if called directly
if (require.main === module) {
    const updater = new DependencyUpdater();
    updater.run().catch(console.error);
}

module.exports = DependencyUpdater;