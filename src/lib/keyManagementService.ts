import { cryptoService } from './cryptoService';

/**
 * Key Management Service for secure key lifecycle management
 * Implements proper key rotation, storage, and access controls
 */
export class KeyManagementService {
    private static instance: KeyManagementService;
    private readonly keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    private readonly keyVersions = new Map<string, KeyVersion[]>();

    public static getInstance(): KeyManagementService {
        if (!KeyManagementService.instance) {
            KeyManagementService.instance = new KeyManagementService();
        }
        return KeyManagementService.instance;
    }

    /**
     * Generate a new encryption key with metadata
     */
    async generateKey(keyId: string, purpose: KeyPurpose): Promise<KeyMetadata> {
        try {
            const key = cryptoService.generateSecureKey();
            const metadata: KeyMetadata = {
                keyId,
                version: this.getNextVersion(keyId),
                purpose,
                algorithm: 'AES-256',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + this.keyRotationInterval),
                status: 'active',
                permissions: this.getDefaultPermissions(purpose)
            };

            // Store key securely
            await this.storeKey(keyId, key, metadata);

            // Track key version
            this.trackKeyVersion(keyId, metadata);

            console.log(`Generated new key: ${keyId} v${metadata.version}`);
            return metadata;
        } catch (error) {
            console.error('Key generation failed:', error);
            throw new Error('Failed to generate encryption key');
        }
    }

    /**
     * Retrieve active key for specified purpose
     */
    async getActiveKey(keyId: string): Promise<{ key: string; metadata: KeyMetadata } | null> {
        try {
            const versions = this.keyVersions.get(keyId) || [];
            const activeVersion = versions.find(v => v.metadata.status === 'active');

            if (!activeVersion) {
                return null;
            }

            const key = await cryptoService.retrieveSecureKey(
                this.getStorageKey(keyId, activeVersion.metadata.version)
            );

            if (!key) {
                console.warn(`Key not found in storage: ${keyId}`);
                return null;
            }

            return {
                key,
                metadata: activeVersion.metadata
            };
        } catch (error) {
            console.error('Key retrieval failed:', error);
            return null;
        }
    }

    /**
     * Rotate encryption key
     */
    async rotateKey(keyId: string): Promise<KeyMetadata> {
        try {
            console.log(`Starting key rotation for: ${keyId}`);

            // Get current active key
            const currentKey = await this.getActiveKey(keyId);
            if (!currentKey) {
                throw new Error('No active key found for rotation');
            }

            // Mark current key as deprecated
            await this.updateKeyStatus(keyId, currentKey.metadata.version, 'deprecated');

            // Generate new key
            const newKeyMetadata = await this.generateKey(keyId, currentKey.metadata.purpose);

            // Schedule old key for deletion after grace period
            setTimeout(() => {
                this.scheduleKeyDeletion(keyId, currentKey.metadata.version);
            }, 7 * 24 * 60 * 60 * 1000); // 7 days grace period

            console.log(`Key rotation completed: ${keyId} v${currentKey.metadata.version} -> v${newKeyMetadata.version}`);
            return newKeyMetadata;
        } catch (error) {
            console.error('Key rotation failed:', error);
            throw new Error('Failed to rotate encryption key');
        }
    }

    /**
     * Check if key needs rotation
     */
    async checkKeyRotation(keyId: string): Promise<boolean> {
        const activeKey = await this.getActiveKey(keyId);
        if (!activeKey) {
            return true; // No key exists, needs generation
        }

        const now = new Date();
        return now >= activeKey.metadata.expiresAt;
    }

    /**
     * Perform automatic key rotation for all keys
     */
    async performAutomaticRotation(): Promise<RotationReport> {
        const report: RotationReport = {
            timestamp: new Date(),
            rotated: [],
            failed: [],
            skipped: []
        };

        try {
            const allKeyIds = Array.from(this.keyVersions.keys());

            for (const keyId of allKeyIds) {
                try {
                    const needsRotation = await this.checkKeyRotation(keyId);

                    if (needsRotation) {
                        const newMetadata = await this.rotateKey(keyId);
                        report.rotated.push({
                            keyId,
                            newVersion: newMetadata.version,
                            rotatedAt: new Date()
                        });
                    } else {
                        report.skipped.push({
                            keyId,
                            reason: 'Key still valid'
                        });
                    }
                } catch (error) {
                    report.failed.push({
                        keyId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            console.log(`Key rotation completed: ${report.rotated.length} rotated, ${report.failed.length} failed, ${report.skipped.length} skipped`);
            return report;
        } catch (error) {
            console.error('Automatic key rotation failed:', error);
            throw error;
        }
    }

    /**
     * Revoke a key (mark as revoked and remove from storage)
     */
    async revokeKey(keyId: string, version: number, reason: string): Promise<void> {
        try {
            await this.updateKeyStatus(keyId, version, 'revoked');
            await cryptoService.clearSecureKey(this.getStorageKey(keyId, version));

            // Log revocation
            console.log(`Key revoked: ${keyId} v${version} - Reason: ${reason}`);

            // Update metadata
            const versions = this.keyVersions.get(keyId) || [];
            const versionIndex = versions.findIndex(v => v.metadata.version === version);
            if (versionIndex >= 0) {
                versions[versionIndex].metadata.revokedAt = new Date();
                versions[versionIndex].metadata.revocationReason = reason;
            }
        } catch (error) {
            console.error('Key revocation failed:', error);
            throw new Error('Failed to revoke key');
        }
    }

    /**
     * Get key usage audit trail
     */
    getKeyAuditTrail(keyId: string): KeyAuditEntry[] {
        const versions = this.keyVersions.get(keyId) || [];
        const auditTrail: KeyAuditEntry[] = [];

        for (const version of versions) {
            auditTrail.push({
                keyId,
                version: version.metadata.version,
                action: 'created',
                timestamp: version.metadata.createdAt,
                details: `Key created for ${version.metadata.purpose}`
            });

            if (version.metadata.status === 'deprecated') {
                auditTrail.push({
                    keyId,
                    version: version.metadata.version,
                    action: 'deprecated',
                    timestamp: new Date(), // In real implementation, track actual deprecation time
                    details: 'Key deprecated during rotation'
                });
            }

            if (version.metadata.status === 'revoked' && version.metadata.revokedAt) {
                auditTrail.push({
                    keyId,
                    version: version.metadata.version,
                    action: 'revoked',
                    timestamp: version.metadata.revokedAt,
                    details: version.metadata.revocationReason || 'Key revoked'
                });
            }
        }

        return auditTrail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    /**
     * Generate key management report
     */
    generateKeyManagementReport(): KeyManagementReport {
        const allKeys = Array.from(this.keyVersions.entries());
        const report: KeyManagementReport = {
            timestamp: new Date(),
            totalKeys: allKeys.length,
            keysByStatus: {
                active: 0,
                deprecated: 0,
                revoked: 0
            },
            keysByPurpose: {},
            upcomingRotations: [],
            recommendations: []
        };

        for (const [keyId, versions] of allKeys) {
            const activeVersion = versions.find(v => v.metadata.status === 'active');
            if (activeVersion) {
                report.keysByStatus.active++;

                // Count by purpose
                const purpose = activeVersion.metadata.purpose;
                report.keysByPurpose[purpose] = (report.keysByPurpose[purpose] || 0) + 1;

                // Check for upcoming rotations
                const daysUntilExpiry = Math.ceil(
                    (activeVersion.metadata.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
                );

                if (daysUntilExpiry <= 7) {
                    report.upcomingRotations.push({
                        keyId,
                        version: activeVersion.metadata.version,
                        expiresAt: activeVersion.metadata.expiresAt,
                        daysRemaining: daysUntilExpiry
                    });
                }
            }

            // Count deprecated and revoked keys
            report.keysByStatus.deprecated += versions.filter(v => v.metadata.status === 'deprecated').length;
            report.keysByStatus.revoked += versions.filter(v => v.metadata.status === 'revoked').length;
        }

        // Generate recommendations
        if (report.upcomingRotations.length > 0) {
            report.recommendations.push(`${report.upcomingRotations.length} keys need rotation within 7 days`);
        }

        if (report.keysByStatus.deprecated > 10) {
            report.recommendations.push('Consider cleaning up deprecated keys');
        }

        if (report.keysByStatus.active === 0) {
            report.recommendations.push('No active keys found - generate initial keys');
        }

        return report;
    }

    /**
     * Initialize key management for privacy settings
     */
    async initializePrivacyKeys(): Promise<void> {
        const requiredKeys: Array<{ keyId: string; purpose: KeyPurpose }> = [
            { keyId: 'privacy-settings-encryption', purpose: 'data-encryption' },
            { keyId: 'audit-log-encryption', purpose: 'audit-encryption' },
            { keyId: 'communication-encryption', purpose: 'communication-encryption' },
            { keyId: 'export-encryption', purpose: 'export-encryption' }
        ];

        for (const { keyId, purpose } of requiredKeys) {
            const existingKey = await this.getActiveKey(keyId);
            if (!existingKey) {
                console.log(`Generating initial key: ${keyId}`);
                await this.generateKey(keyId, purpose);
            }
        }

        console.log('Privacy key initialization completed');
    }

    // Private helper methods

    private async storeKey(keyId: string, key: string, metadata: KeyMetadata): Promise<void> {
        const storageKey = this.getStorageKey(keyId, metadata.version);
        await cryptoService.storeSecureKey(storageKey, key);
    }

    private getStorageKey(keyId: string, version: number): string {
        return `${keyId}_v${version}`;
    }

    private getNextVersion(keyId: string): number {
        const versions = this.keyVersions.get(keyId) || [];
        return versions.length > 0 ? Math.max(...versions.map(v => v.metadata.version)) + 1 : 1;
    }

    private trackKeyVersion(keyId: string, metadata: KeyMetadata): void {
        const versions = this.keyVersions.get(keyId) || [];
        versions.push({ metadata });
        this.keyVersions.set(keyId, versions);
    }

    private async updateKeyStatus(keyId: string, version: number, status: KeyStatus): Promise<void> {
        const versions = this.keyVersions.get(keyId) || [];
        const versionIndex = versions.findIndex(v => v.metadata.version === version);

        if (versionIndex >= 0) {
            versions[versionIndex].metadata.status = status;
            if (status === 'deprecated') {
                versions[versionIndex].metadata.deprecatedAt = new Date();
            }
        }
    }

    private scheduleKeyDeletion(keyId: string, version: number): void {
        setTimeout(async () => {
            try {
                await cryptoService.clearSecureKey(this.getStorageKey(keyId, version));
                console.log(`Deleted deprecated key: ${keyId} v${version}`);
            } catch (error) {
                console.error(`Failed to delete deprecated key: ${keyId} v${version}`, error);
            }
        }, 1000); // Immediate deletion for demo, in production this would be longer
    }

    private getDefaultPermissions(purpose: KeyPurpose): KeyPermissions {
        const basePermissions: KeyPermissions = {
            encrypt: true,
            decrypt: true,
            rotate: true,
            revoke: false // Requires elevated privileges
        };

        switch (purpose) {
            case 'audit-encryption':
                return { ...basePermissions, revoke: false }; // Audit keys should not be easily revoked
            case 'export-encryption':
                return { ...basePermissions, decrypt: true }; // Export keys need decryption for data portability
            default:
                return basePermissions;
        }
    }
}

// Type definitions
export type KeyPurpose = 'data-encryption' | 'audit-encryption' | 'communication-encryption' | 'export-encryption';
export type KeyStatus = 'active' | 'deprecated' | 'revoked';

export interface KeyMetadata {
    keyId: string;
    version: number;
    purpose: KeyPurpose;
    algorithm: string;
    createdAt: Date;
    expiresAt: Date;
    status: KeyStatus;
    permissions: KeyPermissions;
    deprecatedAt?: Date;
    revokedAt?: Date;
    revocationReason?: string;
}

export interface KeyPermissions {
    encrypt: boolean;
    decrypt: boolean;
    rotate: boolean;
    revoke: boolean;
}

export interface KeyVersion {
    metadata: KeyMetadata;
}

export interface KeyAuditEntry {
    keyId: string;
    version: number;
    action: 'created' | 'deprecated' | 'revoked' | 'accessed';
    timestamp: Date;
    details: string;
}

export interface RotationReport {
    timestamp: Date;
    rotated: Array<{ keyId: string; newVersion: number; rotatedAt: Date }>;
    failed: Array<{ keyId: string; error: string }>;
    skipped: Array<{ keyId: string; reason: string }>;
}

export interface KeyManagementReport {
    timestamp: Date;
    totalKeys: number;
    keysByStatus: {
        active: number;
        deprecated: number;
        revoked: number;
    };
    keysByPurpose: Record<string, number>;
    upcomingRotations: Array<{
        keyId: string;
        version: number;
        expiresAt: Date;
        daysRemaining: number;
    }>;
    recommendations: string[];
}

// Export singleton instance
export const keyManagementService = KeyManagementService.getInstance();