# Privacy Settings Infrastructure

This module provides comprehensive privacy settings infrastructure for the PANDAS tracking application, ensuring compliance with privacy regulations while giving users full control over their data.

## Overview

The privacy settings infrastructure consists of:

- **TypeScript Interfaces**: Comprehensive type definitions for all privacy-related data
- **Privacy Service**: Core service for managing user privacy preferences and settings
- **Audit Service**: Comprehensive logging and monitoring of privacy-related actions
- **Firebase Setup**: Automated Firestore collection and index configuration
- **Validation Utilities**: Tools for validating privacy settings and infrastructure
- **Demo System**: Complete demonstration of all privacy features

## Core Components

### 1. Privacy Service (`PrivacyService`)

Manages user privacy preferences with full CRUD operations:

```typescript
import { privacyService } from '@/lib/privacy';

// Get user's privacy settings (creates defaults if none exist)
const settings = await privacyService.getPrivacySettings(userId);

// Update privacy settings
await privacyService.updatePrivacySettings(userId, {
  dataSharing: { researchParticipation: true }
});

// Revoke consent (immediate effect)
await privacyService.revokeConsent(userId, 'research_participation');

// Request data deletion (30-day processing period)
const deletionId = await privacyService.requestDataDeletion(userId, 'all_data');

// Grant temporary access to healthcare providers
const accessId = await privacyService.grantTemporaryAccess(userId, {
  grantedTo: 'provider-id',
  grantedToName: 'Dr. Smith',
  permissions: ['view_symptoms', 'view_treatments'],
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  purpose: 'Medical consultation'
});
```

### 2. Audit Service (`AuditService`)

Comprehensive logging and monitoring of all privacy-related actions:

```typescript
import { auditService } from '@/lib/privacy';

// Log privacy actions
await auditService.logPrivacyAction(userId, 'view_data', {
  resourceType: 'symptoms',
  resourceId: 'symptom-123',
  details: 'User viewed symptom data'
});

// Get access logs with filtering
const logs = await auditService.getAccessLogs(userId, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  action: 'view_data'
});

// Generate comprehensive audit reports
const report = await auditService.generateAuditReport(userId, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Detect suspicious activity
const suspiciousActivity = await auditService.detectSuspiciousActivity(userId);
```

### 3. Privacy Utilities (`PrivacyUtils`)

Helper functions for common privacy operations:

```typescript
import { PrivacyUtils } from '@/lib/privacy';

// Check permissions
const canView = PrivacyUtils.hasPermission(userPermissions, 'view_symptoms');

// Get role-based permissions
const permissions = PrivacyUtils.getPermissionsForRole('parent');

// Check if consent is required
const needsConsent = PrivacyUtils.isConsentRequired('export_data');

// Validate privacy settings
const errors = PrivacyUtils.validatePrivacySettings(settings);

// Generate privacy summary
const summary = PrivacyUtils.generatePrivacySettingsSummary(settings);
```

## Data Models

### Privacy Settings Structure

```typescript
interface PrivacySettings {
  id: string;
  userId: string;
  dataSharing: DataSharingPreferences;
  accessControl: AccessControlSettings;
  dataRetention: DataRetentionSettings;
  communications: CommunicationPreferences;
  childSpecific: Record<string, ChildPrivacySettings>;
  lastUpdated: Date;
  version: number;
}
```

### Key Features

- **Data Sharing Control**: Research participation, anonymized sharing, third-party integrations
- **Access Management**: Family members, healthcare providers, temporary access
- **Data Retention**: Automatic deletion, retention policies, legal holds
- **Communication Preferences**: Email, SMS, marketing, security alerts
- **Child-Specific Settings**: Per-child privacy controls with inheritance
- **Comprehensive Auditing**: All actions logged with suspicious activity detection

## Firebase Collections

The infrastructure automatically sets up the following Firestore collections:

- `privacy_settings` - User privacy preferences
- `privacy_audit_logs` - Comprehensive audit trail
- `deletion_requests` - Data deletion requests and status
- `temporary_access` - Temporary access grants
- `provider_access` - Healthcare provider access permissions
- `audit_failures` - Audit logging failure monitoring

## Security Features

