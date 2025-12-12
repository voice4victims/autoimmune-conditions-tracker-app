import CryptoJS from 'crypto-js';

/**
 * Cryptographic service for secure data handling in privacy settings
 * Implements OWASP A04:2025 - Cryptographic Failures mitigation
 */
export class CryptoService {
    private static instance: CryptoService;
    private readonly keyDerivationIterations = 100000; // PBKDF2 iterations
    private readonly keySize = 256; // AES-256
    private readonly ivSize = 128; // 128-bit IV

    public static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }

    /**
     * Generate a cryptographically secure random key
     */
    generateSecureKey(): string {
        return CryptoJS.lib.WordArray.random(this.keySize / 8).toString();
    }

    /**
     * Generate a cryptographically secure random IV
     */
    generateIV(): string {
        return CryptoJS.lib.WordArray.random(this.ivSize / 8).toString();
    }

    /**
     * Derive encryption key from password using PBKDF2
     */
    deriveKey(password: string, salt: string): string {
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: this.keySize / 32,
            iterations: this.keyDerivationIterations,
            hasher: CryptoJS.algo.SHA256
        });
        return key.toString();
    }

    /**
     * Encrypt sensitive privacy data using AES-256-GCM
     */
    encryptPrivacyData(data: string, key: string): {
        encrypted: string;
        iv: string;
        tag: string;
        salt: string;
    } {
        try {
            // Generate random salt and IV
            const salt = CryptoJS.lib.WordArray.random(128 / 8);
            const iv = CryptoJS.lib.WordArray.random(this.ivSize / 8);

            // Derive key from provided key and salt
            const derivedKey = CryptoJS.PBKDF2(key, salt, {
                keySize: this.keySize / 32,
                iterations: this.keyDerivationIterations,
                hasher: CryptoJS.algo.SHA256
            });

            // Encrypt using AES-256-CBC (GCM not available in crypto-js, using CBC with HMAC)
            const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            // Generate HMAC for authentication
            const hmac = CryptoJS.HmacSHA256(encrypted.toString(), derivedKey);

            return {
                encrypted: encrypted.toString(),
                iv: iv.toString(),
                tag: hmac.toString(),
                salt: salt.toString()
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt privacy data');
        }
    }

    /**
     * Decrypt sensitive privacy data
     */
    decryptPrivacyData(
        encryptedData: string,
        key: string,
        iv: string,
        tag: string,
        salt: string
    ): string {
        try {
            // Derive the same key used for encryption
            const derivedKey = CryptoJS.PBKDF2(key, salt, {
                keySize: this.keySize / 32,
                iterations: this.keyDerivationIterations,
                hasher: CryptoJS.algo.SHA256
            });

            // Verify HMAC for authentication
            const expectedHmac = CryptoJS.HmacSHA256(encryptedData, derivedKey);
            if (expectedHmac.toString() !== tag) {
                throw new Error('Data integrity check failed');
            }

            // Decrypt the data
            const decrypted = CryptoJS.AES.decrypt(encryptedData, derivedKey, {
                iv: CryptoJS.enc.Hex.parse(iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) {
                throw new Error('Decryption failed - invalid key or corrupted data');
            }

            return decryptedText;
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt privacy data');
        }
    }

    /**
     * Hash sensitive data using SHA-256 with salt
     */
    hashSensitiveData(data: string, salt?: string): {
        hash: string;
        salt: string;
    } {
        const usedSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
        const hash = CryptoJS.SHA256(data + usedSalt).toString();

        return {
            hash,
            salt: usedSalt
        };
    }

    /**
     * Verify hashed data
     */
    verifyHashedData(data: string, hash: string, salt: string): boolean {
        const computedHash = CryptoJS.SHA256(data + salt).toString();
        return this.constantTimeCompare(computedHash, hash);
    }

    /**
     * Generate secure token for temporary access
     */
    generateSecureToken(length: number = 32): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const randomBytes = CryptoJS.lib.WordArray.random(length);
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = (randomBytes.words[Math.floor(i / 4)] >>> (24 - (i % 4) * 8)) & 0xFF;
            result += chars[randomIndex % chars.length];
        }

        return result;
    }

    /**
     * Encrypt data for transmission (with additional layer for API calls)
     */
    encryptForTransmission(data: any, publicKey?: string): string {
        try {
            const jsonData = JSON.stringify(data);
            const sessionKey = this.generateSecureKey();

            // Encrypt data with session key
            const encryptedData = this.encryptPrivacyData(jsonData, sessionKey);

            // In a real implementation, you would encrypt the session key with the public key
            // For now, we'll include it in the payload (this is not secure for production)
            const payload = {
                data: encryptedData,
                sessionKey: sessionKey, // In production, this would be encrypted with public key
                timestamp: Date.now(),
                version: '1.0'
            };

            return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(payload)));
        } catch (error) {
            console.error('Transmission encryption failed:', error);
            throw new Error('Failed to encrypt data for transmission');
        }
    }

    /**
     * Decrypt data received from transmission
     */
    decryptFromTransmission(encryptedPayload: string, privateKey?: string): any {
        try {
            const payloadJson = CryptoJS.enc.Base64.parse(encryptedPayload).toString(CryptoJS.enc.Utf8);
            const payload = JSON.parse(payloadJson);

            // Verify timestamp (prevent replay attacks)
            const age = Date.now() - payload.timestamp;
            if (age > 300000) { // 5 minutes
                throw new Error('Encrypted payload has expired');
            }

            // In production, you would decrypt the session key with the private key
            const sessionKey = payload.sessionKey;

            // Decrypt the actual data
            const decryptedData = this.decryptPrivacyData(
                payload.data.encrypted,
                sessionKey,
                payload.data.iv,
                payload.data.tag,
                payload.data.salt
            );

            return JSON.parse(decryptedData);
        } catch (error) {
            console.error('Transmission decryption failed:', error);
            throw new Error('Failed to decrypt transmitted data');
        }
    }

    /**
     * Secure key storage using browser's secure storage
     */
    async storeSecureKey(keyId: string, key: string): Promise<void> {
        try {
            // In a real implementation, you would use:
            // - Web Crypto API for key storage
            // - IndexedDB with encryption
            // - Hardware security modules if available

            const encryptedKey = this.encryptPrivacyData(key, this.getMasterKey());
            localStorage.setItem(`secure_key_${keyId}`, JSON.stringify(encryptedKey));
        } catch (error) {
            console.error('Key storage failed:', error);
            throw new Error('Failed to store secure key');
        }
    }

    /**
     * Retrieve secure key from storage
     */
    async retrieveSecureKey(keyId: string): Promise<string | null> {
        try {
            const storedData = localStorage.getItem(`secure_key_${keyId}`);
            if (!storedData) {
                return null;
            }

            const encryptedKey = JSON.parse(storedData);
            return this.decryptPrivacyData(
                encryptedKey.encrypted,
                this.getMasterKey(),
                encryptedKey.iv,
                encryptedKey.tag,
                encryptedKey.salt
            );
        } catch (error) {
            console.error('Key retrieval failed:', error);
            return null;
        }
    }

    /**
     * Clear secure key from storage
     */
    async clearSecureKey(keyId: string): Promise<void> {
        localStorage.removeItem(`secure_key_${keyId}`);
    }

    /**
     * Validate cryptographic configuration
     */
    validateCryptoConfig(): {
        valid: boolean;
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check key derivation iterations
        if (this.keyDerivationIterations < 100000) {
            issues.push('PBKDF2 iterations too low');
            recommendations.push('Increase PBKDF2 iterations to at least 100,000');
        }

        // Check key size
        if (this.keySize < 256) {
            issues.push('Encryption key size too small');
            recommendations.push('Use AES-256 or higher');
        }

        // Check IV size
        if (this.ivSize < 128) {
            issues.push('IV size too small');
            recommendations.push('Use at least 128-bit IV');
        }

        // Check for secure random number generation
        if (!window.crypto || !window.crypto.getRandomValues) {
            issues.push('Secure random number generation not available');
            recommendations.push('Ensure Web Crypto API is available');
        }

        // Check HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            issues.push('Not using HTTPS');
            recommendations.push('Always use HTTPS in production');
        }

        return {
            valid: issues.length === 0,
            issues,
            recommendations
        };
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private constantTimeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Get master key for key encryption (in production, this would be more secure)
     */
    private getMasterKey(): string {
        // In production, this would be:
        // - Derived from user authentication
        // - Stored in secure hardware
        // - Retrieved from key management service
        return 'master-key-placeholder-not-for-production';
    }

    /**
     * Secure memory cleanup (limited in JavaScript)
     */
    secureCleanup(sensitiveData: string): void {
        // JavaScript doesn't provide true secure memory cleanup
        // This is a best-effort approach
        try {
            // Overwrite the string reference (limited effectiveness)
            sensitiveData = '';

            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
        } catch (error) {
            // Cleanup failed, but continue execution
            console.warn('Secure cleanup failed:', error);
        }
    }

    /**
     * Generate cryptographic audit report
     */
    generateCryptoAuditReport(): {
        timestamp: string;
        configuration: any;
        validation: any;
        recommendations: string[];
    } {
        const validation = this.validateCryptoConfig();

        return {
            timestamp: new Date().toISOString(),
            configuration: {
                keySize: this.keySize,
                ivSize: this.ivSize,
                keyDerivationIterations: this.keyDerivationIterations,
                hashAlgorithm: 'SHA-256',
                encryptionAlgorithm: 'AES-256-CBC',
                keyDerivationFunction: 'PBKDF2'
            },
            validation,
            recommendations: [
                'Regularly rotate encryption keys',
                'Monitor for cryptographic vulnerabilities',
                'Consider hardware security modules for key storage',
                'Implement certificate pinning for HTTPS',
                'Use Web Crypto API when available',
                'Implement proper key lifecycle management'
            ]
        };
    }
}

// Export singleton instance
export const cryptoService = CryptoService.getInstance();