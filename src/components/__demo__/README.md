# Privacy Settings Component Demo

This directory contains demo components for testing and development purposes.

## PrivacySettingsDemo

A standalone demo of the PrivacySettings component that can be used for:

- Manual testing during development
- Visual verification of component behavior
- Testing different states (loading, error, authenticated, etc.)

### Usage

To use this demo component, you can temporarily modify your main App.tsx to render it:

```tsx
import PrivacySettingsDemo from './components/__demo__/PrivacySettingsDemo';

function App() {
  return <PrivacySettingsDemo />;
}
```

### Features Demonstrated

- Tabbed interface with 6 privacy sections
- Loading states with spinner
- Error handling with retry functionality
- Error boundary for component-level error handling
- Responsive design for mobile/tablet/desktop
- Integration with authentication context
- Privacy settings status display

### Testing Scenarios

1. **Authenticated User**: Component loads privacy settings and displays tabs
2. **Unauthenticated User**: Shows sign-in prompt
3. **Loading State**: Shows loading spinner while fetching data
4. **Error State**: Shows error message with retry button
5. **Error Boundary**: Catches and displays component-level errors

### Notes

- This demo uses the actual privacy service, so it requires Firebase configuration
- The component is integrated into the main app via ProfileAndSecurity component
- Each tab shows placeholder content indicating future implementation tasks

## AuditLogPanelDemo

A standalone demo of the AuditLogPanel component that demonstrates:

### Features Implemented

- **Comprehensive Audit Logging**: AuditService logs all privacy-related actions
- **Interactive Log Viewing**: Filter and search through access logs
- **PDF Export**: Generate detailed audit reports with suspicious activity detection
- **Real-time Updates**: Logs update automatically as actions are performed
- **Suspicious Activity Detection**: Highlights unusual access patterns, failed attempts, and bulk data access
- **Advanced Filtering**: Filter by date range, action type, result status, and more

### Requirements Fulfilled

This component fulfills the following requirements from the privacy settings specification:
- **4.1**: Display chronological list of all data access events
- **4.2**: Filter access logs by specified criteria (date range, user, action type)
- **4.3**: Generate secure PDF reports with all requested log entries
- **4.4**: Highlight suspicious access patterns and recommend security actions
- **4.5**: Record log access events for audit purposes

### Usage

```tsx
import AuditLogPanelDemo from './components/__demo__/AuditLogPanelDemo';

function App() {
  return <AuditLogPanelDemo />;
}
```

### Testing Scenarios

1. **Log Viewing**: View chronological access logs with timestamps and details
2. **Filtering**: Apply various filters to narrow down log results
3. **Search**: Search through logs by accessor name, action, or resource type
4. **PDF Export**: Generate and download comprehensive audit reports
5. **Suspicious Activity**: View highlighted suspicious activity alerts
6. **Real-time Updates**: See logs update as new privacy actions are performed

### Integration

The AuditLogPanel is integrated into the main PrivacySettings component under the "Audit Logs" tab, providing users with comprehensive visibility into who has accessed their medical data and when.