### Compliance
- **HIPAA Compliant**: Comprehensive audit logging and access controls
- **GDPR Ready**: Data portability, deletion rights, consent management
- **Immediate Effect**: Consent revocation and access changes take effect immediately

### Monitoring
- **Suspicious Activity Detection**: Unusual access patterns, failed attempts, bulk exports
- **Audit Trail**: Complete logging of all privacy-related actions
- **Failure Monitoring**: Audit logging failures are tracked and escalated

### Data Protection
- **Encryption Ready**: Interfaces for client-side encryption of sensitive data
- **Access Controls**: Role-based permissions with minimum necessary principle
- **Session Management**: Session tracking and timeout handling

## Installation and Setup

1. **Import the privacy infrastructure**:
```typescript
import { 
  privacyService, 
  auditService, 
  PrivacyUtils,
  PrivacyFirebaseSetup 
} from '@/lib/privacy';
```

2. **Initialize Firebase collections** (development):
```typescript
await PrivacyFirebaseSetup.initializeCollections();
```

3. **Validate infrastructure**:
```typescript
import { validatePrivacyInfrastructure } from '@/lib/privacy';

const report = await validatePrivacyInfrastructure();
console.log('Privacy infrastructure status:', report.overall ? 'OK' : 'ISSUES');
```

## Usage Examples

### Basic Privacy Settings Management

```typescript
// Create or get user's privacy settings
const settings = await privacyService.getPrivacySettings(userId);

// Update data sharing preferences
await privacyService.updatePrivacySettings(userId, {
  dataSharing: {
    ...settings.dataSharing,
    researchParticipation: true,
    anonymizedDataSharing: true
  }
});

// Revoke all third-party access
await privacyService.revokeConsent(userId, 'third_party_integration');
```

### Healthcare Provider Access

```typescript
// Grant temporary access to a healthcare provider
const accessId = await privacyService.grantTemporaryAccess(userId, {
  grantedTo: 'provider-email@hospital.com',
  grantedToName: 'Dr. Jane Smith',
  grantedToEmail: 'provider-email@hospital.com',
  permissions: ['view_symptoms', 'view_treatments', 'view_vitals'],
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  maxAccessCount: 10,
  purpose: 'Specialist consultation for PANDAS treatment'
});

// Revoke access early if needed
await privacyService.revokeAccess(userId, accessId, 'temporary');
```

### Audit and Monitoring

```typescript
// Generate monthly audit report
const report = await auditService.generateAuditReport(userId, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Check for suspicious activity
const suspicious = await auditService.detectSuspiciousActivity(userId);
if (suspicious.length > 0) {
  console.log('Suspicious activity detected:', suspicious);
}
```

## Testing and Validation

### Run Infrastructure Demo
```typescript
import { runPrivacyDemo } from '@/lib/privacy/demo';

// Run complete demonstration
await runPrivacyDemo();
```

### Validate Infrastructure
```typescript
import { validatePrivacyInfrastructure } from '@/lib/privacy';

const report = await validatePrivacyInfrastructure();
if (!report.overall) {
  console.error('Privacy infrastructure issues:', report.results);
}
```

## Requirements Compliance

This infrastructure addresses the following requirements from the privacy settings specification:

- **Requirement 1**: Data sharing control and consent management
- **Requirement 2**: Access control for family members and healthcare providers
- **Requirement 3**: Data retention and deletion management
- **Requirement 4**: Comprehensive audit logging and reporting
- **Requirement 5**: Child-specific privacy controls
- **Requirement 6**: Communication preferences management
- **Requirement 7**: Data processing transparency

## Next Steps

1. **UI Integration**: Create React components using these services
2. **Firebase Security**: Configure Firestore security rules
3. **Error Handling**: Implement comprehensive error handling and user feedback
4. **Monitoring**: Set up production monitoring and alerting
5. **Testing**: Add comprehensive unit and integration tests
6. **Documentation**: Create user-facing privacy documentation

## Support

For questions or issues with the privacy infrastructure:

1. Check the validation utilities for configuration issues
2. Review the demo system for usage examples
3. Examine the comprehensive type definitions for data structures
4. Consult the audit logs for debugging access issues